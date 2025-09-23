import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    name: '홍길동',
    email: 'test@example.com',
    provider: 'google',
    provider_id: '1234567890',
  };

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  const mockAuthService = {
    generateTokens: jest.fn(),
    refreshAccessTokenForDevice: jest.fn(),
    removeCurrentDeviceSession: jest.fn(),
    getActiveDevices: jest.fn(),
    removeAllDeviceSessions: jest.fn(),
    removeDeviceSession: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleLogin', () => {
    it('should trigger Google OAuth', () => {
      expect(() => controller.googleLogin()).not.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockReq = { user: mockUser } as any;

      const result = controller.getProfile(mockReq);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getActiveDevices', () => {
    it('should return active devices', async () => {
      const mockDevices = [
        { id: '1', device_name: 'Chrome', is_active: true },
        { id: '2', device_name: 'Firefox', is_active: true },
      ];

      mockAuthService.getActiveDevices.mockResolvedValue(mockDevices);
      const mockReq = { user: { id: 1 } } as any;

      const result = await controller.getActiveDevices(mockReq);

      expect(result).toEqual({
        devices: mockDevices,
        total: mockDevices.length,
      });
      expect(mockAuthService.getActiveDevices).toHaveBeenCalledWith(1);
    });
  });

  describe('logoutAllOtherDevices', () => {
    it('should logout all other devices', async () => {
      const mockReq = {
        user: { id: 1 },
        cookies: { refresh_token: 'mock-token' }
      } as any;

      mockAuthService.removeAllDeviceSessions.mockResolvedValue(undefined);

      const result = await controller.logoutAllOtherDevices(mockReq);

      expect(result).toEqual({
        message: '다른 모든 기기에서 로그아웃되었습니다.'
      });
      expect(mockAuthService.removeAllDeviceSessions).toHaveBeenCalledWith(1, null);
    });
  });

  describe('logoutDevice', () => {
    it('should logout specific device', async () => {
      const mockReq = { user: { id: 1 } } as any;
      const deviceId = 'device-123';

      mockAuthService.removeDeviceSession.mockResolvedValue(undefined);

      const result = await controller.logoutDevice(mockReq, deviceId);

      expect(result).toEqual({
        message: `기기 ${deviceId}가 로그아웃되었습니다.`
      });
      expect(mockAuthService.removeDeviceSession).toHaveBeenCalledWith(1, deviceId);
    });

    it('should handle device logout error', async () => {
      const mockReq = { user: { id: 1 } } as any;
      const deviceId = 'device-123';

      mockAuthService.removeDeviceSession.mockRejectedValue(
        new Error('Device not found')
      );

      const result = await controller.logoutDevice(mockReq, deviceId);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Device not found',
        error: 'Bad Request'
      });
    });
  });
});