import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`만료된 토큰 ${result.count}개를 정리했습니다.`);
      }
    } catch (error) {
      this.logger.error('토큰 정리 중 오류 발생:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupInactiveTokens() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          last_used_at: {
            lt: thirtyDaysAgo,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`30일 이상 사용되지 않은 토큰 ${result.count}개를 정리했습니다.`);
      }
    } catch (error) {
      this.logger.error('비활성 토큰 정리 중 오류 발생:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async enforceDeviceLimit() {
    try {
      // 사용자별로 기기 수 제한 (최대 5개)
      const MAX_DEVICES_PER_USER = 5;

      const usersWithManyDevices = await this.prisma.refreshToken.groupBy({
        by: ['user_id'],
        where: {
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
        _count: {
          user_id: true,
        },
        having: {
          user_id: {
            _count: {
              gt: MAX_DEVICES_PER_USER,
            },
          },
        },
      });

      for (const userGroup of usersWithManyDevices) {
        // 가장 오래된 기기들을 제거
        const excessDevices = await this.prisma.refreshToken.findMany({
          where: {
            user_id: userGroup.user_id,
            is_active: true,
            expires_at: {
              gt: new Date(),
            },
          },
          orderBy: {
            last_used_at: 'asc',
          },
          take: userGroup._count.user_id - MAX_DEVICES_PER_USER,
        });

        if (excessDevices.length > 0) {
          await this.prisma.refreshToken.updateMany({
            where: {
              id: {
                in: excessDevices.map(device => device.id),
              },
            },
            data: {
              is_active: false,
            },
          });

          this.logger.log(
            `사용자 ${userGroup.user_id}의 초과 기기 ${excessDevices.length}개를 비활성화했습니다.`
          );
        }
      }
    } catch (error) {
      this.logger.error('기기 수 제한 적용 중 오류 발생:', error);
    }
  }

  async detectSuspiciousActivity(userId: number): Promise<boolean> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // 지난 1시간 내 여러 IP에서 로그인 시도
      const recentTokens = await this.prisma.refreshToken.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: oneHourAgo,
          },
        },
        select: {
          ip_address: true,
        },
      });

      const uniqueIPs = new Set(recentTokens.map(token => token.ip_address));

      // 1시간 내 3개 이상의 다른 IP에서 접속한 경우 의심스러운 활동으로 판단
      if (uniqueIPs.size >= 3) {
        this.logger.warn(`사용자 ${userId}에게서 의심스러운 활동이 감지되었습니다. IP 수: ${uniqueIPs.size}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('의심스러운 활동 감지 중 오류 발생:', error);
      return false;
    }
  }

  async forceLogoutUser(userId: number, reason: string = '보안상의 이유') {
    try {
      await this.prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });

      this.logger.warn(`사용자 ${userId}의 모든 세션이 ${reason}로 강제 종료되었습니다.`);
    } catch (error) {
      this.logger.error('강제 로그아웃 처리 중 오류 발생:', error);
    }
  }

  async getSecurityStats() {
    try {
      const [
        totalActiveSessions,
        uniqueActiveUsers,
        expiredTokens,
        suspiciousActivities
      ] = await Promise.all([
        this.prisma.refreshToken.count({
          where: {
            is_active: true,
            expires_at: {
              gt: new Date(),
            },
          },
        }),
        this.prisma.refreshToken.findMany({
          where: {
            is_active: true,
            expires_at: {
              gt: new Date(),
            },
          },
          distinct: ['user_id'],
        }).then(tokens => tokens.length),
        this.prisma.refreshToken.count({
          where: {
            expires_at: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.refreshToken.groupBy({
          by: ['user_id'],
          where: {
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 지난 24시간
            },
          },
          _count: {
            ip_address: true,
          },
          having: {
            ip_address: {
              _count: {
                gt: 2,
              },
            },
          },
        }).then(groups => groups.length),
      ]);

      return {
        totalActiveSessions,
        uniqueActiveUsers,
        expiredTokens,
        suspiciousActivities,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('보안 통계 조회 중 오류 발생:', error);
      return null;
    }
  }
}