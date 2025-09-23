import { Test, TestingModule } from '@nestjs/testing';
import { AuthCleanupService } from './auth-cleanup.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthCleanupService', () => {
  let service: AuthCleanupService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    refreshToken: {
      deleteMany: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCleanupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthCleanupService>(AuthCleanupService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired refresh tokens', async () => {
      const mockDeleteResult = { count: 5 };
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue(mockDeleteResult);

      await service.cleanupExpiredTokens();

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expires_at: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrismaService.refreshToken.deleteMany.mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw error
      await expect(service.cleanupExpiredTokens()).resolves.not.toThrow();
    });
  });

  describe('cleanupInactiveTokens', () => {
    it('should delete inactive tokens older than 30 days', async () => {
      const mockDeleteResult = { count: 3 };
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue(mockDeleteResult);

      await service.cleanupInactiveTokens();

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          last_used_at: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('enforceDeviceLimit', () => {
    it('should enforce device limit per user', async () => {
      const mockUsersWithManyDevices = [
        { user_id: 1, _count: { user_id: 7 } },
      ];
      const mockExcessDevices = [
        { id: 'device1', user_id: 1 },
        { id: 'device2', user_id: 1 },
      ];

      mockPrismaService.refreshToken.groupBy.mockResolvedValue(mockUsersWithManyDevices);
      mockPrismaService.refreshToken.findMany.mockResolvedValue(mockExcessDevices);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.enforceDeviceLimit();

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['device1', 'device2'],
          },
        },
        data: {
          is_active: false,
        },
      });
    });
  });
});