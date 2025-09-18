import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

export function setupSwagger(app: NestExpressApplication) {
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Community API')
    .setDescription('Community API with Google OAuth and JWT Authentication')
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
    },
    customSiteTitle: 'Community API Docs',
    customCssUrl: '/swagger/custom.css',
    customJs: ['/swagger/auth-buttons.js'],
  });

  console.log(`Swagger UI: http://localhost:${process.env.PORT || 3000}/doc`);
}