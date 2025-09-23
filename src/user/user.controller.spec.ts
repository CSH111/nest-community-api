import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUser = {
    id: 1,
    name: '홍길동',
    email: 'test@example.com',
    provider: 'google',
    provider_id: '1234567890',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserService = {
    findOne: jest.fn(),
    findUserPosts: jest.fn(),
    findUserComments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw HttpException when user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(mockUserService.findOne).toHaveBeenCalledWith(999);
    });

  });
});