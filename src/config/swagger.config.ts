import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

export function setupSwagger(app: NestExpressApplication) {
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('커뮤니티 API')
    .setDescription('google O-auth 및 JWT 인증 기반 커뮤니티 api입니다.')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addSecurity('AccessTokenAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'Access token (httpOnly, 15분 만료) - Google OAuth 인증 후 자동 설정',
    })
    .addSecurity('RefreshTokenAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'Refresh token (httpOnly, 7일 만료) - Google OAuth 인증 후 자동 설정',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      // 쿠키 기반 인증을 위한 요청 인터셉터
      requestInterceptor: (req) => {
        // 모든 요청에 credentials 포함
        req.credentials = 'include';
        return req;
      }
    },
    customSiteTitle: 'Community API Docs',
    customCssUrl: '/swagger/custom.css',
    // customJs: ['/swagger/auth-buttons.js', '/swagger/auth-interceptor.js'],
    customJs: ['/swagger/auth-buttons.js'],
  });

  console.log(`Swagger UI: http://localhost:${process.env.PORT || 3000}/doc`);
}