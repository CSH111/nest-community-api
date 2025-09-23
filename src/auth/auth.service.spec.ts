import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Mock bcrypt before any imports
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-token'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    name: '홍길동',
    email: 'test@example.com',
    provider: 'google',
    provider_id: '1234567890',
  };

  const mockDeviceInfo = {
    userAgent: 'Mozilla/5.0 Chrome',
    ip: '127.0.0.1',
    deviceType: 'desktop',
    deviceName: 'Chrome Browser',
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateGoogleUser', () => {
    it('should create new user if not exists', async () => {
      const googleProfile = {
        id: '1234567890',
        emails: [{ value: 'test@example.com' }],
        displayName: '홍길동',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: '홍길동',
          email: 'test@example.com',
          provider: 'google',
          provider_id: '1234567890',
        },
      });
    });

    it('should return existing user', async () => {
      const googleProfile = {
        id: '1234567890',
        emails: [{ value: 'test@example.com' }],
        displayName: '홍길동',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    it('should generate and store tokens', async () => {
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockResolvedValue('hashed-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.generateTokens(mockUser, mockDeviceInfo);

      expect(result).toEqual(mockTokens);
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('getActiveDevices', () => {
    it('should return active devices for user', async () => {
      const mockDevices = [
        {
          id: '1',
          device_name: 'Chrome Browser',
          device_type: 'desktop',
          last_used_at: new Date(),
          created_at: new Date(),
          ip_address: '127.0.0.1',
          is_active: true,
        },
      ];

      mockPrismaService.refreshToken.findMany.mockResolvedValue(mockDevices);

      const result = await service.getActiveDevices(1);

      expect(result).toEqual(mockDevices);
      expect(mockPrismaService.refreshToken.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
          expires_at: { gt: expect.any(Date) },
        },
        select: {
          id: true,
          device_id: true,
          is_active: true,
          user_id: true,
          device_name: true,
          device_type: true,
          last_used_at: true,
          created_at: true,
          ip_address: true,
        },
        orderBy: {
          last_used_at: 'desc',
        },
      });
    });
  });

  describe('removeAllDeviceSessions', () => {
    it('should deactivate all device sessions', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await service.removeAllDeviceSessions(1);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });
    });

    it('should deactivate all except current device', async () => {
      const currentDeviceId = 'current-device';
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await service.removeAllDeviceSessions(1, currentDeviceId);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
          device_id: { not: currentDeviceId },
        },
        data: {
          is_active: false,
        },
      });
    });
  });
});