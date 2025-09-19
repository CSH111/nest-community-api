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
}