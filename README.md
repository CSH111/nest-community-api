# community API

## 개요
 - NestJS 프레임워크를 학습하기 위해 만든 간단한 커뮤니티 게시판 REST API 서버입니다.

## API 문서
[https://devstacktrend.sungho.my/](https://community.sungho.my/doc)

## ERD
<img width="690" height="722" alt="image" src="https://github.com/user-attachments/assets/1d03b4ef-4b0b-479f-9796-7543ae2daf4a" />



## 구현, 개선 및 학습 사항

- NestJS 아키텍처 패턴 학습
    - Module, Controller, Service, Guard 등 계층형 아키텍처 구현
- 게시판 CRUD 및 댓글 시스템
    - 게시글/댓글 생성, 조회, 수정, 삭제 기능 구현
    - 대댓글 구조를 포함한 계층형 댓글 시스템
- 인증/인가 시스템
    - Google OAuth 2.0 기반 소셜 로그인
    - JWT 다중 세션 관리 및 토큰 로테이션
    - 기기별 세션 관리 및 원격 로그아웃 기능
- API 표준화 및 문서화
    - Swagger를 통한 자동 API 문서 생성
    - DTO 기반 요청/응답 검증 및 타입 안전성 확보
    - 글로벌 ValidationPipe 적용으로 데이터 검증 자동화
- 테스트 코드 작성
    - Unit Test: Service, Controller 계층별 단위 테스트
    - E2E Test: 실제 HTTP 요청 시뮬레이션 테스트
    - Mock을 활용한 의존성 격리 및 DB 독립적 테스트 환경 구축
- 데이터베이스 설계
    - Prisma ORM을 통한 타입 안전한 데이터베이스 접근
    - 관계형 데이터 모델링 및 마이그레이션 관리
