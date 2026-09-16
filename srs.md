# GIÁO TRÌNH PHÁT TRIỂN ỨNG DỤNG WEB NÂNG CAO

## Phiên bản V4

### Node.js + Next.js App Router

---

# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM

## Software Requirements Specification (SRS)

### Tiêu chuẩn IEEE 830/ISO/IEC/IEEE 29148:2018

**Dự án:** Blog Ẩm thực và Nấu ăn (_Culinary Blog_)
| **Ngày phát hành** | 04/06/2026[cite: 2] |
| **Công nghệ Backend** | Node.js 20 LTS, Express.js, TypeScript[cite: 2] |
| **Công nghệ Frontend** | Next.js App Router, TypeScript[cite: 2] |
| **Cơ sở dữ liệu** | PostgreSQL 16[cite: 2] |
| **Object Storage** | MinIO (S3-Compatible)[cite: 2] |
| **Cache** | Redis 7[cite: 2] |

## MỤC LỤC[cite: 2]

- [CHƯƠNG 1. GIỚI THIỆU](#chuong-1-gioi-thieu)[cite: 2]
  - [1.2. Phạm vi Sản phẩm](#12-pham-vi-san-pham)[cite: 2]
    - [1.2.1. Tên và Định danh](#121-ten-va-dinh-danh)[cite: 2]
    - [1.2.2. Mô tả Sản phẩm](#122-mo-ta-san-pham)[cite: 2]
    - [1.2.3. Những gì KHÔNG thuộc phạm vi](#123-nhung-gi-khong-thuoc-pham-vi)[cite: 2]
  - [1.5. Tổng quan Tài liệu](#15-tong-quan-tai-lieu)[cite: 2]
- [CHƯƠNG 2. MÔ TẢ TỔNG QUAN HỆ THỐNG](#chuong-2-mo-ta-tong-quan-he-thong)[cite: 2]
  - [2.1. Bối cảnh Sản phẩm](#21-boi-canh-san-pham)[cite: 2]
    - [2.1.1. Vị trí trong Hệ sinh thái](#211-vi-tri-trong-he-sinh-thai)[cite: 2]
    - [2.1.2. Quan hệ với Hệ thống Ngoài](#212-quan-he-voi-he-thong-ngoai)[cite: 2]
  - [2.2. Chức năng Sản phẩm Tổng quát](#22-chuc-nang-san-pham-tong-quat)[cite: 2]
  - [2.3. Các Lớp Người dùng và Đặc điểm](#23-cac-lop-nguoi-dung-va-dac-diem)[cite: 2]
  - [2.4. Môi trường Vận hành](#24-moi-truong-van-hanh)[cite: 2]
    - [2.4.1. Môi trường Server (Production)](#241-moi-truong-server-production)[cite: 2]
    - [2.4.2. Môi trường Phát triển (Development)](#242-moi-truong-phat-trien-development)[cite: 2]
    - [2.4.3. Yêu cầu Trình duyệt Client](#243-yeu-cau-trinh-duyet-client)[cite: 2]
  - [2.5. Ràng buộc Thiết kế và Hiện thực](#25-rang-buoc-thiet-ke-va-hien-thuc)[cite: 2]
  - [2.6. Giả định và Phụ thuộc](#26-gia-dinh-va-phu-thuoc)[cite: 2]
    - [2.6.1. Giả định](#261-gia-dinh)[cite: 2]
    - [2.6.2. Phụ thuộc Bên ngoài](#262-phu-thuoc-ben-ngoai)[cite: 2]
- [CHƯƠNG 3. YÊU CẦU CHỨC NĂNG CHI TIẾT](#chuong-3-yeu-cau-chuc-nang-chi-tiet)[cite: 2]
  - [3.1. Module Xác thực và Quản lý Người dùng (FR-AUTH)](#31-module-xac-thuc-va-quan-ly-nguoi-dung-fr-auth)[cite: 2]
  - [3.2. Module Quản lý Danh mục (FR-CAT)](#32-module-quan-ly-danh-muc-fr-cat)[cite: 2]
  - [3.3. Module Quản lý Công thức Nấu ăn (FR-RCP)](#33-module-quan-ly-cong-thuc-nau-an-fr-rcp)[cite: 2]
  - [3.4. Module Tìm kiếm và Phân trang (FR-SRCH)](#34-module-tim-kiem-va-phan-trang-fr-srch)[cite: 2]
  - [3.5. Module Quản lý Tệp tin (FR-FILE)](#35-module-quan-ly-tep-tin-fr-file)[cite: 2]
  - [3.6. Module Background Jobs (FR-JOB)](#36-module-background-jobs-fr-job)[cite: 2]
  - [3.7. Module Quan sát Hệ thống (FR-OBS)](#37-module-quan-sat-he-thong-fr-obs)[cite: 2]
- [4. Yêu cầu Phi Chức năng (NFR)](#4-yeu-cau-phi-chuc-nang-nfr)[cite: 2]
  - [4.1. Hiệu năng (NFR-PERF)](#41-hieu-nang-nfr-perf)[cite: 2]
  - [4.2. Bảo mật (NFR-SEC)](#42-bao-mat-nfr-sec)[cite: 2]
  - [4.3. Khả năng Sử dụng (NFR-USE)](#43-kha-nang-su-dung-nfr-use)[cite: 2]
  - [4.4. Độ tin cậy (NFR-REL)](#44-do-tin-cay-nfr-rel)[cite: 2]
  - [4.5. Khả năng Bảo trì (NFR-MAINT)](#45-kha-nang-bao-tri-nfr-maint)[cite: 2]
  - [4.6. Khả năng Mở rộng (NFR-SCALE)](#46-kha-nang-mo-rong-nfr-scale)[cite: 2]
  - [4.7. Tối ưu SEO (NFR-SEO)](#47-toi-uu-seo-nfr-seo)[cite: 2]
- [5. Yêu cầu Giao diện Ngoài](#5-yeu-cau-giao-dien-ngoai)[cite: 2]
- [6. Kiến trúc Hệ thống](#6-kien-truc-he-thong)[cite: 2]
- [7. Mô hình Dữ liệu](#7-mo-hinh-du-lieu)[cite: 2]
- [8. Đặc tả REST API](#8-dac-ta-rest-api)[cite: 2]
- [Phụ lục A - HTTP Status Codes](#phu-luc-a---http-status-codes)[cite: 2]
- [Phụ lục B - Application Error Codes](#phu-luc-b---application-error-codes)[cite: 2]
- [Phụ lục C – Từ điển Thuật ngữ](#phu-luc-c--tu-dien-thuat-ngu)[cite: 2]

---

## CHƯƠNG 1. GIỚI THIỆU[cite: 2]

#### 1.2.1. Tên và Định danh[cite: 2]

| Thuộc tính             | Giá trị                                                    |
| :--------------------- | :--------------------------------------------------------- |
| **Tên sản phẩm**       | Culinary Blog – Blog Ẩm thực và Nấu ăn[cite: 2]            |
| **Định danh dự án**    | CULINARY-BLOG-V1[cite: 2]                                  |
| **Loại hệ thống**      | Ứng dụng Web Full-Stack (API-Driven Architecture)[cite: 2] |
| **Phiên bản sản phẩm** | 1.0.0[cite: 2]                                             |
| **Môi trường đích**    | Cloud/On-premise (Docker Compose + Nginx)[cite: 2]         |

#### 1.2.2. Mô tả Sản phẩm[cite: 2]

Culinary Blog là một nền tảng web cho phép người dùng chia sẻ, khám phá và lưu trữ các công thức nấu ăn từ nhiều nền ẩm thực khác nhau. Ứng dụng cung cấp hệ sinh thái hoàn chỉnh bao gồm:[cite: 2]

- **Nền tảng chia sẻ công thức:** Tác giả (Author) đăng tải công thức với hình ảnh, danh sách nguyên liệu chi tiết, hướng dẫn từng bước thực hiện và thông tin dinh dưỡng.[cite: 2]
- **Tổ chức nội dung:** Phân loại công thức theo danh mục (Category), độ khó (Difficulty Level), thời gian chuẩn bị và nấu.[cite: 2]
- **Tìm kiếm thông minh:** Full-Text Search tiếng Việt sử dụng PostgreSQL `tsvector`/`tsquery` với `unaccent` extension.[cite: 2]
- **Bảo mật đa lớp:** Xác thực JWT stateless, phân quyền theo vai trò (RBAC) và theo tài nguyên (Resource-Based Authorization), đăng nhập Google OAuth 2.0.[cite: 2]
- **Tối ưu hiệu năng và SEO:** Redis distributed cache, Next.js ISR, Open Graph Protocol, JSON-LD Schema.org Recipe markup.[cite: 2]
- **Quan sát hệ thống:** Structured logging (Pino), distributed tracing (OpenTelemetry), health check endpoints.[cite: 2]

#### 1.2.3. Những gì KHÔNG thuộc phạm vi[cite: 2]

Các tính năng sau đây nằm ngoài phạm vi phiên bản 1.0.0:[cite: 2]

- Hệ thống bình luận (Comment System) và đánh giá sao (Rating System).[cite: 2]
- Tính năng lưu/đánh dấu công thức yêu thích (Bookmark/Favorite).[cite: 2]
- Thông báo real-time (SignalR/WebSocket).[cite: 2]
- Ứng dụng di động native (iOS/Android).[cite: 2]
- Thanh toán / Tính năng thương mại điện tử.[cite: 2]
- Hệ thống nhắn tin trực tiếp giữa người dùng.[cite: 2]
- GraphQL API (định hướng sau khóa học).[cite: 2]

### 1.5. Tổng quan Tài liệu[cite: 2]

- **Chương 2 – Mô tả Tổng quan:** Bối cảnh sản phẩm, chức năng tóm tắt, các lớp người dùng, môi trường vận hành và ràng buộc thiết kế.[cite: 2]
- **Chương 3 – Yêu cầu Chức năng:** 27 FR được đặc tả chi tiết theo format chuẩn, nhóm thành 7 module chức năng.[cite: 2]
- **Chương 4 – Yêu cầu Phi chức năng:** Hiệu năng, bảo mật, khả năng sử dụng, độ tin cậy, khả năng bảo trì/mở rộng và SEO.[cite: 2]
- **Chương 5 – Giao diện Ngoài:** Tích hợp với các hệ thống và dịch vụ ngoài (Google OAuth, MinIO, Redis, SendGrid).[cite: 2]
- **Chương 6 – Kiến trúc Hệ thống:** Clean Architecture Backend, Next.js App Router Frontend, chiến lược caching và deployment.[cite: 2]
- **Chương 7 – Mô hình Dữ liệu:** ERD mô tả văn bản và bảng định nghĩa chi tiết từng entity/table.[cite: 2]
- **Chương 8 – Đặc tả API REST:** Quy ước, chuẩn lỗi RFC 7807, và bảng tổng hợp tất cả ~30 endpoint.[cite: 2]
- **Phụ lục A-C:** HTTP Status Codes, Application Error Codes, và Từ điển thuật ngữ.[cite: 2]

---

## CHƯƠNG 2. MÔ TẢ TỔNG QUAN HỆ THỐNG[cite: 2]

### 2.1. Bối cảnh Sản phẩm[cite: 2]

#### 2.1.1. Vị trí trong Hệ sinh thái[cite: 2]

Culinary Blog vận hành theo mô hình API-Driven Architecture, trong đó Backend (Node.js/Express.js) và Frontend (Next.js) là hai hệ thống độc lập giao tiếp hoàn toàn qua HTTP/JSON RESTful API.[cite: 2] Không có server-side rendering truyền thống hay shared view engine giữa hai tầng.[cite: 2]

Sơ đồ bối cảnh hệ thống (Context Diagram):[cite: 2]

```
┌─────────────────────────────────────────────────────────────────┐
│                    CULINARY BLOG SYSTEM                         │
│                                                                 │
│   ┌──────────────────┐        ┌───────────────────────────────┐  │
│   │  NEXT.JS FRONTEND│◄──────►│  NODE.JS/EXPRESS API         │  │
│   │  (App Router)    │  REST  │  (Express.js + Clean Arch)    │  │
│   │  Port: 3000      │  JSON  │  Port: 5000                  │  │
│   └──────────────────┘        └──────────────┬────────────────┘  │
│                                             │                  │
│   ┌──────┐ ┌────────┐  ┌────────┐  ┌────────┐ ┌───────────┐   │
│   │ Pgsql│ │ Redis  │  │ MinIO  │  │ BullMQ │ │Google Auth│   │
│   │:5432 │ │:6379   │  │:9000   │  │ Jobs   │ │ OAuth2.0  │   │
│   └──────┘ └────────┘  └────────┘  └────────┘ └───────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Hình 2.1.** Sơ đồ bối cảnh hệ thống Culinary Blog[cite: 2]

#### 2.1.2. Quan hệ với Hệ thống Ngoài[cite: 2]

| Hệ thống Ngoài | Vai trò | Giao thức / Chuẩn | Hướng tích hợp |
|---|---|---|---|
| PostgreSQL 16 | Hệ quản trị CSDL quan hệ chính (RDBMS) | TCP + pg / Prisma Client | Backend → PostgreSQL[cite: 2] |
| Redis 7 | Distributed Cache & Session Store | TCP + ioredis | Backend → Redis[cite: 2] |
| MinIO (S3) | Object Storage cho ảnh công thức | HTTP/S3 API + @aws-sdk/client-s3 | Backend → MinIO[cite: 2] |
| Google OAuth 2.0 | Đăng nhập bên thứ ba (Identity Provider) | HTTPS + OpenID Connect | Client ↔ Google ↔ Backend[cite: 2] |
| BullMQ | Background Job Processing | Redis làm queue backend | Backend (internal)[cite: 2] |
| Pino / Seq | Structured Log Aggregation (development) | HTTP Sink → Seq | Backend → Seq[cite: 2] |
| OpenTelemetry Collector | Distributed Tracing & Metrics (production) | OTLP / gRPC | Backend → Collector[cite: 2] |
| Nginx (Reverse Proxy) | SSL termination, load balancing, static serving | HTTP/HTTPS | Client → Nginx → Services[cite: 2] |

### 2.2. Chức năng Sản phẩm Tổng quát[cite: 2]

Culinary Blog cung cấp 7 nhóm chức năng chính, được hiện thực hóa qua 27 Functional Requirements chi tiết tại Chương 3:[cite: 2]

| Nhóm chức năng | Mã nhóm | Số FR | Mô tả tóm tắt |
|---|---|---|---|
| Xác thực & Quản lý Người dùng | FR-AUTH | 7 | Đăng ký, đăng nhập (email + Google), JWT refresh token, logout, quản lý profile.[cite: 2] |
| Quản lý Danh mục | FR-CAT | 5 | CRUD danh mục công thức (Category) – phân quyền Admin.[cite: 2] |
| Quản lý Công thức nấu ăn | FR-RCP | 10 | CRUD recipe, publish/archive, quản lý ảnh/bước/nguyên liệu.[cite: 2] |
| Tìm kiếm & Phân trang | FR-SRCH | 4 | Full-Text Search (PostgreSQL), filter, sort, offset pagination.[cite: 2] |
| Quản lý Tệp tin | FR-FILE | 2 | Upload/Delete ảnh trên MinIO S3-compatible.[cite: 2] |
| Background Jobs | FR-JOB | 3 | Email chào mừng, thumbnail generation, sitemap XML (BullMQ).[cite: 2] |
| Quan sát Hệ thống | FR-OBS | 3 | Health checks, structured logging, distributed tracing.[cite: 2] |

### 2.3. Các Lớp Người dùng và Đặc điểm[cite: 2]

Hệ thống định nghĩa 3 loại tác nhân (Actor) với quyền hạn khác nhau:[cite: 2]

| Vai trò | Mô tả | Điều kiện | Quyền hạn chính | Ưu tiên phục vụ |
|---|---|---|---|---|
| Khách (Guest / Anonymous) | Người dùng chưa xác thực, truy cập ứng dụng mà không có tài khoản. | Không cần tài khoản | Xem danh sách & chi tiết recipe (Published), xem danh mục, tìm kiếm. KHÔNG được tạo/sửa/xóa.[cite: 2] | Cao (đây là đại đa số người dùng) |
| Tác giả (Author) | Người dùng đã đăng ký và xác thực thành công. Được tự động gán khi đăng ký. | Có tài khoản & JWT hợp lệ | + Tất cả quyền của Guest. + Tạo/sửa/xóa recipe CỦA MÌNH. + Upload ảnh, quản lý steps/ingredients. + Publish/Archive recipe của mình.[cite: 2] | Cao (nhà sản xuất nội dung) |
| Quản trị viên (Admin) | Người quản lý hệ thống với quyền cao nhất. Được gán thủ công qua database seeding. | Có tài khoản & role Admin | + Tất cả quyền của Author. + Quản lý (CRUD) danh mục. + Sửa/xóa bất kỳ recipe của bất kỳ Author. + Truy cập BullMQ Dashboard (bull-board). + Xem structured logs.[cite: 2] | Trung bình (số lượng ít) |

**Ghi chú về phân quyền:** Hệ thống triển khai 3 tầng phân quyền.[cite: 2] (1) Role-Based Authorization: phân biệt quyền dựa trên role (Guest/Author/Admin).[cite: 2] (2) Resource-Based Authorization: Author chỉ sửa/xóa được recipe của chính mình (AuthorId == currentUserId).[cite: 2] (3) Policy-Based Authorization: Policy "VerifiedAuthor" yêu cầu email đã xác nhận.[cite: 2] Admin có quyền bypass resource ownership check.[cite: 2]

### 2.4. Môi trường Vận hành[cite: 2]

#### 2.4.1. Môi trường Server (Production)[cite: 2]

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị | Ghi chú |
|---|---|---|---|
| Hệ điều hành | Linux Ubuntu 22.04 LTS / Debian 12 | Ubuntu 22.04 LTS / Debian 12 | Docker phải được cài đặt[cite: 2] |
| Node.js Runtime | Node.js 20 LTS (node:20-alpine) | Node.js 20.x latest patch | Cung cấp qua Docker image node:20-alpine[cite: 2] |
| Node.js (build only) | Node.js 20 LTS | Node.js 22 LTS | Chỉ cần lúc build Next.js; production dùng standalone output[cite: 2] |
| PostgreSQL | PostgreSQL 16.x | PostgreSQL 16.x | Extensions: unaccent, pg_trgm bắt buộc[cite: 2] |
| Redis | Redis 7.x | Redis 7.2.x | Persistent mode với AOF[cite: 2] |
| MinIO | MinIO RELEASE.2024+ | MinIO latest stable | Bucket policy: public-read cho recipe images[cite: 2] |
| Docker | Docker Engine 24.x | Docker Engine 27.x + Compose v2 | Docker Compose cho local dev và staging[cite: 2] |
| Nginx | Nginx 1.24+ | Nginx 1.26+ (stable) | Reverse proxy, SSL termination[cite: 2] |
| RAM | 4 GB minimum | 8 GB+ | RAM cần tăng nếu Redis cache lớn[cite: 2] |
| CPU | 2 vCPU minimum | 4 vCPU+ | CPU-intensive: FTS indexing, image processing[cite: 2] |
| Disk | 20 GB SSD minimum | 50 GB+ SSD | MinIO object storage tốn nhiều disk[cite: 2] |

#### 2.4.2. Môi trường Phát triển (Development)[cite: 2]

| Thành phần | Yêu cầu |
|---|---|
| Node.js | Node.js 20+ LTS với npm 10+[cite: 2] |
| Docker Desktop | Docker Desktop 4.x+ (Windows/macOS) hoặc Docker Engine (Linux) – để chạy PostgreSQL, Redis, MinIO local[cite: 2] |
| IDE / Editor | VS Code (với ESLint, Prettier extensions) / WebStorm[cite: 2] |
| Git | Git 2.40+ với Git LFS (nếu lưu asset lớn)[cite: 2] |
| Postman / Scalar | Postman hoặc Scalar UI (tích hợp sẵn, chạy tại /scalar) để test API[cite: 2] |

#### 2.4.3. Yêu cầu Trình duyệt Client[cite: 2]

| Trình duyệt | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Google Chrome | 90+ | Khuyến nghị chính – tốt nhất cho Developer Tools[cite: 2] |
| Mozilla Firefox | 88+ | Hỗ trợ đầy đủ[cite: 2] |
| Microsoft Edge | 90+ (Chromium) | Hỗ trợ đầy đủ (Chromium-based)[cite: 2] |
| Safari | 14+ (macOS 11+) | Hỗ trợ đầy đủ; Safari 13 trở xuống KHÔNG đảm bảo[cite: 2] |
| Mobile Chrome (Android) | 90+ | Responsive design, touch-friendly[cite: 2] |
| Mobile Safari (iOS) | iOS 14+ | Hỗ trợ đầy đủ[cite: 2] |
| Internet Explorer | Mọi phiên bản | KHÔNG hỗ trợ (EOL)[cite: 2] |

### 2.5. Ràng buộc Thiết kế và Hiện thực[cite: 2]

Các ràng buộc sau đây là bắt buộc và không thể thương lượng trong suốt quá trình phát triển:[cite: 2]

| Mã ràng buộc | Loại | Mô tả ràng buộc |
|---|---|---|
| CONS-001 | Kiến trúc | Backend PHẢI tuân thủ Clean Architecture với 4 tầng riêng biệt: Domain, Application, Infrastructure, Presentation. Tầng Domain không được phụ thuộc bất kỳ thư viện ngoài nào.[cite: 2] |
| CONS-002 | Pattern | CQRS với custom command bus là pattern bắt buộc cho tầng Application. Mỗi use case được hiện thực dưới dạng Command hoặc Query Handler riêng biệt.[cite: 2] |
| CONS-003 | Ngôn ngữ / Framework | Backend: Node.js/Express.js (TypeScript, không dùng MVC framework). Frontend: Next.js App Router (không dùng Pages Router).[cite: 2] |
| CONS-004 | Bảo mật | Xác thực PHẢI sử dụng JWT stateless (access token 15 phút, refresh token 7 ngày). Mật khẩu PHẢI được hash với bcrypt (Argon2id).[cite: 2] |
| CONS-005 | API Design | API PHẢI tuân thủ RESTful design. Phản hồi lỗi PHẢI theo RFC 7807 (application/problem+json). API versioning qua URL path (/api/v1/).[cite: 2] |
| CONS-006 | Database | PostgreSQL là DBMS duy nhất. Migrations qua Prisma Migrate. Không viết raw SQL trực tiếp (dùng Prisma Client, hoặc Raw SQL có parameterization qua Prisma $queryRaw).[cite: 2] |
| CONS-007 | File Upload | Kích thước tệp tải lên tối đa 5 MB. Định dạng chỉ chấp nhận: image/jpeg, image/png, image/webp, image/avif. Kiểm tra MIME type (không chỉ extension).[cite: 2] |
| CONS-008 | Validation | Input validation PHẢI qua Zod kết hợp command bus pipeline middleware. Không validation trong Route handler.[cite: 2] |
| CONS-009 | Container | Ứng dụng PHẢI được đóng gói Docker. Dockerfile multi-stage build (builder → node:20-alpine runtime). Docker Compose cho local development.[cite: 2] |
| CONS-010 | Logging | Structured logging với Pino là bắt buộc. Mọi log entry PHẢI có CorrelationId, RequestPath, UserId (khi đã xác thực).[cite: 2] |

### 2.6. Giả định và Phụ thuộc[cite: 2]

#### 2.6.1. Giả định[cite: 2]

- Môi trường development có kết nối Internet để pull Docker images và package npm.[cite: 2]
- PostgreSQL, Redis và MinIO được cung cấp qua Docker Compose trong development và dưới dạng managed service (hoặc VPS) trong production.[cite: 2]
- Người dùng cuối có trình duyệt hiện đại và kết nối Internet đủ ổn định để load ảnh từ MinIO.[cite: 2]
- Dữ liệu test (seed) được tạo bằng thư viện @faker-js/faker với 50 recipe mẫu và 5 tác giả mẫu.[cite: 2]
- Email service (SendGrid hoặc SMTP) được cấu hình sẵn khi triển khai production để gửi email chào mừng.[cite: 2]
- Giới hạn dữ liệu kỳ vọng (initial scale): ≤ 10,000 công thức, ≤ 5,000 người dùng, ≤ 50 danh mục – phù hợp với single-server deployment.[cite: 2]

#### 2.6.2. Phụ thuộc Bên ngoài[cite: 2]

| Phụ thuộc | Phiên bản | Mức độ ảnh hưởng nếu không khả dụng | Kế hoạch dự phòng |
|---|---|---|---|
| Google OAuth 2.0 API | v2 (OpenID Connect) | Cao – Mất chức năng đăng nhập Google | Vẫn có đăng nhập email/password. Hiển thị thông báo "Google login tạm thời không khả dụng".[cite: 2] |
| MinIO / S3 | MinIO RELEASE.2024+ | Cao – Không upload/xem được ảnh | Fallback về local FileSystem storage (development only). Production cần MinIO.[cite: 2] |
| Redis | 7.x | Trung bình – Mất cache, hiệu năng giảm | Hệ thống tiếp tục hoạt động nhưng mọi request đều query database. Cache miss graceful degradation.[cite: 2] |
| PostgreSQL | 16.x | Rất cao – Toàn bộ hệ thống ngừng | Backup định kỳ (pg_dump). Readiness probe sẽ fail, Nginx trả 503.[cite: 2] |
| BullMQ (qua Redis) | latest | Thấp – Background jobs không chạy | Fire-and-forget jobs sẽ bị mất; Recurring jobs bỏ qua chu kỳ. Không ảnh hưởng core functionality.[cite: 2] |

---

## CHƯƠNG 3. YÊU CẦU CHỨC NĂNG CHI TIẾT[cite: 2]

Chương này đặc tả chi tiết 27 Functional Requirements (FR) được nhóm thành 7 module chức năng.[cite: 2] Mỗi FR được mô tả theo template chuẩn bao gồm: Mã yêu cầu, Tên, Nhóm chức năng, Tác nhân, Mức ưu tiên (MoSCoW), Mô tả, Điều kiện tiên quyết, Luồng chính, Luồng thay thế/Ngoại lệ, HTTP Endpoint, Kết quả mong đợi và HTTP Status Code.[cite: 2]

Quy ước mức ưu tiên MoSCoW: M (Must Have – Bắt buộc), S (Should Have – Nên có), C (Could Have – Có thể có), W (Won't Have – Không trong scope hiện tại).[cite: 2]

### 3.1. Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]

Module này quản lý toàn bộ vòng đời xác thực người dùng: từ đăng ký, đăng nhập đa phương thức, duy trì phiên làm việc với cơ chế token rotation, đến quản lý hồ sơ cá nhân.[cite: 2] Backend sử dụng Passport.js (local + Google OAuth strategy) kết hợp JWT và bcrypt.[cite: 2]

#### FR-AUTH-001: Đăng ký Tài khoản (User Registration)[cite: 2]

|                    |                                                          |
| ------------------ | -------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-001[cite: 2]                                     |
| **Tên yêu cầu**    | Đăng ký Tài khoản Mới[cite: 2]                           |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2] |
| **Tác nhân**       | Khách (Guest / Anonymous User)[cite: 2]                  |
| **Mức ưu tiên**    | M – Must Have (Bắt buộc)[cite: 2]                        |

**Mô tả:**[cite: 2]

Hệ thống cho phép người dùng chưa có tài khoản tạo một tài khoản mới bằng cách cung cấp thông tin cơ bản.[cite: 2] Sau khi đăng ký thành công, người dùng tự động được gán role "Author" và nhận bộ token để truy cập ngay lập tức (auto-login sau đăng ký).[cite: 2] Hệ thống kích hoạt job gửi email chào mừng bất đồng bộ qua BullMQ.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng chưa đăng nhập vào hệ thống.[cite: 2]
2. Endpoint POST /api/v1/auth/register đang hoạt động.[cite: 2]
3. PostgreSQL database đang kết nối thành công.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Người dùng (client) gửi HTTP POST đến /api/v1/auth/register với JSON body: `{ "fullName": "...", "email": "...", "userName": "...", "password": "..." }`.[cite: 2]
2. RegisterCommand được tạo và dispatch đến custom command bus.[cite: 2]
3. Zod validation middleware chạy RegisterCommandValidator: kiểm tra fullName không rỗng, email đúng format, userName không chứa ký tự đặc biệt, password tối thiểu 8 ký tự (1 chữ hoa, 1 chữ số, 1 ký tự đặc biệt).[cite: 2]
4. RegisterCommandHandler kiểm tra email chưa tồn tại trong database: `prisma.user.findUnique({ where: { email } })`.[cite: 2]
5. Tạo user mới: `bcrypt.hash(password, 12)` sau đó `prisma.user.create({ data: { fullName, email, userName, passwordHash } })`.[cite: 2]
6. `prisma.userRole.create({ data: { userId: user.id, roleId: authorRoleId } })` – gán role mặc định.[cite: 2]
7. `jwt.sign({ sub: user.id, email, roles }, JWT_SECRET, { expiresIn: '15m' })` – tạo JWT access token.[cite: 2]
8. `crypto.randomBytes(64).toString('hex')` – tạo refresh token ngẫu nhiên.[cite: 2]
9. Lưu RefreshToken vào database qua `prisma.refreshToken.create()`.[cite: 2]
10. `welcomeEmailQueue.add('welcome', { userId: user.id, email })` – đẩy job gửi email chào mừng vào BullMQ queue (fire-and-forget).[cite: 2]
11. Trả về HTTP 201 Created với AuthResponseDto: `{ accessToken, refreshToken, expiresAt, user: { id, fullName, email, userName, avatarUrl, roles } }`.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Email đã tồn tại: Tại bước 4, nếu email đã được đăng ký → trả HTTP 409 Conflict với RFC 7807 body.[cite: 2]
- A2 – Password không đủ mạnh: Tại bước 3 hoặc 5, bcrypt hash fail → trả HTTP 422 Unprocessable Entity với danh sách lỗi chi tiết.[cite: 2]
- A3 – Dữ liệu đầu vào không hợp lệ: Tại bước 3, Zod validation fail → HTTP 422 với từng field lỗi (theo RFC 7807).[cite: 2]
- A4 – Database không kết nối: Prisma ném error → HTTP 500 Internal Server Error (global error handler log lỗi, không expose stack trace).[cite: 2]

|                            |                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/auth/register[cite: 2]                                                                                                                                                      |
| **Kết quả mong đợi**       | Tài khoản mới được tạo, role "Author" được gán, refresh token được persist, email chào mừng được đẩy vào BullMQ queue.[cite: 2] Client nhận được access token và refresh token.[cite: 2] |
| **HTTP Status Code**       | 201 Created – Đăng ký thành công. 409 Conflict – Email đã tồn tại. 422 Unprocessable Entity – Dữ liệu không hợp lệ. 500 Internal Server Error – Lỗi hệ thống.[cite: 2]                   |

#### FR-AUTH-002: Đăng nhập bằng Email/Mật khẩu (Local Login)[cite: 2]

|                    |                                                                 |
| ------------------ | --------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-002[cite: 2]                                            |
| **Tên yêu cầu**    | Đăng nhập bằng Email và Mật khẩu[cite: 2]                       |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]        |
| **Tác nhân**       | Tác giả đã đăng ký (Author) hoặc Quản trị viên (Admin)[cite: 2] |
| **Mức ưu tiên**    | M – Must Have (Bắt buộc)[cite: 2]                               |

**Mô tả:**[cite: 2]

Hệ thống cho phép người dùng đã có tài khoản đăng nhập bằng email và mật khẩu.[cite: 2] Mỗi lần đăng nhập thành công tạo ra một cặp access token mới (JWT, 15 phút) và refresh token mới (7 ngày).[cite: 2] Cơ chế Token Rotation: refresh token cũ KHÔNG bị xóa ngay mà được đánh dấu đã sử dụng (để phát hiện token reuse attack).[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đã có tài khoản hợp lệ trong hệ thống.[cite: 2]
2. Tài khoản chưa bị khóa (isActive = true).[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi POST /api/v1/auth/login với body: `{ "email": "...", "password": "..." }`.[cite: 2]
2. LoginCommand được dispatch qua custom command bus.[cite: 2]
3. Zod validation middleware kiểm tra email format và password không rỗng.[cite: 2]
4. LoginCommandHandler tìm user: `prisma.user.findUnique({ where: { email } })`.[cite: 2]
5. Xác minh mật khẩu: `bcrypt.compare(password, user.passwordHash)`.[cite: 2]
6. Kiểm tra tài khoản không bị khóa: `user.isActive === true`.[cite: 2]
7. Tạo access token mới: `jwt.sign({ sub: user.id, email, roles }, JWT_SECRET, { expiresIn: '15m' })`.[cite: 2]
8. Tạo refresh token mới: `crypto.randomBytes(64).toString('hex')`.[cite: 2]
9. Lưu refresh token mới vào database.[cite: 2]
10. Trả về HTTP 200 OK với AuthResponseDto.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Tài khoản không tồn tại hoặc mật khẩu sai: HTTP 401 Unauthorized với message generic "Email hoặc mật khẩu không đúng" (KHÔNG tiết lộ tài khoản có tồn tại hay không – tránh User Enumeration Attack).[cite: 2]
- A2 – Tài khoản bị khóa (isActive = false): HTTP 403 Forbidden.[cite: 2]
- A3 – Vượt quá số lần thử sai (5 lần): accessFailedCount tăng lên, sau 5 lần → tài khoản bị khóa tạm thời.[cite: 2]

|                            |                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | POST /api/v1/auth/login[cite: 2]                                                                                                                                   |
| **Kết quả mong đợi**       | Access token và refresh token mới được tạo và trả về. Refresh token được lưu vào database.[cite: 2]                                                                |
| **HTTP Status Code**       | 200 OK – Đăng nhập thành công. 401 Unauthorized – Sai email/mật khẩu. 422 Unprocessable Entity – Dữ liệu không hợp lệ. 403 Forbidden – Tài khoản bị khóa.[cite: 2] |

#### FR-AUTH-003: Đăng nhập bằng Google OAuth 2.0[cite: 2]

|                    |                                                                              |
| ------------------ | ---------------------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-003[cite: 2]                                                         |
| **Tên yêu cầu**    | Đăng nhập / Đăng ký bằng Google OAuth 2.0[cite: 2]                           |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]                     |
| **Tác nhân**       | Khách (Guest) – lần đầu / Người dùng đã đăng ký trước đó qua Google[cite: 2] |
| **Mức ưu tiên**    | S – Should Have[cite: 2]                                                     |

**Mô tả:**[cite: 2]

Hệ thống hỗ trợ đăng nhập qua tài khoản Google sử dụng OAuth 2.0 Authorization Code Flow với PKCE.[cite: 2] Nếu đây là lần đăng nhập Google đầu tiên, hệ thống tự động tạo tài khoản mới từ thông tin Google profile (email, display name, avatar URL) và gán role "Author".[cite: 2] Nếu email đã tồn tại từ đăng ký thủ công trước đó, hệ thống liên kết Google login với tài khoản hiện có.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Google OAuth 2.0 Credentials (ClientId, ClientSecret) đã được cấu hình trong .env.[cite: 2]
2. Redirect URI đã được đăng ký trong Google Cloud Console.[cite: 2]
3. Người dùng có tài khoản Google hợp lệ.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Frontend (Next.js) redirect người dùng đến Google Authorization Endpoint với scopes: openid, email, profile.[cite: 2]
2. Người dùng xác nhận cấp quyền trên Google Consent Screen.[cite: 2]
3. Google redirect về callback URL (Next.js) với Authorization Code.[cite: 2]
4. Auth.js v5 (Next.js) xử lý callback, lấy access token từ Google và lấy profile.[cite: 2]
5. Frontend gửi POST /api/v1/auth/google với Google ExternalLoginInfo.[cite: 2]
6. GoogleLoginCommandHandler tìm user: `prisma.user.findFirst({ where: { googleId: providerKey } })`.[cite: 2]
7. Nếu chưa có tài khoản: kiểm tra email → nếu email chưa tồn tại thì tạo user mới từ Google profile, gán role "Author" → lưu liên kết Google.[cite: 2]
8. Nếu email đã tồn tại (đã đăng ký thủ công): liên kết Google login với tài khoản hiện có.[cite: 2]
9. Tạo access token và refresh token, lưu vào database.[cite: 2]
10. Trả về HTTP 200 OK với AuthResponseDto.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Google token không hợp lệ hoặc hết hạn: HTTP 401 Unauthorized.[cite: 2]
- A2 – Email Google bị revoke quyền: HTTP 400 Bad Request.[cite: 2]
- A3 – Google API không khả dụng: HTTP 502 Bad Gateway.[cite: 2]

|                            |                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/auth/google[cite: 2]                                                                                                               |
| **Kết quả mong đợi**       | Người dùng được đăng nhập (hoặc tự động đăng ký), nhận AuthResponseDto.[cite: 2]                                                                |
| **HTTP Status Code**       | 200 OK – Đăng nhập/đăng ký thành công. 401 Unauthorized – Token Google không hợp lệ. 400 Bad Request – Thiếu thông tin Google profile.[cite: 2] |

#### FR-AUTH-004: Làm mới Access Token (Token Refresh)[cite: 2]

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-004[cite: 2]                                                        |
| **Tên yêu cầu**    | Làm mới Access Token bằng Refresh Token[cite: 2]                            |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]                    |
| **Tác nhân**       | Tác giả (Author) / Quản trị viên (Admin) – có refresh token hợp lệ[cite: 2] |
| **Mức ưu tiên**    | M – Must Have (Bắt buộc)[cite: 2]                                           |

**Mô tả:**[cite: 2]

Khi access token hết hạn (sau 15 phút), client sử dụng refresh token còn hiệu lực để lấy cặp token mới mà không cần người dùng đăng nhập lại.[cite: 2] Cơ chế Token Rotation bắt buộc: mỗi lần refresh, refresh token cũ bị vô hiệu hóa (isRevoked = true, revokedAt = new Date()) và một refresh token MỚI được tạo ra.[cite: 2] Đây là biện pháp chống Refresh Token Reuse Attack.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Client có refresh token hợp lệ (chưa hết hạn, chưa bị revoke, chưa bị thay thế).[cite: 2]
2. Người dùng tương ứng vẫn còn tồn tại trong database và chưa bị khóa.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi POST /api/v1/auth/refresh với body: `{ "refreshToken": "..." }`.[cite: 2]
2. RefreshTokenCommand dispatch qua custom command bus.[cite: 2]
3. Handler tìm refresh token trong database: `prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })`.[cite: 2]
4. Kiểm tra: token tồn tại, isRevoked === false, expiresAt > new Date(), user vẫn active.[cite: 2]
5. Đánh dấu token cũ: `prisma.refreshToken.update({ where: { id }, data: { isRevoked: true, replacedByTokenHash: newHash, revokedAt: new Date() } })`.[cite: 2]
6. Tạo access token mới cho user.[cite: 2]
7. Tạo refresh token mới, lưu vào database.[cite: 2]
8. Trả về HTTP 200 OK với AuthResponseDto chứa cặp token mới.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Refresh token không tìm thấy trong database: HTTP 401 Unauthorized.[cite: 2]
- A2 – Refresh token đã hết hạn: HTTP 401 Unauthorized, client phải đăng nhập lại.[cite: 2]
- A3 – Refresh token đã bị revoke (Reuse Attack detected): HTTP 401 Unauthorized. LOG SECURITY ALERT.[cite: 2] Có thể kích hoạt revoke toàn bộ refresh tokens của user đó.[cite: 2]
- A4 – User bị xóa hoặc bị khóa sau khi token được cấp: HTTP 401 Unauthorized.[cite: 2]

|                            |                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/auth/refresh[cite: 2]                                                                                    |
| **Kết quả mong đợi**       | Refresh token cũ bị invalidate. Access token mới (15 phút) và refresh token mới (7 ngày) được tạo và trả về.[cite: 2] |
| **HTTP Status Code**       | 200 OK – Refresh thành công. 401 Unauthorized – Token không hợp lệ, hết hạn hoặc đã bị revoke.[cite: 2]               |

#### FR-AUTH-005: Đăng xuất (Logout / Token Revocation)[cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-005[cite: 2]                                             |
| **Tên yêu cầu**    | Đăng xuất và Thu hồi Refresh Token[cite: 2]                      |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]         |
| **Tác nhân**       | Tác giả (Author) / Quản trị viên (Admin) đang đăng nhập[cite: 2] |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                           |

**Mô tả:**[cite: 2]

Người dùng đăng xuất khỏi hệ thống.[cite: 2] Vì JWT access token là stateless (không thể revoke trực tiếp trước khi hết hạn), hành động logout chủ yếu là revoke refresh token tương ứng trong database.[cite: 2] Client có trách nhiệm xóa access token khỏi bộ nhớ (localStorage/cookie) phía client.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đang đăng nhập với access token hợp lệ trong Authorization header.[cite: 2]
2. Client gửi refresh token muốn revoke.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi POST /api/v1/auth/logout với Authorization: Bearer {accessToken} header và body: `{ "refreshToken": "..." }`.[cite: 2]
2. Middleware xác thực JWT (passport.authenticate) xác minh access token.[cite: 2]
3. LogoutCommandHandler tìm refresh token trong database.[cite: 2]
4. Nếu tìm thấy và thuộc về user hiện tại: đánh dấu isRevoked = true, revokedAt = new Date().[cite: 2]
5. Lưu thay đổi vào database.[cite: 2]
6. Trả về HTTP 204 No Content.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Refresh token không tìm thấy: Vẫn trả về HTTP 204 (idempotent).[cite: 2]
- A2 – Access token đã hết hạn: Vẫn cho phép logout nếu refresh token hợp lệ; hoặc HTTP 401 nếu không cung cấp refresh token.[cite: 2]

|                            |                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/auth/logout[cite: 2]                                                                                                     |
| **Kết quả mong đợi**       | Refresh token bị đánh dấu isRevoked = true trong database.[cite: 2]                                                                   |
| **HTTP Status Code**       | 204 No Content – Đăng xuất thành công (hoặc token không tồn tại – idempotent). 401 Unauthorized – Access token không hợp lệ.[cite: 2] |

#### FR-AUTH-006: Xem Hồ sơ Cá nhân (View Profile)[cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-006[cite: 2]                                             |
| **Tên yêu cầu**    | Xem Hồ sơ Cá nhân[cite: 2]                                       |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]         |
| **Tác nhân**       | Tác giả (Author) / Quản trị viên (Admin) đang đăng nhập[cite: 2] |
| **Mức ưu tiên**    | S – Should Have[cite: 2]                                         |

**Mô tả:**[cite: 2]

Trả về thông tin hồ sơ của người dùng hiện đang đăng nhập, dựa trên UserId được trích xuất từ JWT claims.[cite: 2] Không bao giờ trả về PasswordHash.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đang đăng nhập với access token hợp lệ.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/auth/me với Authorization: Bearer {accessToken}.[cite: 2]
2. Middleware xác thực JWT, trich xuat UserId từ claim `sub`.[cite: 2]
3. GetCurrentUserQuery dispatch qua custom command bus.[cite: 2]
4. Handler tìm user: `prisma.user.findUnique({ where: { id: userId } })`.[cite: 2]
5. Map sang UserProfileDto: `{ id, fullName, email, userName, avatarUrl, roles, createdAt }`.[cite: 2]
6. Trả về HTTP 200 OK với UserProfileDto.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – User đã bị xóa khỏi database sau khi token được cấp: HTTP 404 Not Found.[cite: 2]

|                            |                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | GET /api/v1/auth/me[cite: 2]                                                                           |
| **Kết quả mong đợi**       | Trả về thông tin hồ sơ đầy đủ của người dùng (không có thông tin nhạy cảm như password hash).[cite: 2] |
| **HTTP Status Code**       | 200 OK – Thành công. 401 Unauthorized – Chưa đăng nhập. 404 Not Found – User không tồn tại.[cite: 2]   |

#### FR-AUTH-007: Cập nhật Hồ sơ Cá nhân (Update Profile)[cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-AUTH-007[cite: 2]                                             |
| **Tên yêu cầu**    | Cập nhật Hồ sơ Cá nhân[cite: 2]                                  |
| **Nhóm chức năng** | Module Xác thực và Quản lý Người dùng (FR-AUTH)[cite: 2]         |
| **Tác nhân**       | Tác giả (Author) / Quản trị viên (Admin) đang đăng nhập[cite: 2] |
| **Mức ưu tiên**    | S – Should Have[cite: 2]                                         |

**Mô tả:**[cite: 2]

Người dùng có thể cập nhật FullName và AvatarUrl của mình.[cite: 2] Email và UserName không thể thay đổi qua endpoint này.[cite: 2] Sử dụng PATCH (partial update) để chỉ cập nhật các field được cung cấp.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đang đăng nhập.[cite: 2]
2. Dữ liệu mới phải hợp lệ (FullName không rỗng, AvatarUrl là URL hợp lệ nếu cung cấp).[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi PATCH /api/v1/auth/me với body: `{ "fullName": "...", "avatarUrl": "..." }`.[cite: 2]
2. UpdateProfileCommand dispatch qua custom command bus, UserId lấy từ JWT claims.[cite: 2]
3. Zod validation middleware kiểm tra: fullName 2–100 ký tự, avatarUrl là URL hợp lệ (nếu cung cấp).[cite: 2]
4. Handler tìm user, cập nhật FullName và/hoặc AvatarUrl.[cite: 2]
5. `prisma.user.update({ where: { id: userId }, data: { fullName, avatarUrl } })`.[cite: 2]
6. Trả về HTTP 200 OK với UserProfileDto đã cập nhật.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Dữ liệu không hợp lệ: HTTP 422 Unprocessable Entity.[cite: 2]

|                            |                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | PATCH /api/v1/auth/me[cite: 2]                                                                                             |
| **Kết quả mong đợi**       | Hồ sơ người dùng được cập nhật trong database. Trả về hồ sơ mới.[cite: 2]                                                  |
| **HTTP Status Code**       | 200 OK – Cập nhật thành công. 401 Unauthorized – Chưa đăng nhập. 422 Unprocessable Entity – Dữ liệu không hợp lệ.[cite: 2] |

### 3.2. Module Quản lý Danh mục (FR-CAT)[cite: 2]

Module quản lý danh mục (Category) phân loại công thức nấu ăn.[cite: 2] Danh mục được tạo và duy trì bởi Admin; Author và Guest chỉ có quyền đọc.[cite: 2] Mỗi danh mục có Slug duy nhất phục vụ URL thân thiện SEO.[cite: 2] Danh mục được cache với node-cache (TTL 1 giờ) vì thay đổi ít thường xuyên.[cite: 2]

#### FR-CAT-001: Xem Danh sách Danh mục[cite: 2]

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Mã yêu cầu**     | FR-CAT-001[cite: 2]                       |
| **Tên yêu cầu**    | Xem Danh sách Tất cả Danh mục[cite: 2]    |
| **Nhóm chức năng** | Module Quản lý Danh mục (FR-CAT)[cite: 2] |
| **Tác nhân**       | Tất cả (Guest / Author / Admin)[cite: 2]  |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                    |

**Mô tả:**[cite: 2]

Trả về danh sách tất cả danh mục công thức hiện có trong hệ thống, kèm số lượng công thức đã xuất bản (Published) trong mỗi danh mục.[cite: 2] Kết quả được cache với node-cache (TTL 60 phút) và sắp xếp theo Name tăng dần.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Ít nhất một danh mục tồn tại trong database (hoặc trả về mảng rỗng).[cite: 2]
2. Không yêu cầu xác thực.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/categories.[cite: 2]
2. GetCategoriesQuery dispatch qua custom command bus.[cite: 2]
3. Handler kiểm tra node-cache với key "categories:all".[cite: 2]
4. Cache hit: trả về dữ liệu từ cache.[cite: 2]
5. Cache miss: query database — `prisma.category.findMany({ include: { _count: { select: { recipes: { where: { status: 'PUBLISHED' } } } }, orderBy: { name: 'asc' } })`.[cite: 2]
6. Lưu vào node-cache với TTL 60 phút.[cite: 2]
7. Trả về HTTP 200 OK với CategoryDto[]."[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Không có danh mục nào: HTTP 200 OK với mảng rỗng [].[cite: 2]

|                            |                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | GET /api/v1/categories[cite: 2]                                                                                                |
| **Kết quả mong đợi**       | Mảng CategoryDto[] với các field: `{ id, name, slug, description, recipeCount }`. Kết quả được serve từ cache khi có.[cite: 2] |
| **HTTP Status Code**       | 200 OK – Thành công (kể cả khi trống).[cite: 2]                                                                                |

#### FR-CAT-002: Xem Chi tiết Danh mục và Công thức[cite: 2]

|                    |                                                                      |
| ------------------ | -------------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-CAT-002[cite: 2]                                                  |
| **Tên yêu cầu**    | Xem Chi tiết Danh mục và Danh sách Công thức thuộc Danh mục[cite: 2] |
| **Nhóm chức năng** | Module Quản lý Danh mục (FR-CAT)[cite: 2]                            |
| **Tác nhân**       | Tất cả (Guest / Author / Admin)[cite: 2]                             |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                               |

**Mô tả:**[cite: 2]

Trả về thông tin chi tiết của một danh mục cụ thể (theo Slug) kèm danh sách phân trang các công thức đã xuất bản (Published) thuộc danh mục đó.[cite: 2] Guest chỉ thấy Published recipes; Author thấy thêm Draft recipes của chính mình trong danh mục.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Danh mục với slug tương ứng phải tồn tại.[cite: 2]
2. Không yêu cầu xác thực.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/categories/{slug}?page=1&pageSize=12.[cite: 2]
2. GetCategoryBySlugQuery dispatch qua custom command bus.[cite: 2]
3. Handler tìm category theo slug: `prisma.category.findUnique({ where: { slug } })`.[cite: 2]
4. Query recipes thuộc category với Status == Published (+ Draft của currentUser nếu đã đăng nhập).[cite: 2]
5. Apply pagination (OFFSET-based: skip (page-1)\*pageSize, take pageSize).[cite: 2]
6. Map sang CategoryDetailDto kèm pagedResult<RecipeSummaryDto>.[cite: 2]
7. Trả về HTTP 200 OK.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Slug không tồn tại: HTTP 404 Not Found với RFC 7807 body.[cite: 2]

|                            |                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | GET /api/v1/categories/{slug}?page={n}&pageSize={n}[cite: 2]                                                         |
| **Kết quả mong đợi**       | `{ category: CategoryDto, recipes: { items: RecipeSummaryDto[], totalCount, page, pageSize, totalPages } }`[cite: 2] |
| **HTTP Status Code**       | 200 OK – Thành công. 404 Not Found – Slug không tồn tại.[cite: 2]                                                    |

#### FR-CAT-003: Tạo Danh mục Mới [Admin][cite: 2]

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Mã yêu cầu**     | FR-CAT-003[cite: 2]                       |
| **Tên yêu cầu**    | Tạo Danh mục Công thức Mới[cite: 2]       |
| **Nhóm chức năng** | Module Quản lý Danh mục (FR-CAT)[cite: 2] |
| **Tác nhân**       | Quản trị viên (Admin)[cite: 2]            |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                    |

**Mô tả:**[cite: 2]

Admin tạo danh mục công thức mới.[cite: 2] Slug được tự động sinh từ Name (slugify: chuyển sang chữ thường, bỏ dấu, thay khoảng trắng bằng "-").[cite: 2] Nếu Slug đã tồn tại, hệ thống thêm suffix số (e.g., "mon-chinh-2").[cite: 2] Sau khi tạo, cache danh mục (node-cache key "categories:all") bị invalidate.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đang đăng nhập với role Admin.[cite: 2]
2. Name chưa tồn tại trong database.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Admin gửi POST /api/v1/categories với Authorization: Bearer {adminJwt} và body: `{ "name": "...", "description": "..." }`.[cite: 2]
2. Passport.js role middleware kiểm tra role Admin.[cite: 2]
3. CreateCategoryCommand dispatch qua custom command bus.[cite: 2]
4. Zod validation middleware: name 2–50 ký tự, không chứa HTML.[cite: 2]
5. `slugify(name, { lower: true, strict: true })` tạo slug.[cite: 2]
6. Kiểm tra slug chưa tồn tại. Nếu trùng, thêm "-2", "-3",... cho đến khi unique.[cite: 2]
7. `prisma.category.create({ data: { name, slug, description } })`.[cite: 2]
8. `categoryCache.del("categories:all")` – invalidate cache.[cite: 2]
9. Trả về HTTP 201 Created với CategoryDto và Location header.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Thiếu role Admin: HTTP 403 Forbidden.[cite: 2]
- A2 – Dữ liệu không hợp lệ: HTTP 422.[cite: 2]

|                            |                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/categories[cite: 2]                                                                                                                              |
| **Kết quả mong đợi**       | Danh mục mới được tạo trong database. Cache danh mục bị xóa. Location header trỏ đến /api/v1/categories/{newSlug}.[cite: 2]                                   |
| **HTTP Status Code**       | 201 Created – Tạo thành công. 403 Forbidden – Không có quyền Admin. 409 Conflict – Name đã tồn tại. 422 Unprocessable Entity – Dữ liệu không hợp lệ.[cite: 2] |

#### FR-CAT-004: Cập nhật Danh mục [Admin][cite: 2]

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Mã yêu cầu**     | FR-CAT-004[cite: 2]                       |
| **Tên yêu cầu**    | Cập nhật Thông tin Danh mục[cite: 2]      |
| **Nhóm chức năng** | Module Quản lý Danh mục (FR-CAT)[cite: 2] |
| **Tác nhân**       | Quản trị viên (Admin)[cite: 2]            |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                    |

**Mô tả:**[cite: 2]

Admin cập nhật Name và/hoặc Description của danh mục.[cite: 2] Slug KHÔNG thay đổi khi đổi tên (để tránh broken links).[cite: 2] Sau khi cập nhật, cache bị invalidate.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Admin đang đăng nhập.[cite: 2]
2. Danh mục với ID tương ứng tồn tại.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Admin gửi PUT /api/v1/categories/{id} với body: `{ "name": "...", "description": "..." }`.[cite: 2]
2. Kiểm tra role Admin.[cite: 2]
3. UpdateCategoryCommand dispatch qua custom command bus.[cite: 2]
4. Tìm category theo ID, cập nhật Name và Description.[cite: 2]
5. Lưu thay đổi, invalidate cache.[cite: 2]
6. Trả về HTTP 200 OK với CategoryDto đã cập nhật.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – ID không tồn tại: HTTP 404.[cite: 2]
- A2 – Thiếu role Admin: HTTP 403.[cite: 2]

|                            |                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | PUT /api/v1/categories/{id}[cite: 2]                                                           |
| **Kết quả mong đợi**       | Thông tin danh mục được cập nhật. Cache invalidated.[cite: 2]                                  |
| **HTTP Status Code**       | 200 OK – Cập nhật thành công. 403 Forbidden. 404 Not Found. 422 Unprocessable Entity.[cite: 2] |

#### FR-CAT-005: Xóa Danh mục [Admin][cite: 2]

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Mã yêu cầu**     | FR-CAT-005[cite: 2]                       |
| **Tên yêu cầu**    | Xóa Danh mục[cite: 2]                     |
| **Nhóm chức năng** | Module Quản lý Danh mục (FR-CAT)[cite: 2] |
| **Tác nhân**       | Quản trị viên (Admin)[cite: 2]            |
| **Mức ưu tiên**    | S – Should Have[cite: 2]                  |

**Mô tả:**[cite: 2]

Admin xóa một danh mục.[cite: 2] Quy tắc nghiệp vụ: KHÔNG được xóa danh mục còn chứa công thức (dù là Published hay Draft).[cite: 2] Admin phải chuyển tất cả công thức sang danh mục khác trước khi xóa.[cite: 2] Đây là soft constraint để bảo vệ toàn vẹn dữ liệu.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Admin đang đăng nhập.[cite: 2]
2. Danh mục tồn tại và không còn công thức nào.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Admin gửi DELETE /api/v1/categories/{id}.[cite: 2]
2. Kiểm tra role Admin.[cite: 2]
3. DeleteCategoryCommand dispatch.[cite: 2]
4. Đếm số recipe trong category: nếu > 0 → trả HTTP 409 Conflict với thông báo.[cite: 2]
5. `prisma.category.delete({ where: { id } })`, invalidate cache.[cite: 2]
6. Trả về HTTP 204 No Content.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Danh mục có recipe: HTTP 409 Conflict với thông báo số lượng recipe.[cite: 2]
- A2 – ID không tồn tại: HTTP 404.[cite: 2]

|                            |                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | DELETE /api/v1/categories/{id}[cite: 2]                                                                     |
| **Kết quả mong đợi**       | Danh mục bị xóa khỏi database. HTTP 204 được trả về.[cite: 2]                                               |
| **HTTP Status Code**       | 204 No Content – Xóa thành công. 403 Forbidden. 404 Not Found. 409 Conflict – Danh mục còn recipe.[cite: 2] |

### 3.3. Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]

Module cốt lõi của hệ thống.[cite: 2] Recipe là aggregate root chứa các child entity: RecipeStep, RecipeIngredient, RecipeImage và RecipeNutrition.[cite: 2] Tất cả mutation (Create/Update/Delete) đi qua transaction để đảm bảo tính nhất quán.[cite: 2] Concurrency được xử lý qua updatedAt version field để phát hiện lost update khi hai Author cùng sửa một recipe.[cite: 2]

#### FR-RCP-001: Xem Danh sách Công thức (Paginated + Filtered + Sorted)[cite: 2]

|                    |                                                                        |
| ------------------ | ---------------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-001[cite: 2]                                                    |
| **Tên yêu cầu**    | Xem Danh sách Công thức Nấu ăn với Phân trang, Lọc và Sắp xếp[cite: 2] |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]                      |
| **Tác nhân**       | Tất cả (Guest / Author / Admin)[cite: 2]                               |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                                 |

**Mô tả:**[cite: 2]

Trả về danh sách phân trang các công thức.[cite: 2] Guest và Author khác chỉ thấy Status == Published.[cite: 2] Author thấy thêm Draft/Archived của chính mình.[cite: 2] Admin thấy tất cả trạng thái.[cite: 2] Hỗ trợ lọc theo CategoryId, DifficultyLevel, thời gian nấu; sắp xếp theo createdAt, title, cookTime.[cite: 2] Kết quả được cache với apicache (TTL 15 phút).[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Không yêu cầu xác thực (endpoint public cho Published recipes).[cite: 2]
2. Tham số page >= 1, pageSize trong [1, 50].[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/recipes?page=1&pageSize=12&categoryId={guid}&difficulty=Easy&maxCookTime=30&sort=-createdAt.[cite: 2]
2. GetRecipesQuery dispatch qua custom command bus.[cite: 2]
3. Handler xây dựng Prisma where clause với filters từ query params.[cite: 2]
4. Áp dụng Authorization filter: nếu Guest → chỉ Published; nếu Author → Published OR (Draft AND authorId == userId); nếu Admin → tất cả.[cite: 2]
5. Apply sorting: sort="-createdAt" → orderBy: { createdAt: 'desc' }; sort="title" → orderBy: { title: 'asc' }.[cite: 2]
6. COUNT total trước khi pagination.[cite: 2]
7. Apply OFFSET-LIMIT pagination (skip, take).[cite: 2]
8. Map sang pagedResult<RecipeSummaryDto>.[cite: 2]
9. Trả về HTTP 200 OK.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – page hoặc pageSize không hợp lệ: HTTP 422.[cite: 2]
- A2 – categoryId không tồn tại: HTTP 200 với items rỗng.[cite: 2]

|                            |                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | GET /api/v1/recipes?page={n}&pageSize={n}&categoryId={guid}&difficulty={level}&maxCookTime={min}&sort={field}[cite: 2]       |
| **Kết quả mong đợi**       | pagedResult<RecipeSummaryDto>: `{ items[], totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage }`.[cite: 2] |
| **HTTP Status Code**       | 200 OK – Thành công (kể cả items rỗng). 422 Unprocessable Entity – Tham số không hợp lệ.[cite: 2]                            |

#### FR-RCP-002: Xem Chi tiết Công thức[cite: 2]

|                    |                                                   |
| ------------------ | ------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-002[cite: 2]                               |
| **Tên yêu cầu**    | Xem Chi tiết Công thức Nấu ăn[cite: 2]            |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2] |
| **Tác nhân**       | Tất cả (Guest / Author / Admin)[cite: 2]          |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                            |

**Mô tả:**[cite: 2]

Trả về toàn bộ thông tin chi tiết của một công thức cụ thể, bao gồm: thông tin cơ bản, danh sách nguyên liệu sắp xếp theo sortOrder, các bước thực hiện sắp xếp theo stepNumber, minh họa, thông tin dinh dưỡng, thông tin danh mục và tác giả.[cite: 2] Recipe Draft chỉ được xem bởi tác giả sở hữu hoặc Admin.[cite: 2] Endpoint được cache (TTL 60 phút).[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Recipe với slug tương ứng tồn tại.[cite: 2]
2. Nếu Recipe ở trạng thái Draft/Archived: người yêu cầu phải là tác giả hoặc Admin.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/recipes/{slug}.[cite: 2]
2. GetRecipeBySlugQuery dispatch qua custom command bus.[cite: 2]
3. Handler query Recipe với eager loading: `prisma.recipe.findUnique({ where: { slug }, include: { steps: { orderBy: { stepNumber: 'asc' } }, ingredients: { orderBy: { sortOrder: 'asc' } }, images: true, category: true, author: true, nutrition: true } })`.[cite: 2]
4. Kiểm tra null → 404 Not Found nếu không tìm thấy.[cite: 2]
5. Kiểm tra Status: nếu Draft/Archived → chỉ tác giả hoặc Admin mới được xem.[cite: 2]
6. Map sang RecipeDetailDto (bao gồm tất cả nested collections).[cite: 2]
7. Trả về HTTP 200 OK.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Slug không tồn tại: HTTP 404 Not Found.[cite: 2]
- A2 – Recipe Draft/Archived, người dùng không có quyền: HTTP 403 Forbidden.[cite: 2]

|                            |                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | GET /api/v1/recipes/{slug}[cite: 2]                                                                         |
| **Kết quả mong đợi**       | RecipeDetailDto đầy đủ gồm tất cả nested data.[cite: 2]                                                     |
| **HTTP Status Code**       | 200 OK – Thành công. 403 Forbidden – Không có quyền xem Draft. 404 Not Found – Slug không tồn tại.[cite: 2] |

#### FR-RCP-003: Tạo Công thức Nấu ăn Mới [Author/Admin][cite: 2]

|                    |                                                   |
| ------------------ | ------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-003[cite: 2]                               |
| **Tên yêu cầu**    | Tạo Công thức Nấu ăn Mới[cite: 2]                 |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2] |
| **Tác nhân**       | Tác giả (Author) / Quản trị viên (Admin)[cite: 2] |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                            |

**Mô tả:**[cite: 2]

Author hoặc Admin tạo mới một công thức nấu ăn.[cite: 2] Trạng thái ban đầu luôn là Draft (chưa công khai).[cite: 2] Slug được tự động sinh từ Title.[cite: 2] Steps và Ingredients có thể được tạo cùng lúc (trong cùng request) hoặc thêm riêng lẻ sau.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Người dùng đang đăng nhập với role Author hoặc Admin.[cite: 2]
2. CategoryId tham chiếu đến danh mục đã tồn tại.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Author gửi POST /api/v1/recipes với body: `{ title, description, categoryId, prepTimeMinutes, cookTimeMinutes, servings, difficulty, instructions?, nutrition?: {...}, steps?: [...], ingredients?: [...] }`.[cite: 2]
2. Kiểm tra xác thực (Passport.js JWT middleware).[cite: 2]
3. CreateRecipeCommand dispatch.[cite: 2]
4. Zod validation: title 5–200 ký tự, prepTime/cookTime/servings > 0, categoryId valid UUID.[cite: 2]
5. `slugify(title, { lower: true, strict: true })`, kiểm tra slug unique.[cite: 2]
6. Tạo recipe trong transaction: `prisma.$transaction()`包含 recipe + steps + ingredients + nutrition.[cite: 2]
7. Invalidate cache.[cite: 2]
8. Trả về HTTP 201 Created với RecipeDto.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Không có quyền Author/Admin: HTTP 401/403.[cite: 2]
- A2 – CategoryId không tồn tại: HTTP 422.[cite: 2]
- A3 – Slug đã tồn tại (title trùng): HTTP 409 Conflict.[cite: 2]

|                            |                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | POST /api/v1/recipes[cite: 2]                                                                                                                                      |
| **Kết quả mong đợi**       | Recipe mới được tạo với Status = Draft, Slug được sinh tự động.[cite: 2]                                                                                           |
| **HTTP Status Code**       | 201 Created – Tạo thành công. 401/403 – Chưa đăng nhập / Không có quyền. 409 Conflict – Slug đã tồn tại. 422 Unprocessable Entity – Dữ liệu không hợp lệ.[cite: 2] |

#### FR-RCP-004: Cập nhật Công thức [Author-Owner/Admin][cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-004[cite: 2]                                              |
| **Tên yêu cầu**    | Cập nhật Thông tin Công thức Nấu ăn[cite: 2]                     |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]                |
| **Tác nhân**       | Tác giả sở hữu (Author – Owner) / Quản trị viên (Admin)[cite: 2] |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                           |

**Mô tả:**[cite: 2]

Cập nhật thông tin của một công thức.[cite: 2] Resource-Based Authorization được áp dụng: chỉ Author sở hữu recipe (authorId == currentUserId) hoặc Admin được phép.[cite: 2] Concurrency control qua updatedAt version field (ETag pattern): client phải gửi version hiện tại trong If-Match header.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Author/Admin đang đăng nhập.[cite: 2]
2. Recipe với ID tương ứng tồn tại.[cite: 2]
3. Client cung cấp version hợp lệ trong If-Match header.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Author gửi PUT /api/v1/recipes/{id} với body.[cite: 2]
2. Kiểm tra xác thực.[cite: 2]
3. UpdateRecipeCommand dispatch.[cite: 2]
4. Lấy recipe từ database theo ID.[cite: 2]
5. Kiểm tra resource-based auth: `recipe.authorId === user.id || user.roles.includes('Admin')`.[cite: 2]
6. Kiểm tra version: so sánh `recipe.updatedAt` với `If-Match` header value.[cite: 2]
7. Update các field của recipe.[cite: 2]
8. `prisma.recipe.update()` – nếu updatedAt mismatch tại đây → HTTP 409 Conflict.[cite: 2]
9. Invalidate cache.[cite: 2]
10. Trả về HTTP 200 OK với RecipeDto đã cập nhật.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Không phải owner: HTTP 403 Forbidden.[cite: 2]
- A2 – Concurrency conflict (version mismatch): HTTP 409 Conflict.[cite: 2]
- A3 – ID không tồn tại: HTTP 404.[cite: 2]

|                            |                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | PUT /api/v1/recipes/{id}[cite: 2]                                                                                                       |
| **Kết quả mong đợi**       | Recipe được cập nhật, cache bị invalidate, trả về RecipeDto mới nhất.[cite: 2]                                                          |
| **HTTP Status Code**       | 200 OK. 403 Forbidden – Không phải owner. 404 Not Found. 409 Conflict – Concurrency hoặc slug trùng. 422 Unprocessable Entity.[cite: 2] |

#### FR-RCP-005: Publish/Unpublish Công thức[cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-005[cite: 2]                                              |
| **Tên yêu cầu**    | Publish / Unpublish Công thức[cite: 2]                           |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]                |
| **Tác nhân**       | Tác giả sở hữu (Author – Owner) / Quản trị viên (Admin)[cite: 2] |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                           |

**Mô tả:**[cite: 2]

Thay đổi trạng thái công thức: Draft → Published hoặc Published → Draft.[cite: 2] Business rule: KHÔNG thể publish nếu recipe không có ít nhất 1 bước thực hiện.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Recipe tồn tại, người dùng là owner hoặc Admin.[cite: 2]
2. Để publish: recipe phải có ít nhất 1 RecipeStep.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Author gửi PATCH /api/v1/recipes/{id}/publish hoặc PATCH /api/v1/recipes/{id}/unpublish.[cite: 2]
2. PublishRecipeCommand dispatch.[cite: 2]
3. Kiểm tra resource-based authorization.[cite: 2]
4. Nếu publish: kiểm tra steps.length > 0, nếu không → trả 422.[cite: 2]
5. Set Status = Published/Draft, updatedAt = new Date().[cite: 2]
6. `prisma.recipe.update()`, invalidate cache.[cite: 2]
7. Trả về HTTP 200 OK với RecipeDto.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Recipe không có bước thực hiện: HTTP 422.[cite: 2]
- A2 – Recipe đã ở trạng thái mong muốn: Idempotent, HTTP 200 OK.[cite: 2]

|                            |                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | PATCH /api/v1/recipes/{id}/publish \| PATCH /api/v1/recipes/{id}/unpublish[cite: 2]                 |
| **Kết quả mong đợi**       | Status recipe được thay đổi. Cache bị invalidate.[cite: 2]                                          |
| **HTTP Status Code**       | 200 OK – Thành công. 403 Forbidden. 404 Not Found. 422 Unprocessable Entity – Thiếu steps.[cite: 2] |

#### FR-RCP-006: Lưu trữ Công thức (Archive)[cite: 2]

|                    |                                                   |
| ------------------ | ------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-006[cite: 2]                               |
| **Tên yêu cầu**    | Lưu trữ Công thức (Archive / Unarchive)[cite: 2]  |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2] |
| **Tác nhân**       | Tác giả sở hữu / Quản trị viên (Admin)[cite: 2]   |
| **Mức ưu tiên**    | S – Should Have[cite: 2]                          |

**Mô tả:**[cite: 2]

Chuyển Recipe sang trạng thái Archived.[cite: 2] Recipe Archived không hiển thị trong danh sách công khai nhưng không bị xóa khỏi database.[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. Recipe tồn tại, người dùng có quyền.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Author gửi PATCH /api/v1/recipes/{id}/archive.[cite: 2]
2. Kiểm tra authorization.[cite: 2]
3. Set Status = Archived.[cite: 2]
4. `prisma.recipe.update()`, invalidate cache.[cite: 2]
5. HTTP 200 OK.[cite: 2]

|                            |                                                |
| -------------------------- | ---------------------------------------------- |
| **HTTP Method & Endpoint** | PATCH /api/v1/recipes/{id}/archive[cite: 2]    |
| **HTTP Status Code**       | 200 OK. 403 Forbidden. 404 Not Found.[cite: 2] |

#### FR-RCP-007: Xóa Công thức [Author-Owner/Admin][cite: 2]

|                    |                                                                  |
| ------------------ | ---------------------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-007[cite: 2]                                              |
| **Tên yêu cầu**    | Xóa Vĩnh viễn Công thức Nấu ăn[cite: 2]                          |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]                |
| **Tác nhân**       | Tác giả sở hữu (Author – Owner) / Quản trị viên (Admin)[cite: 2] |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                           |

**Mô tả:**[cite: 2]

Xóa vĩnh viễn một công thức và tất cả dữ liệu liên quan (cascade delete).[cite: 2] Các file ảnh trên MinIO được xóa bất đồng bộ qua BullMQ fire-and-forget job.[cite: 2] Đây là hard delete.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Author/Admin gửi DELETE /api/v1/recipes/{id}.[cite: 2]
2. Kiểm tra xác thực và resource-based authorization.[cite: 2]
3. Lấy danh sách URL ảnh từ recipe.[cite: 2]
4. `prisma.recipe.delete({ where: { id } })` – cascade delete Steps, Ingredients, Images.[cite: 2]
5. Với mỗi imageUrl: `fileCleanupQueue.add('delete', { url })` – xóa ảnh trên MinIO bất đồng bộ.[cite: 2]
6. Invalidate cache.[cite: 2]
7. Trả về HTTP 204 No Content.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – ID không tồn tại: HTTP 404.[cite: 2]
- A2 – Không phải owner: HTTP 403.[cite: 2]
- A3 – Xóa MinIO file thất bại (job retry): BullMQ tự động retry 3 lần.[cite: 2]

|                            |                                                                         |
| -------------------------- | ----------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | DELETE /api/v1/recipes/{id}[cite: 2]                                    |
| **HTTP Status Code**       | 204 No Content – Xóa thành công. 403 Forbidden. 404 Not Found.[cite: 2] |

#### FR-RCP-008: Quản lý Ảnh Công thức (Upload / Set Primary / Delete)[cite: 2]

|                    |                                                       |
| ------------------ | ----------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-008[cite: 2]                                   |
| **Tên yêu cầu**    | Upload Ảnh, Đặt Ảnh Chính, Xóa Ảnh Công thức[cite: 2] |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]     |
| **Tác nhân**       | Tác giả sở hữu / Quản trị viên (Admin)[cite: 2]       |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                |

**Mô tả:**[cite: 2]

Author quản lý ảnh minh họa cho công thức.[cite: 2] Upload dùng multipart/form-data (multer).[cite: 2] Ảnh được lưu trên MinIO với path: recipes/{recipeId}/{uuid}.{ext}.[cite: 2] Validation bắt buộc: MIME type (image/jpeg, image/png, image/webp, image/avif) và kích thước tối đa 5MB.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. POST /api/v1/recipes/{id}/images với multipart/form-data chứa field "file".[cite: 2]
2. Validate MIME type và kích thước (5MB max).[cite: 2]
3. Validate magic bytes.[cite: 2]
4. Upload lên MinIO qua `s3Client.send(new PutObjectCommand(...))`.[cite: 2]
5. `prisma.recipeImage.create()` – lưu URL vào database.[cite: 2]
6. HTTP 201 Created.[cite: 2]
7. PATCH /api/v1/recipes/{id}/images/{imageId}/primary – đặt ảnh chính.[cite: 2]
8. DELETE /api/v1/recipes/{id}/images/{imageId} – xóa ảnh + BullMQ job xóa file MinIO.[cite: 2]

|                            |                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST /api/v1/recipes/{id}/images \| PATCH /api/v1/recipes/{id}/images/{imgId}/primary \| DELETE /api/v1/recipes/{id}/images/{imgId}[cite: 2] |
| **HTTP Status Code**       | Upload: 201. Set Primary: 200. Delete: 204. 400 – File không hợp lệ. 403/404.[cite: 2]                                                       |

#### FR-RCP-009: Quản lý Nguyên liệu (CRUD RecipeIngredient)[cite: 2]

|                    |                                                      |
| ------------------ | ---------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-009[cite: 2]                                  |
| **Tên yêu cầu**    | Thêm / Cập nhật / Xóa Nguyên liệu Công thức[cite: 2] |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]    |
| **Tác nhân**       | Tác giả sở hữu / Quản trị viên (Admin)[cite: 2]      |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                               |

**Mô tả:**[cite: 2]

Author quản lý danh sách nguyên liệu (RecipeIngredient) của công thức.[cite: 2] Mỗi nguyên liệu có: Name, Quantity, Unit, Notes, sortOrder.[cite: 2] Endpoint hỗ trợ thêm mới (POST), cập nhật (PUT), xóa (DELETE).[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. POST /api/v1/recipes/{id}/ingredients – thêm nguyên liệu.[cite: 2]
2. PUT /api/v1/recipes/{id}/ingredients/{ingId} – cập nhật.[cite: 2]
3. DELETE /api/v1/recipes/{id}/ingredients/{ingId} – xóa.[cite: 2]

|                            |                                                                    |
| -------------------------- | ------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | POST/PUT/DELETE /api/v1/recipes/{id}/ingredients/{ingId?}[cite: 2] |
| **HTTP Status Code**       | 201/200/204 – Thành công. 403/404/422 – Lỗi tương ứng.[cite: 2]    |

#### FR-RCP-010: Quản lý Các bước Thực hiện (CRUD RecipeStep)[cite: 2]

|                    |                                                         |
| ------------------ | ------------------------------------------------------- |
| **Mã yêu cầu**     | FR-RCP-010[cite: 2]                                     |
| **Tên yêu cầu**    | Thêm / Cập nhật / Xóa Bước Thực hiện Công thức[cite: 2] |
| **Nhóm chức năng** | Module Quản lý Công thức Nấu ăn (FR-RCP)[cite: 2]       |
| **Tác nhân**       | Tác giả sở hữu / Quản trị viên (Admin)[cite: 2]         |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                  |

**Mô tả:**[cite: 2]

Author quản lý các bước thực hiện (RecipeStep).[cite: 2] Mỗi bước có: stepNumber (tự động tăng), description, timerMinutes, imageUrl.[cite: 2] Khi xóa một bước, hệ thống tự động renumber các bước còn lại.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. POST /api/v1/recipes/{id}/steps – thêm bước mới (stepNumber = max + 1).[cite: 2]
2. DELETE /api/v1/recipes/{id}/steps/{stepId} – xóa bước + renumber.[cite: 2]

|                            |                                                               |
| -------------------------- | ------------------------------------------------------------- |
| **HTTP Method & Endpoint** | POST/PUT/DELETE /api/v1/recipes/{id}/steps/{stepId?}[cite: 2] |
| **HTTP Status Code**       | 201/200/204 – Thành công. 403/404/422 – Lỗi.[cite: 2]         |

### 3.4. Module Tìm kiếm và Phân trang (FR-SRCH)[cite: 2]

#### FR-SRCH-001: Tìm kiếm Toàn văn bản (Full-Text Search)[cite: 2]

|                    |                                                             |
| ------------------ | ----------------------------------------------------------- |
| **Mã yêu cầu**     | FR-SRCH-001[cite: 2]                                        |
| **Tên yêu cầu**    | Tìm kiếm Toàn văn bản Công thức (Full-Text Search)[cite: 2] |
| **Nhóm chức năng** | Module Tìm kiếm và Phân trang (FR-SRCH)[cite: 2]            |
| **Tác nhân**       | Tất cả (Guest / Author / Admin)[cite: 2]                    |
| **Mức ưu tiên**    | M – Must Have[cite: 2]                                      |

**Mô tả:**[cite: 2]

Hệ thống cung cấp tính năng tìm kiếm toàn văn bản (FTS) cho công thức sử dụng PostgreSQL tsvector/tsquery với cấu hình tiếng Việt.[cite: 2] Kết quả được xếp hạng bởi ts_rank().[cite: 2] Hỗ trợ tìm kiếm gần đúng với unaccent extension (bỏ dấu tiếng Việt).[cite: 2]

**Điều kiện tiên quyết:**[cite: 2]

1. PostgreSQL extensions unaccent và pg_trgm đã được install.[cite: 2]
2. GIN index trên cột SearchVector đã được tạo.[cite: 2]
3. Tham số q không rỗng, tối thiểu 2 ký tự.[cite: 2]

**Luồng chính (Happy Path):**[cite: 2]

1. Client gửi GET /api/v1/recipes/search?q=pho+bo&page=1&pageSize=10.[cite: 2]
2. SearchRecipesQuery dispatch.[cite: 2]
3. Handler xây dựng tsquery từ search terms: `"pho:* & bo:*"` (prefix matching).[cite: 2]
4. Prisma raw query: `prisma.$queryRaw\`SELECT \* FROM "Recipes" WHERE "searchVector" @@ to_tsquery('vietnamese', ${query}) ORDER BY ts_rank("searchVector", to_tsquery('vietnamese', ${query})) DESC\``.[cite: 2]
5. Chỉ trả về Status == Published recipes.[cite: 2]
6. Apply pagination, trả về pagedResult với field relevanceScore.[cite: 2]

**Luồng thay thế / Ngoại lệ:**[cite: 2]

- A1 – Query rỗng hoặc < 2 ký tự: HTTP 422.[cite: 2]
- A2 – Không tìm thấy kết quả: HTTP 200 với items = [].[cite: 2]

|                            |                                                                          |
| -------------------------- | ------------------------------------------------------------------------ |
| **HTTP Method & Endpoint** | GET /api/v1/recipes/search?q={searchTerm}&page={n}&pageSize={n}[cite: 2] |
| **HTTP Status Code**       | 200 OK – Thành công. 422 – Query không hợp lệ.[cite: 2]                  |

#### FR-SRCH-002/003/004: Lọc, Sắp xếp và Phân trang (Tóm tắt)[cite: 2]

Ba FR còn lại của module Search được tích hợp sẵn vào FR-RCP-001 và FR-SRCH-001.[cite: 2]

| Mã FR       | Tên           | Tham số Query                                    | Mô tả                                                                      |
| ----------- | ------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| FR-SRCH-002 | Lọc công thức | categoryId, difficulty, maxCookTime, minServings | Lọc kết quả, filter kết hợp bằng AND.[cite: 2]                             |
| FR-SRCH-003 | Sắp xếp       | sort={field} (VD: sort=-createdAt)               | Tiền tố "-" = descending. Mặc định: -createdAt.[cite: 2]                   |
| FR-SRCH-004 | Phân trang    | page={n}, pageSize={n}                           | Offset-based pagination. Response bao gồm totalCount, totalPages.[cite: 2] |

### 3.5. Module Quản lý Tệp tin (FR-FILE)[cite: 2]

Module xử lý tất cả thao tác với file binary trên MinIO S3-compatible.[cite: 2] Abstraction layer IFileStorageService cho phép swap implementation (MinIO ↔ AWS S3 ↔ local filesystem) mà không cần thay đổi Application Layer.[cite: 2]

| Mã FR       | Tên                   | Mô tả                                                                                                                                  | Ràng buộc kỹ thuật                                                                                                      |
| ----------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| FR-FILE-001 | Upload File lên MinIO | `s3Client.send(new PutObjectCommand(...))` → string (public URL). Tạo unique filename = `{folder}/{uuid}.{ext}`.[cite: 2]              | Max size: 5MB. MIME: JPEG/PNG/WebP/AVIF. Magic bytes validation. Bucket: "culinary-blog". Policy: public-read.[cite: 2] |
| FR-FILE-002 | Xóa File khỏi MinIO   | `s3Client.send(new DeleteObjectCommand(...))`. Thường được gọi từ BullMQ background job (fire-and-forget) sau khi xóa recipe.[cite: 2] | Nếu object không tồn tại → không throw (idempotent). Lỗi kết nối → BullMQ retry.[cite: 2]                               |

### 3.6. Module Background Jobs (FR-JOB)[cite: 2]

Module xử lý các tác vụ nền không đồng bộ sử dụng BullMQ.[cite: 2] BullMQ chạy với Redis làm queue backend.[cite: 2] Dashboard quản lý jobs (Admin only).[cite: 2] Hỗ trợ 3 loại job: Fire-and-forget (chạy ngay), Delayed (chạy sau N giây/phút) và Recurring (lịch cron).[cite: 2]

| Mã FR      | Tên Job                      | Loại            | Trigger                                           | Mô tả                                                                                                                                        | Retry Policy                                          |
| ---------- | ---------------------------- | --------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FR-JOB-001 | Welcome Email Job            | Fire-and-forget | Sau FR-AUTH-001 thành công                        | Gửi email HTML chào mừng.[cite: 2] Template: tên người dùng, link ứng dụng.[cite: 2]                                                         | Tự động retry 3 lần với exponential backoff.[cite: 2] |
| FR-JOB-002 | Image Resize / Thumbnail Job | Fire-and-forget | Sau FR-RCP-008 upload ảnh thành công              | Tạo thumbnail (300x300px) và medium image (800x600px). Lưu cả 3 phiên bản lên MinIO.[cite: 2]                                                | Retry 3 lần. Nếu fail: ảnh gốc vẫn hiển thị.[cite: 2] |
| FR-JOB-003 | Sitemap Generation Job       | Recurring       | Hàng ngày lúc 02:00 AM UTC (cron: "0 2 \* \* \*") | Tạo file sitemap.xml chứa URL tất cả Published recipes.[cite: 2] Upload lên MinIO hoặc lưu vào wwwroot. Ping Google Search Console.[cite: 2] | Retry 2 lần nếu fail. Log kết quả qua Pino.[cite: 2]  |

### 3.7. Module Quan sát Hệ thống (FR-OBS)[cite: 2]

Module cung cấp khả năng quan sát (Observability) toàn diện theo ba trụ cột: Logging (Pino), Metrics (OpenTelemetry), và Distributed Tracing (OpenTelemetry).[cite: 2] Đây là yêu cầu bắt buộc cho production deployment.[cite: 2]

| Mã FR      | Tên                           | Mô tả                                                                                                                                                                      | Kỹ thuật / Công cụ                                                                                                                                                       |
| ---------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-OBS-001 | Health Check Endpoints        | 3 endpoint: GET /health (tổng hợp), GET /health/live (liveness), GET /health/ready (readiness).[cite: 2]                                                                   | `terminus` hoặc custom health middleware. Liveness chỉ trả healthy. Readiness fail khi DB/Redis down.[cite: 2]                                                           |
| FR-OBS-002 | Structured Logging            | Mọi HTTP request được log với: CorrelationId, HTTP method/path/status, elapsed time, UserId.[cite: 2] Command bus logging middleware log tất cả Commands/Queries.[cite: 2] | Pino + pino-http. Sinks: Console (structured JSON), File (rolling daily).[cite: 2] Log levels: Debug (dev), Information (prod), Warning/Error (always).[cite: 2]         |
| FR-OBS-003 | Distributed Tracing & Metrics | OpenTelemetry instrumentation cho: HTTP request traces, database operation traces, custom business metrics.[cite: 2]                                                       | `@opentelemetry/sdk-node`, OTLP exporter. Traces export đến Jaeger/Grafana Tempo (production).[cite: 2] Metrics: request count, duration histogram, error rate.[cite: 2] |

## 4. Yêu cầu Phi Chức năng (NFR)[cite: 2]

Phần này mô tả các thuộc tính chất lượng hệ thống theo mô hình ISO/IEC 25010 (FURPS+).[cite: 2] Mỗi yêu cầu phi chức năng được gán mã định danh, mức ưu tiên và tiêu chí đo lường định lượng cụ thể.[cite: 2] Các NFR này ràng buộc thiết kế kiến trúc và lựa chọn công nghệ toàn bộ hệ thống.[cite: 2]

| Mã NFR    | Danh mục                           | Số yêu cầu | Ưu tiên    |
| --------- | ---------------------------------- | ---------- | ---------- |
| NFR-PERF  | Hiệu năng (Performance)            | 5          | Cao        |
| NFR-SEC   | Bảo mật (Security)                 | 6          | Rất cao    |
| NFR-USE   | Khả năng sử dụng (Usability)       | 4          | Trung bình |
| NFR-REL   | Độ tin cậy (Reliability)           | 3          | Cao        |
| NFR-MAINT | Khả năng bảo trì (Maintainability) | 4          | Trung bình |
| NFR-SCALE | Khả năng mở rộng (Scalability)     | 3          | Cao        |
| NFR-SEO   | Tối ưu SEO (SEO)                   | 4          | Cao        |

### 4.1. Hiệu năng (NFR-PERF)[cite: 2]

Toàn bộ các chỉ số hiệu năng được đo trong môi trường production với tải thực tế.[cite: 2] Các ngưỡng dưới đây áp dụng cho trường hợp cache warm (Redis hit rate ≥ 80%).[cite: 2]

#### NFR-PERF-001: Response Time API[cite: 2]

|             |                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**   | Thời gian phản hồi API: p50 ≤ 150ms cho tất cả GET endpoints với dữ liệu cache; p95 ≤ 500ms cho tất cả API endpoints (kể cả write operations); p99 ≤ 1000ms trong mọi trường hợp.[cite: 2] |
| **Đo bằng** | OpenTelemetry + Grafana / k6 load test.[cite: 2]                                                                                                                                           |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                               |

#### NFR-PERF-002: Throughput[cite: 2]

|               |                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Mô tả**     | Hệ thống xử lý đồng thời ≥ 100 concurrent users mà không degradation.[cite: 2]                 |
| **Phần cứng** | 2 vCPU, 4GB RAM (single instance). Horizontal scaling: thêm instance tăng tuyến tính.[cite: 2] |
| **Đo bằng**   | k6 smoke test → load test → stress test.[cite: 2]                                              |
| **Ưu tiên**   | Cao[cite: 2]                                                                                   |

#### NFR-PERF-003: Cache Effectiveness[cite: 2]

|                        |                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**              | Redis Cache hit rate ≥ 80% trong điều kiện steady-state. Các đối tượng cache: Category list (TTL = 30 phút), Recipe detail (TTL = 5 phút, cache-aside pattern), Search results (TTL = 1 phút).[cite: 2] |
| **Cache invalidation** | Event-driven — xóa cache khi Create/Update/Delete.[cite: 2]                                                                                                                                             |
| **Ưu tiên**            | Cao[cite: 2]                                                                                                                                                                                            |

#### NFR-PERF-004: Database Query[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Tất cả queries đến PostgreSQL: Không có N+1 query problem — bắt buộc dùng Prisma `include` eager loading và projection; Index: đảm bảo mọi WHERE/ORDER BY column đều có B-tree index tương ứng; Slow query log: cảnh báo khi query > 100ms (Pino performance behavior); EXPLAIN ANALYZE phải pass review trước khi merge.[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                       |

#### NFR-PERF-005: Frontend Performance (Core Web Vitals)[cite: 2]

|              |                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**    | Next.js frontend đạt chuẩn Google Core Web Vitals: LCP ≤ 2.5s; CLS ≤ 0.1; INP ≤ 200ms; First Load JS Bundle ≤ 200KB (gzipped).[cite: 2] |
| **Kỹ thuật** | ISR (Incremental Static Regeneration), Image Optimization (next/image), Code Splitting.[cite: 2]                                        |
| **Đo bằng**  | Lighthouse CI.[cite: 2]                                                                                                                 |
| **Ưu tiên**  | Cao[cite: 2]                                                                                                                            |

### 4.2. Bảo mật (NFR-SEC)[cite: 2]

Toàn bộ yêu cầu bảo mật tuân thủ OWASP Top 10 (2021) và được kiểm thử qua security review trước khi release production.[cite: 2]

#### NFR-SEC-001: Password & Hashing[cite: 2]

|                |                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**      | Mật khẩu phải được hash bằng `bcrypt` (bcryptjs) hoặc `argon2` với salt 16 bytes, cost factor ≥ 10. Không bao giờ lưu plaintext password.[cite: 2]                                               |
| **Chính sách** | Độ phức tạp: ≥ 8 ký tự, chứa ít nhất 1 chữ hoa + 1 chữ thường + 1 số + 1 ký tự đặc biệt (Zod password validation scheme).[cite: 2] |
| **Ưu tiên**    | Rất cao[cite: 2]                                                                                                                                                                                 |

#### NFR-SEC-002: JWT Token Security[cite: 2]

|               |                                                                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**     | Access Token: JWT signed bằng HS256 (jsonwebtoken), TTL = 15 phút, claim: userId, email, roles, jti. Refresh Token: 128-bit cryptographically secure random bytes (crypto.randomBytes), hash SHA-256 (crypto.createHash('sha256')) trước khi lưu DB, TTL = 7 ngày.[cite: 2] |
| **Rotation**  | Refresh token bị revoke ngay sau khi dùng, cấp token mới (Refresh Token Rotation).[cite: 2]                                                                                                                                                                                 |
| **Detection** | Nếu refresh token đã bị revoke được dùng lại → revoke toàn bộ family (Reuse Detection).[cite: 2]                                                                                                                                                                            |
| **Ưu tiên**   | Rất cao[cite: 2]                                                                                                                                                                                                                                                            |

#### NFR-SEC-003: Rate Limiting[cite: 2]

|                    |                                                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**          | Giới hạn yêu cầu theo IP để ngăn brute force và DDoS: Auth endpoints (/auth/\*): 10 request/phút/IP; API chung: 100 request/phút/IP; Upload endpoints: 5 request/phút/IP.[cite: 2] |
| **Implementation** | `express-rate-limit` (Fixed Window, sliding window cho auth). HTTP 429 khi vượt giới hạn với Retry-After header.[cite: 2]                                                          |
| **Ưu tiên**        | Rất cao[cite: 2]                                                                                                                                                                   |

#### NFR-SEC-004: Input Validation & File Upload Security[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Toàn bộ input được validate tại Application Layer (Zod) TRƯỚC khi xử lý: SQL Injection — Prisma parameterized queries (không raw SQL với user input); XSS — Input sanitization + Content-Security-Policy header; MIME Validation — Đọc magic bytes (không tin vào Content-Type header) khi upload; File size — Kiểm tra trước khi read stream (multer limits, không buffer toàn bộ vào memory trước); Path Traversal — GUID-based filename generation (uuid) không dùng tên file của user.[cite: 2] |
| **Ưu tiên** | Rất cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

#### NFR-SEC-005: HTTPS & CORS[cite: 2]

|             |                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Toàn bộ traffic phải qua HTTPS (TLS 1.2+): Nginx redirect HTTP → HTTPS, HSTS header (max-age=31536000).[cite: 2]                                                      |
| **CORS**    | `cors` package: Chỉ cho phép origin được cấu hình qua .env (không wildcard \`\*\`). Allowed Origins: http://localhost:3000 (dev), https://domain.com (prod).[cite: 2] |
| **Cookie**  | SameSite=Strict, Secure=true (nếu dùng cookie cho refresh token).[cite: 2]                                                                                            |
| **Ưu tiên** | Rất cao[cite: 2]                                                                                                                                                      |

#### NFR-SEC-006: Authorization & Resource Ownership[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Kiểm tra phân quyền tại Application Layer (không chỉ ở Presentation Layer): `authorize(roles)` middleware (Passport.js) xác minh ResourceOwnership — Author chỉ xóa recipe của mình; Role-based policies — "AuthorPolicy", "AdminPolicy" (không hardcode role string); Sensitive endpoints (DELETE, PATCH publish) — double-check user ID trước khi commit; Audit trail — Log mọi write operation với userId + timestamp (Pino).[cite: 2] |
| **Ưu tiên** | Rất cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                                          |

#### NFR-SEC-007: Secrets Management[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Không bao giờ commit secrets vào Git: Development — `.env` (dotenv, .env.example chỉ chứa placeholder); Production — Environment variables (Docker Compose env_file / Kubernetes Secrets); Rotation — Khuyến nghị rotate JWT signing key mỗi 90 ngày; Scanning — Pre-commit hook kiểm tra với truffleHog/gitleaks.[cite: 2] |
| **Ưu tiên** | Rất cao[cite: 2]                                                                                                                                                                                                                                                                                                            |

### 4.3. Khả năng Sử dụng (NFR-USE)[cite: 2]

#### NFR-USE-001: Responsive Design[cite: 2]

|               |                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**     | Giao diện hiển thị chính xác trên tất cả breakpoints: Mobile — 320px–767px (single column, touch-friendly); Tablet — 768px–1199px (2-column grid); Desktop — ≥ 1200px (full layout).[cite: 2] |
| **Framework** | Tailwind CSS utility-first. Không sử dụng CSS framework override. Kiểm thử: Chrome DevTools responsive mode + BrowserStack (iOS, Android).[cite: 2]                                           |
| **Ưu tiên**   | Trung bình[cite: 2]                                                                                                                                                                           |

#### NFR-USE-002: Accessibility (a11y)[cite: 2]

|                   |                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**         | Tuân thủ WCAG 2.1 Level AA: Semantic HTML5 (<article>, <nav>, <main>, <aside>); ARIA attributes (aria-label, aria-expanded, role trên interactive elements); Keyboard navigation — tất cả chức năng dùng được bằng bàn phím (Tab, Enter, Escape); Color contrast ratio ≥ 4.5:1 (text) và ≥ 3:1 (UI components).[cite: 2] |
| **Screen reader** | Test với NVDA (Windows) và VoiceOver (macOS/iOS).[cite: 2]                                                                                                                                                                                                                                                               |
| **Ưu tiên**       | Trung bình[cite: 2]                                                                                                                                                                                                                                                                                                      |

#### NFR-USE-003: Error Messages[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Thông báo lỗi phải rõ ràng và actionable: API — trả về RFC 7807 Problem Details (type, title, status, detail, errors{}); Frontend — hiển thị ngay bên cạnh field lỗi (React Hook Form inline validation); Server errors (5xx) — hiển thị thông báo thân thiện, không lộ stack trace; I18n-ready — error messages sử dụng error code (không hardcode tiếng Việt/Anh).[cite: 2] |
| **Ưu tiên** | Trung bình[cite: 2]                                                                                                                                                                                                                                                                                                                                                           |

#### NFR-USE-004: Loading States[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**   | Mọi async operation phải có visual feedback: Loading skeleton — hiển thị trong khi fetch data (không blank screen); Optimistic update — UI cập nhật ngay, rollback nếu API fail; Toast notification — xác nhận thành công/thất bại sau write operation; Progress indicator — upload ảnh hiển thị progress bar (%) realtime.[cite: 2] |
| **Ưu tiên** | Trung bình[cite: 2]                                                                                                                                                                                                                                                                                                                  |

### 4.4. Độ tin cậy (NFR-REL)[cite: 2]

#### NFR-REL-001: Uptime SLA[cite: 2]

|              |                                                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**    | Hệ thống có uptime ≥ 99.5% (≈ 3.65 giờ downtime/năm).[cite: 2]                                                                                                                                                               |
| **Quy định** | Maintenance window — công bố trước 48 giờ qua banner thông báo; Health check — /health/ready probe mỗi 10 giây (Kubernetes readiness probe); Monitoring — Uptime Robot / Better Uptime gửi alert khi down > 1 phút.[cite: 2] |
| **Ưu tiên**  | Cao[cite: 2]                                                                                                                                                                                                                 |

#### NFR-REL-002: Error Handling & Resilience[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**   | Hệ thống xử lý lỗi gracefully, không crash toàn bộ: Global Error Handling Middleware — bắt tất cả unhandled errors → trả 500 Problem Details + log (Pino); Database connection pool — Prisma tự reconnect, timeout 30s; Redis failover — nếu Redis down → fallback database (không cache), không throw exception; BullMQ retry — mỗi job tối đa 3 retry với exponential backoff; Circuit Breaker — (tùy chọn nâng cao) `opossum` hoặc custom cho external HTTP calls.[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

#### NFR-REL-003: Data Durability[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Dữ liệu không bị mất trong trường hợp restart hoặc crash: PostgreSQL WAL (Write-Ahead Logging) — đảm bảo ACID; Backup — pg_dump tự động hàng ngày lúc 03:00 AM, lưu 30 ngày; MinIO — dữ liệu file trên volume persistent (không ephemeral container storage); Refresh tokens — lưu DB (không Redis) để survive restart; Soft delete — Recipe được đánh dấu IsDeleted thay vì xóa vật lý (có thể khôi phục).[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                         |

### 4.5. Khả năng Bảo trì (NFR-MAINT)[cite: 2]

#### NFR-MAINT-001: Code Quality[cite: 2]

|             |                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Toàn bộ code phải pass static analysis trước khi merge: Node.js/TypeScript — ESLint (Airbnb ruleset), Prettier; Không có compiler warnings trong build CI (tsc --noEmit); Code review — ít nhất 1 reviewer phê duyệt Pull Request.[cite: 2] |
| **Ưu tiên** | Trung bình[cite: 2]                                                                                                                                                                                                                         |

#### NFR-MAINT-002: Test Coverage[cite: 2]

|             |                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Độ phủ test tối thiểu: Unit tests — ≥ 80% line coverage (Application layer commands, queries, validators); Integration tests — tất cả API endpoints có ít nhất 1 happy path + 1 error case; E2E tests — 5 critical user flows (register, login, create recipe, publish, search).[cite: 2] |
| **Tool**    | Vitest (backend unit), Jest + Testing Library (frontend), Playwright (E2E).[cite: 2]                                                                                                                                                                                                      |
| **Ưu tiên** | Trung bình[cite: 2]                                                                                                                                                                                                                                                                       |

#### NFR-MAINT-003: Documentation[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Tài liệu kỹ thuật bắt buộc: README.md — hướng dẫn setup dev environment (Docker Compose) trong < 5 phút; API documentation — tự động sinh từ JSDoc/OpenAPI comments + Scalar/Swagger UI tại /scalar; Architecture Decision Records (ADR) — ghi lại mọi quyết định kiến trúc quan trọng; CHANGELOG.md — cập nhật mỗi release (theo Keep a Changelog + SemVer).[cite: 2] |
| **Ưu tiên** | Trung bình[cite: 2]                                                                                                                                                                                                                                                                                                                                                    |

#### NFR-MAINT-004: Clean Architecture Compliance[cite: 2]

|              |                                                                                                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**    | Tuân thủ nghiêm ngặt dependency rules của Clean Architecture: Domain layer — KHÔNG dependency vào bất kỳ layer nào khác, không có npm packages ngoài Zod; Application layer — chỉ depend vào Domain, KHÔNG reference Infrastructure; Infrastructure layer — depend vào Application (implements interfaces).[cite: 2] |
| **CQRS**     | Commands thay đổi state, Queries đọc data — không trộn lẫn.[cite: 2]                                                                                                                                                                                                                                                 |
| **Kiểm tra** | Dependency rules được kiểm tra qua custom ESLint rule / ts-prune / dependency-cruiser trong CI.[cite: 2]                                                                                                                                                                                                             |
| **Ưu tiên**  | Trung bình[cite: 2]                                                                                                                                                                                                                                                                                                  |

### 4.6. Khả năng Mở rộng (NFR-SCALE)[cite: 2]

#### NFR-SCALE-001: Stateless Backend[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | API được thiết kế stateless để hỗ trợ horizontal scaling: JWT authentication (jsonwebtoken, không session server-side); Distributed cache (Redis, không in-memory node-cache) cho mọi shared state; Distributed lock (`redlock`) cho các tác vụ singleton (sitemap generation); BullMQ chạy với multiple workers, Redis làm shared queue.[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                       |

#### NFR-SCALE-002: Database Scaling[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Chiến lược database scaling: Connection pooling — pg-pool built-in pool (max 100 connections/instance); Read replica (tùy chọn) — Prisma đọc/write splitting qua multi-client setup; Index strategy — B-tree cho equality/range, GIN cho full-text search (tsvector); Table partitioning — (nâng cao) partition Recipe by CreatedAt khi > 1 triệu rows.[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                     |

#### NFR-SCALE-003: Infrastructure Scaling[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**   | Hạ tầng có thể scale theo chiều ngang: Docker — mỗi service là container riêng biệt (API, Postgres, Redis, MinIO, Nginx); Nginx — load balancer upstream pool cho nhiều API instances; MinIO — Distributed Mode (4+ nodes) cho production storage scaling; CDN — static assets (Next.js \_next/static) được serve qua CDN (Cloudflare).[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                     |

### 4.7. Tối ưu SEO (NFR-SEO)[cite: 2]

#### NFR-SEO-001: Structured Data[cite: 2]

|              |                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**    | Mỗi trang công thức nấu ăn phải có JSON-LD Schema.org Recipe markup: @type: "Recipe"; Thuộc tính: name, description, image, author, datePublished, prepTime, cookTime, totalTime, recipeYield, recipeIngredient[], recipeInstructions[], nutrition.[cite: 2] |
| **Validate** | Google Rich Results Test — phải pass 100%. Kết quả: Rich Snippets trên Google Search (star rating, time, ingredients).[cite: 2]                                                                                                                              |
| **Ưu tiên**  | Cao[cite: 2]                                                                                                                                                                                                                                                 |

#### NFR-SEO-002: Meta Tags & Open Graph[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Mỗi trang phải có đầy đủ: <title> — "{Recipe Name} \| Culinary Blog" (≤ 60 ký tự); <meta name="description"> — mô tả 150–160 ký tự; Open Graph — og:title, og:description, og:image (1200×630px), og:url, og:type; Twitter Card — summary_large_image; Canonical URL — tránh duplicate content (slug-based URL); Robots — index, follow (published) \| noindex (draft/archived).[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                              |

#### NFR-SEO-003: Sitemap & Robots[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | Sitemap XML tự động: Sinh bởi FR-JOB-003 (BullMQ Recurring Job, hàng ngày 02:00 AM UTC); Bao gồm tất cả Published recipes + category pages + trang tĩnh; Format: sitemap.xml chuẩn, có <loc>, <lastmod>, <changefreq>, <priority>; Robots.txt — cho phép tất cả crawlers, khai báo Sitemap URL; Ping Google Search Console sau khi update sitemap.[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                |

#### NFR-SEO-004: URL Structure[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**   | URL phải thân thiện SEO: Recipes — /recipes/{slug}, slug là chữ thường, gạch nối, không dấu; Categories — /categories/{slug}; Slug generation — tự động từ title (slugify), unique, không thay đổi sau khi publish; Redirect — nếu slug thay đổi (draft) → 301 redirect từ slug cũ sang slug mới; Không dùng query params cho nội dung chính (chỉ dùng cho filter/sort/pagination).[cite: 2] |
| **Ưu tiên** | Cao[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                 |

## 5. Yêu cầu Giao diện Ngoài[cite: 2]

Chương này mô tả tất cả giao diện giữa hệ thống Culinary Blog với các thực thể bên ngoài: người dùng cuối, phần cứng, phần mềm bên thứ ba và giao tiếp mạng.[cite: 2] Mọi giao tiếp đều qua HTTPS (TLS 1.2+) trong môi trường production.[cite: 2]

### 5.1. Giao diện Người dùng (UI)[cite: 2]

Hệ thống cung cấp giao diện web duy nhất trên nền Next.js App Router, hoạt động như Single Page Application (SPA) với Server-Side Rendering (SSR) và Incremental Static Regeneration (ISR).[cite: 2]

| Màn hình / Route             | Mô tả                                                   | Loại Rendering        | Yêu cầu Auth[cite: 2]                  |
| ---------------------------- | ------------------------------------------------------- | --------------------- | -------------------------------------- |
| /                            | Trang chủ: danh sách recipe nổi bật + categories        | ISR (revalidate=3600) | Không[cite: 2]                         |
| /recipes                     | Danh sách tất cả recipes với filter/sort/search         | SSR (dynamic)         | Không[cite: 2]                         |
| /recipes/[slug]              | Chi tiết recipe: ingredients, steps, nutrition, JSON-LD | ISR (revalidate=300)  | Không[cite: 2]                         |
| /categories                  | Danh sách category                                      | ISR (revalidate=3600) | Không[cite: 2]                         |
| /categories/[slug]           | Danh sách recipe theo category                          | ISR (revalidate=600)  | Không[cite: 2]                         |
| /auth/login                  | Form đăng nhập (email/password + Google OAuth button)   | CSR                   | Không (redirect nếu đã login)[cite: 2] |
| /auth/register               | Form đăng ký tài khoản mới                              | CSR                   | Không[cite: 2]                         |
| /dashboard                   | Trang tổng quan của Author/Admin                        | CSR                   | Bắt buộc (Author/Admin)[cite: 2]       |
| /dashboard/recipes           | Quản lý danh sách recipe của user                       | CSR                   | Bắt buộc[cite: 2]                      |
| /dashboard/recipes/new       | Form tạo recipe mới (multi-step wizard)                 | CSR                   | Bắt buộc (Author/Admin)[cite: 2]       |
| /dashboard/recipes/[id]/edit | Form chỉnh sửa recipe                                   | CSR                   | Bắt buộc (Owner/Admin)[cite: 2]        |
| /dashboard/categories        | Quản lý categories (chỉ Admin)                          | CSR                   | Bắt buộc (Admin)[cite: 2]              |
| /profile                     | Xem và chỉnh sửa thông tin cá nhân                      | CSR                   | Bắt buộc[cite: 2]                      |
| /search                      | Trang kết quả full-text search                          | SSR                   | Không[cite: 2]                         |

### 5.2. Giao diện Phần mềm – REST API[cite: 2]

Backend cung cấp RESTful API theo chuẩn JSON.[cite: 2] Toàn bộ endpoints được tiền tố /api/v1.[cite: 2] Xem chi tiết tại Chương 8.[cite: 2]

| Đặc tả                 | Giá trị                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Giao thức**          | HTTP/1.1 và HTTP/2 qua HTTPS (TLS 1.2+). Nginx termination SSL.[cite: 2]                                                                                                                                       |
| **Base URL (dev)**     | http://localhost:5000/api/v1[cite: 2]                                                                                                                                                                          |
| **Base URL (prod)**    | https://api.culinaryblog.com/api/v1[cite: 2]                                                                                                                                                                   |
| **Content-Type**       | application/json; charset=utf-8 (request và response). Multipart/form-data cho file upload endpoints.[cite: 2]                                                                                                 |
| **Authentication**     | Bearer Token trong Authorization header: `Authorization: Bearer <access_token>`. Refresh token: trong request body (không dùng cookie để tránh CSRF).[cite: 2]                                                 |
| **Response Format**    | Success: `{ "data": {...}, "meta": { "page":1, "pageSize":10, "total":100 } }`. Error: RFC 7807 Problem Details `{ "type", "title", "status", "detail", "errors":{} }`.[cite: 2]                               |
| **Versioning**         | URL Path versioning: /api/v1/. Khi có breaking changes → /api/v2/ (v1 được duy trì tối thiểu 6 tháng).[cite: 2]                                                                                                |
| **CORS Headers**       | Access-Control-Allow-Origin: <configured-origins>; Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS; Access-Control-Allow-Headers: Content-Type, Authorization, X-Correlation-ID.[cite: 2] |
| **Rate Limit Headers** | X-RateLimit-Limit: 100; X-RateLimit-Remaining: 87; X-RateLimit-Reset: 1700000000 (Unix timestamp); Retry-After: 30 (seconds, khi 429).[cite: 2]                                                                |
| **Correlation ID**     | X-Correlation-ID header: sinh tự động nếu không có trong request, trả về trong response. Gán vào tất cả log entries (Pino bindings — logger.child({ correlationId })).[cite: 2]                                |

### 5.3. Giao diện Dịch vụ Bên thứ ba[cite: 2]

| Dịch vụ               | Mục đích                                  | Giao thức / SDK                                                                                                                                                       | Cấu hình / Secrets                                                                                            |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Google OAuth 2.0      | Đăng nhập / đăng ký bằng tài khoản Google | OAuth 2.0 Authorization Code + PKCE (`passport-google-oauth20`). Redirect URI: /api/v1/auth/google/callback. Scopes: openid, email, profile.[cite: 2]                 | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (.env / env var). Google Cloud Console → OAuth 2.0 Client ID.[cite: 2] |
| MinIO (S3-compatible) | Lưu trữ file ảnh công thức                | AWS SDK for JavaScript (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner). Endpoint override cho MinIO. Presigned URL cho direct browser upload (optional).[cite: 2] | MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME. Docker service: minio:9000.[cite: 2]   |
| BullMQ                | Background job processing                 | npm: bullmq + ioredis. Workers chạy trong process riêng. Dashboard: /admin/queues (Admin only, policy protected).[cite: 2]                                            | REDIS_URL dùng chung cho Redis. Thư viện UI: bull-board.[cite: 2]                                             |
| Pino + Seq            | Structured logging & log aggregation      | pino, pino-http, transport tới Seq HTTP ingest API.[cite: 2]                                                                                                          | SEQ_SERVER_URL = http://seq:5341 (Docker). Production: Elastic / Grafana Loki.[cite: 2]                       |
| OpenTelemetry         | Distributed tracing & metrics             | @opentelemetry/sdk-node, OTLP exporter. Tracing: HTTP requests, Prisma, Express middleware.[cite: 2]                                                                  | OTEL_EXPORTER_OTLP_ENDPOINT. Development: Seq OTLP. Production: Grafana Tempo / Jaeger.[cite: 2]              |
| SMTP / Email          | Gửi welcome email (FR-JOB-001)            | `nodemailer` (IEmailSender). Kết nối qua SMTP với TLS.[cite: 2]                                                                                                       | SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD. Development: Mailhog (Docker).[cite: 2]                   |
| Google Search Console | Ping sitemap update                       | HTTP GET: https://www.google.com/ping?sitemap={url}. Không cần API key. Gọi trong FR-JOB-003.[cite: 2]                                                                | —[cite: 2]                                                                                                    |

### 5.4. Giao diện Phần cứng[cite: 2]

Hệ thống là web application, không giao tiếp trực tiếp với phần cứng chuyên biệt.[cite: 2] Yêu cầu phần cứng tối thiểu cho server:[cite: 2]

| Thành phần     | Development (local)                                               | Production (minimum)[cite: 2]                |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| CPU            | 2 cores (Intel/AMD/ARM64 — Apple M-series được hỗ trợ qua Docker) | 2 vCPU (VPS/Cloud instance, x86_64)[cite: 2] |
| RAM            | 8 GB (chạy Docker Compose đầy đủ: API + PG + Redis + MinIO + Seq) | 4 GB (API + dependencies riêng lẻ)[cite: 2]  |
| Storage        | 20 GB SSD (cho Docker images + database data + MinIO volumes)     | 50 GB SSD (production data growth)[cite: 2]  |
| Network        | Kết nối internet (npm packages, Google OAuth)                     | Bandwidth ≥ 1 Gbps, IP tĩnh[cite: 2]         |
| Browser Client | Chrome 112+, Firefox 113+, Safari 16+, Edge 112+ (ES2020+)        | Tương tự — không hỗ trợ IE11[cite: 2]        |

## 6. Kiến trúc Hệ thống[cite: 2]

Chương này mô tả tổng quan kiến trúc phần mềm của hệ thống Culinary Blog.[cite: 2] Hệ thống được thiết kế theo mô hình Client-Server với hai tầng riêng biệt: Frontend (Next.js) và Backend (Node.js/Express.js), giao tiếp qua REST API.[cite: 2] Backend tuân thủ nguyên tắc Clean Architecture kết hợp CQRS pattern.[cite: 2]

### 6.1. Tổng quan Kiến trúc[cite: 2]

| Tầng                    | Technology                                                                                          | Vai trò                                                                                | Giao tiếp với                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| Client (Browser/Mobile) | Browser (Chrome/Firefox/Safari)                                                                     | Người dùng tương tác qua giao diện web                                                 | Next.js App[cite: 2]                          |
| Frontend                | Next.js 14+ App Router, TypeScript, Tailwind CSS, Auth.js v5, TanStack Query, React Hook Form + Zod | Rendering UI, route management, client-side state. SSR/ISR cho SEO.[cite: 2]           | —[cite: 2]                                    |
| Backend REST API        | Nginx Reverse Proxy — Nginx Alpine (Docker)                                                         | SSL termination, load balancing, static file caching, rate limiting basic.[cite: 2]    | Frontend :3000, Backend API :5000[cite: 2]    |
| Backend API             | Node.js 20 + Express.js (TypeScript)                                                                | Business logic, authentication, data access, background jobs.[cite: 2]                 | PostgreSQL, Redis, MinIO, Email[cite: 2]      |
| Cache Layer             | Redis 7                                                                                             | Distributed cache cho recipe/category/search results. Rate limiting counters.[cite: 2] | Backend API[cite: 2]                          |
| Object Storage          | MinIO (S3-compatible)                                                                               | Lưu file ảnh: original, medium (800×600), thumbnail (300×300).[cite: 2]                | Backend API (via @aws-sdk/client-s3)[cite: 2] |
| Database                | PostgreSQL 16                                                                                       | Persistent relational data storage. Full-text search via tsvector.[cite: 2]            | Backend API (via Prisma)[cite: 2]             |
| Observability           | Pino + Seq, OpenTelemetry + Grafana/Jaeger                                                          | Logging, metrics, distributed tracing.[cite: 2]                                        | Backend API[cite: 2]                          |

### 6.2. Kiến trúc Backend – Clean Architecture[cite: 2]

Backend tuân thủ Clean Architecture (Robert C. Martin) với nguyên tắc Dependency Rule: dependency chỉ đi vào trong (hướng Domain).[cite: 2] Không bao giờ có reference từ Domain/Application ra Infrastructure.[cite: 2]

#### Domain Layer (src/domain)[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vai trò** | Nhân lõi hệ thống.[cite: 2]                                                                                                                                                                                                                                                                                                     |
| **Chứa**    | Entities: Recipe, Category, User, RecipeStep, RecipeIngredient, RecipeImage; Value Objects: Slug, EmailAddress; Owned Entities: RecipeNutrition; Domain Events (optional): RecipePublishedEvent; Enums: RecipeDifficulty, RecipeStatus; Interfaces: IRecipeRepository, ICategoryRepository. Không có npm dependencies.[cite: 2] |

#### Application Layer (src/application)[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vai trò** | Orchestration Layer.[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Chứa**    | Commands (CQRS write): CreateRecipeCommand, PublishRecipeCommand, LoginCommand...; Queries (CQRS read): GetRecipesQuery, GetRecipeBySlugQuery...; Handlers (custom command bus): xử lý logic business cho mỗi command/query; DTOs / Response models: RecipeDto, UserDto, PagedResult<T>; Validators (Zod schemas): validation rules cho mỗi command; Pipeline Behaviors: ValidationMiddleware, LoggingMiddleware, CachingMiddleware, PerformanceMiddleware; Service interfaces: IEmailService, IJwtService, IFileStorageService, ICurrentUser.[cite: 2] |

#### Infrastructure Layer (src/infrastructure)[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vai trò** | Implements application interfaces.[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                    |
| **Chứa**    | Prisma: PrismaService, schema.prisma, migrations, repositories; Repository implementations: RecipeRepository (Prisma + FTS), CategoryRepository; JWT Service: JwtService (jsonwebtoken); File Storage: MinioFileStorageService (@aws-sdk/client-s3); Email: NodemailerEmailService; Cache: RedisCacheService (ioredis); BullMQ job registrations; Prisma Middleware: AuditInterceptor (auto set CreatedAt/UpdatedAt).[cite: 2] |

#### Presentation Layer (src/api)[cite: 2]

|             |                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vai trò** | HTTP interface.[cite: 2]                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Chứa**    | Express Router modules: AuthRoutes, RecipesRoutes, CategoriesRoutes; Middleware: GlobalErrorHandler, CorrelationIdMiddleware, RateLimitMiddleware; DI Container: Express DI setup + plugin architecture (addApplication, addInfrastructure, addPresentation); OpenAPI: Scalar UI tại /scalar, JSDoc/OpenAPI comments; Authentication: JWT Bearer + Google OAuth via Auth.js v5 (frontend) hoặc passport-google-oauth20 provider.[cite: 2] |

### 6.3. CQRS Command Bus Pipeline[cite: 2]

CQRS (Command Query Responsibility Segregation) tách biệt read và write models.[cite: 2] Mỗi request đi qua command bus pipeline theo thứ tự:[cite: 2]

| Thứ tự | Pipeline Middleware         | Trách nhiệm                                                                                        | Áp dụng cho                                   |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1      | LoggingMiddleware           | Log request type, parameters, elapsed time. Cảnh báo nếu > 500ms.[cite: 2]                         | Tất cả Commands và Queries                    |
| 2      | ValidationMiddleware        | Chạy Zod validators đã đăng ký. Throw ValidationError nếu có lỗi.[cite: 2]                         | Tất cả Commands và Queries có Validator       |
| 3      | CachingMiddleware           | Kiểm tra Redis cache trước khi xử lý. Yêu cầu implements ICacheable interface trên Query.[cite: 2] | Queries implements ICacheable (GET endpoints) |
| 4      | Handler                     | Thực thi business logic: gọi repositories, raise domain events, tạo response DTO.[cite: 2]         | Tất cả (bắt buộc)                             |
| 5      | CacheInvalidationMiddleware | Xóa cache liên quan sau khi Command thành công. Yêu cầu implements ICacheInvalidator.[cite: 2]     | Commands thay đổi data (Create/Update/Delete) |

### 6.4. Mô hình Quan hệ Thực thể (ERD tóm tắt)[cite: 2]

Hệ thống sử dụng PostgreSQL 16 với Prisma schema.[cite: 2] Tất cả entities có các trường chung: Id (UUID), CreatedAt, UpdatedAt, IsDeleted, Version.[cite: 2]

| Thực thể     | Quan hệ                                                                                                                                                   | Bảng PostgreSQL                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recipe       | Nhiều RecipeStep (1:N), Nhiều RecipeIngredient (1:N), Nhiều RecipeImage (1:N), Một RecipeNutrition (1:1 Owned), Một Category (N:1), Một Author/User (N:1) | "recipes", "recipe_steps", "recipe_ingredients", "recipe_images", "recipe_nutrition" (owned — cột trong recipes), "categories", "users"[cite: 2] |
| User         | Nhiều Recipe (Author, 1:N), Nhiều RefreshToken (1:N)                                                                                                      | "users", "refresh_tokens"[cite: 2]                                                                                                               |
| Category     | Nhiều Recipe (1:N)                                                                                                                                        | "categories"[cite: 2]                                                                                                                            |
| RefreshToken | Một User (N:1)                                                                                                                                            | "refresh_tokens"[cite: 2]                                                                                                                        |

### 6.5. Triển khai – Docker Compose[cite: 2]

Toàn bộ hệ thống được containerized với Docker Compose.[cite: 2] Development dùng docker-compose.yml, Production dùng docker-compose.prod.yml với optimized build + secrets management.[cite: 2]

| Service  | Image                         | Port (host:container)            | Volume / Dependency                                                                |
| -------- | ----------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| nginx    | nginx:alpine                  | 80:80, 443:443                   | Depends: api, frontend. Volume: ./nginx/nginx.conf, ./ssl/[cite: 2]                |
| api      | culinaryblog-api (Dockerfile) | 5000:8080                        | Depends: postgres, redis, minio. Env file: .env.production[cite: 2]                |
| frontend | culinaryblog-web (Dockerfile) | 3000:3000                        | Depends: api[cite: 2]                                                              |
| postgres | postgres:16-alpine            | 5432:5432                        | Volume: pgdata:/var/lib/postgresql/data. Env: POSTGRES_DB, USER, PASSWORD[cite: 2] |
| redis    | redis:7-alpine                | 6379:6379                        | Volume: redisdata:/data. Command: redis-server --appendonly yes[cite: 2]           |
| minio    | minio/minio:latest            | 9000:9000, 9001:9001 (Console)   | Volume: miniodata:/data. Command: server /data --console-address :9001[cite: 2]    |
| seq      | datalust/seq:latest           | 5341:80                          | Volume: seqdata:/data. Dev only — không deploy production[cite: 2]                 |
| mailhog  | mailhog/mailhog               | 8025:8025 (UI), 1025:1025 (SMTP) | Dev only — test email[cite: 2]                                                     |

## 7. Mô hình Dữ liệu[cite: 2]

Chương này đặc tả cấu trúc dữ liệu đầy đủ của hệ thống Culinary Blog.[cite: 2] Tất cả entities kế thừa BaseEntity và sử dụng Soft Delete pattern (IsDeleted flag).[cite: 2] Database: PostgreSQL 16 với Prisma ORM.[cite: 2]

### 7.1. BaseEntity (Abstract)[cite: 2]

Tất cả thực thể kế thừa từ BaseEntity.[cite: 2] Không tạo bảng riêng — mỗi entity có bảng riêng với các cột kế thừa (được khai báo lại trong từng model của schema.prisma).[cite: 2]

| Column    | Kiểu dữ liệu            | Ràng buộc                                       | Mô tả                                                                                                                                   |
| --------- | ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Id        | uuid (String @db.Uuid)  | @id, @default(dbgenerated("gen_random_uuid()")) | Khóa chính UUID v4 — tránh sequential ID guessing.[cite: 2]                                                                             |
| CreatedAt | timestamptz (DateTime)  | @default(now())                                 | Thời điểm tạo bản ghi. Set bởi Prisma middleware (AuditMiddleware).[cite: 2]                                                            |
| UpdatedAt | timestamptz (DateTime?) | @updatedAt                                      | Thời điểm cập nhật cuối. Set tự động bởi Prisma.[cite: 2]                                                                               |
| IsDeleted | boolean                 | @default(false)                                 | Soft delete flag. Global middleware filter: mọi query tự thêm `where: { isDeleted: false }`.[cite: 2]                                   |
| Version   | integer                 | @default(1)                                     | Optimistic concurrency control — tăng dần mỗi lần update. Prisma `where: { version: clientVersion }` để phát hiện lost update.[cite: 2] |

### 7.2. Recipe[cite: 2]

Thực thể trung tâm của hệ thống.[cite: 2] Một Recipe thuộc một Category và một Author.[cite: 2] Chứa Owned Model RecipeNutrition và các relation fields.[cite: 2]

| Column                                      | Kiểu dữ liệu | Ràng buộc                                                   | Index                                     | Mô tả                                                                                                                                          |
| ------------------------------------------- | ------------ | ----------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Id                                          | uuid         | PK (BaseEntity)                                             | PK                                        | Khóa chính.[cite: 2]                                                                                                                           |
| Title                                       | varchar(200) | NOT NULL                                                    | IDX_Recipe_Title (GIN trigram — optional) | Tiêu đề công thức. Unique không bắt buộc (có thể trùng title khác nhau slug).[cite: 2]                                                         |
| Slug                                        | varchar(220) | NOT NULL, UNIQUE                                            | IDX_Recipe_Slug (UNIQUE B-tree)           | URL-friendly identifier. Sinh từ Title + chuẩn hóa (lowercase, replace space → -). Không thay đổi sau Publish.[cite: 2]                        |
| Description                                 | text         | NOT NULL                                                    | —                                         | Mô tả ngắn (≤ 2000 ký tự). Hiển thị trong card preview và SEO meta description.[cite: 2]                                                       |
| Instructions                                | text         | NOT NULL                                                    | —                                         | Hướng dẫn tổng quan dạng markdown (legacy field). Chi tiết dùng RecipeSteps.[cite: 2]                                                          |
| PrepTime                                    | integer      | NOT NULL, CHECK > 0                                         | —                                         | Thời gian chuẩn bị (phút).[cite: 2]                                                                                                            |
| CookTime                                    | integer      | NOT NULL, CHECK >= 0                                        | —                                         | Thời gian nấu (phút). 0 cho "No cook" recipes.[cite: 2]                                                                                        |
| Servings                                    | integer      | NOT NULL, CHECK > 0                                         | —                                         | Số khẩu phần (portions).[cite: 2]                                                                                                              |
| Difficulty                                  | enum         | NOT NULL, @default(EASY)                                    | IDX_Recipe_Difficulty                     | RecipeDifficulty: Easy, Medium, Hard, Expert.[cite: 2]                                                                                         |
| Status                                      | enum         | NOT NULL, @default(DRAFT)                                   | IDX_Recipe_Status                         | RecipeStatus: Draft, Published, Archived.[cite: 2]                                                                                             |
| CategoryId                                  | uuid         | NOT NULL, FK → Categories.Id, @relation(onDelete: Restrict) | IDX_Recipe_CategoryId (B-tree)            | Khóa ngoại đến Category. Riêng tư — không xóa category có recipe.[cite: 2]                                                                     |
| AuthorId                                    | uuid         | NOT NULL, FK → Users.Id                                     | IDX_Recipe_AuthorId (B-tree)              | Khóa ngoại đến User (Author).[cite: 2]                                                                                                         |
| SearchVector                                | tsvector?    | NULL                                                        | IDX_Recipe_Search (GIN)                   | Full-text search vector. Được cập nhật bởi PostgreSQL TRIGGER khi Title/Description thay đổi. Dùng unaccent extension cho tiếng Việt.[cite: 2] |
| PublishedAt                                 | timestamptz? | NULL                                                        | IDX_Recipe_PublishedAt                    | Thời điểm publish. Set khi Status chuyển sang Published. NULL nếu chưa publish.[cite: 2]                                                       |
| CreatedAt / UpdatedAt / IsDeleted / Version | —            | (BaseEntity)                                                | IDX_Recipe_IsDeleted (partial)            | Kế thừa BaseEntity — global filter.[cite: 2]                                                                                                   |

#### 7.2.1. RecipeNutrition (Owned Model — cột trong bảng Recipes)[cite: 2]

Owned Model — không có bảng riêng.[cite: 2] Các cột được nhúng trực tiếp vào bảng Recipes với tiền tố "Nutrition\_".[cite: 2]

| Column trong DB         | Property (Prisma) | Kiểu          | Mô tả                                           |
| ----------------------- | ----------------- | ------------- | ----------------------------------------------- |
| Nutrition_Calories      | calories          | decimal(8,2)? | Năng lượng (kcal / serving). Nullable.[cite: 2] |
| Nutrition_Protein       | protein           | decimal(8,2)? | Đạm (gram / serving). Nullable.[cite: 2]        |
| Nutrition_Carbohydrates | carbohydrates     | decimal(8,2)? | Tinh bột (gram / serving). Nullable.[cite: 2]   |
| Nutrition_Fat           | fat               | decimal(8,2)? | Chất béo (gram / serving). Nullable.[cite: 2]   |
| Nutrition_Fiber         | fiber             | decimal(8,2)? | Chất xơ (gram / serving). Nullable.[cite: 2]    |
| Nutrition_Sodium        | sodium            | decimal(8,2)? | Natri (mg / serving). Nullable.[cite: 2]        |

### 7.3. RecipeStep[cite: 2]

Các bước thực hiện chi tiết của một Recipe, được sắp xếp theo StepNumber.[cite: 2]

| Column       | Kiểu          | Ràng buộc                                                    | Mô tả                                                               |
| ------------ | ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Id           | uuid          | PK (BaseEntity)                                              | UUID khóa chính.[cite: 2]                                           |
| RecipeId     | uuid          | NOT NULL, FK → Recipes.Id, onDelete: Cascade                 | Khóa ngoại. Cascade delete: xóa Recipe → xóa tất cả Steps.[cite: 2] |
| StepNumber   | integer       | NOT NULL, CHECK > 0. UNIQUE cùng RecipeId (composite unique) | Thứ tự bước (1, 2, 3...).[cite: 2]                                  |
| Title        | varchar(200)  | NOT NULL                                                     | Tên bước ngắn gọn (ví dụ: "Sơ chế nguyên liệu").[cite: 2]           |
| Description  | text          | NOT NULL                                                     | Mô tả chi tiết bước thực hiện.[cite: 2]                             |
| TimerMinutes | integer?      | NULL, CHECK >= 0                                             | Thời gian cần cho bước này (phút). NULL nếu không áp dụng.[cite: 2] |
| ImageUrl     | varchar(500)? | NULL                                                         | URL ảnh minh họa bước (trên MinIO). Nullable.[cite: 2]              |

### 7.4. RecipeIngredient[cite: 2]

| Column     | Kiểu           | Ràng buộc                                    | Mô tả                                                              |
| ---------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Id         | uuid           | PK (BaseEntity)                              | UUID khóa chính.[cite: 2]                                          |
| RecipeId   | uuid           | NOT NULL, FK → Recipes.Id, onDelete: Cascade | Khóa ngoại với cascade delete.[cite: 2]                            |
| Name       | varchar(200)   | NOT NULL                                     | Tên nguyên liệu (ví dụ: "Thịt bò thăn").[cite: 2]                  |
| Quantity   | decimal(10,3)? | NULL                                         | Số lượng (ví dụ: 500). Nullable cho "nguyên liệu vừa đủ".[cite: 2] |
| Unit       | varchar(50)?   | NULL                                         | Đơn vị đo lường (gram, ml, thìa canh, quả...). Nullable.[cite: 2]  |
| Notes      | varchar(500)?  | NULL                                         | Ghi chú tùy chọn (ví dụ: "thái lát mỏng"). Nullable.[cite: 2]      |
| OrderIndex | integer        | NOT NULL, @default(0)                        | Thứ tự hiển thị trong danh sách nguyên liệu.[cite: 2]              |

### 7.5. RecipeImage[cite: 2]

| Column       | Kiểu          | Ràng buộc                                    | Mô tả                                                                              |
| ------------ | ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Id           | uuid          | PK (BaseEntity)                              | UUID khóa chính.[cite: 2]                                                          |
| RecipeId     | uuid          | NOT NULL, FK → Recipes.Id, onDelete: Cascade | Khóa ngoại với cascade delete.[cite: 2]                                            |
| OriginalUrl  | varchar(500)  | NOT NULL                                     | URL ảnh gốc trên MinIO (ví dụ: .../recipes/{recipeId}/{guid}.jpg).[cite: 2]        |
| MediumUrl    | varchar(500)? | NULL                                         | URL ảnh medium 800×600 (sinh bởi FR-JOB-002). Nullable khi job chưa chạy.[cite: 2] |
| ThumbnailUrl | varchar(500)? | NULL                                         | URL ảnh thumbnail 300×300 (sinh bởi FR-JOB-002). Nullable.[cite: 2]                |
| AltText      | varchar(200)? | NULL                                         | Alt text cho accessibility. Nullable.[cite: 2]                                     |
| IsPrimary    | boolean       | NOT NULL, @default(false)                    | Ảnh chính (hiển thị đầu tiên). Chỉ có 1 ảnh IsPrimary=true / Recipe.[cite: 2]      |
| OrderIndex   | integer       | NOT NULL, @default(0)                        | Thứ tự hiển thị gallery.[cite: 2]                                                  |

### 7.6. Category[cite: 2]

| Column      | Kiểu          | Ràng buộc                           | Mô tả                                         |
| ----------- | ------------- | ----------------------------------- | --------------------------------------------- |
| Id          | uuid          | PK (BaseEntity)                     | UUID khóa chính.[cite: 2]                     |
| Name        | varchar(100)  | NOT NULL, UNIQUE                    | Tên danh mục (ví dụ: "Món khai vị").[cite: 2] |
| Slug        | varchar(120)  | NOT NULL, UNIQUE, IDX_Category_Slug | URL-friendly name. Sinh từ Name.[cite: 2]     |
| Description | text?         | NULL                                | Mô tả danh mục. Nullable.[cite: 2]            |
| ImageUrl    | varchar(500)? | NULL                                | URL ảnh đại diện category. Nullable.[cite: 2] |
| OrderIndex  | integer       | NOT NULL, @default(0)               | Thứ tự hiển thị trên navigation.[cite: 2]     |

### 7.7. User[cite: 2]

Bảng "users" chứa dữ liệu tài khoản người dùng,[cite: 2] được quản lý thủ công với Passport.js JWT + bcrypt.[cite: 2] UserId dùng UUID.[cite: 2]

| Column (custom) | Kiểu          | Ràng buộc                 | Mô tả                                                                       |
| --------------- | ------------- | ------------------------- | --------------------------------------------------------------------------- |
| DisplayName     | varchar(100)  | NOT NULL                  | Tên hiển thị công khai (không phải username).[cite: 2]                      |
| AvatarUrl       | varchar(500)? | NULL                      | URL ảnh avatar. Nullable. Sinh từ Google Avatar khi đăng ký OAuth.[cite: 2] |
| Bio             | text?         | NULL                      | Tiểu sử ngắn của tác giả. Nullable. Hiển thị trên author profile.[cite: 2]  |
| IsActive        | boolean       | NOT NULL, @default(true)  | Trạng thái tài khoản. Admin có thể deactivate user (ban).[cite: 2]          |
| CreatedAt       | timestamptz   | NOT NULL, @default(now()) | Ngày tạo tài khoản.[cite: 2]                                                |

Các cột xác thực: Id (uuid), Email (varchar(256), UNIQUE), PasswordHash (varchar(255), bcrypt hash), Role (enum: GUEST/AUTHOR/ADMIN), TwoFactorEnabled (boolean), LockoutEnabled (boolean), AccessFailedCount (integer).[cite: 2]

### 7.8. RefreshToken[cite: 2]

| Column              | Kiểu         | Ràng buộc                                  | Mô tả                                                              |
| ------------------- | ------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| Id                  | uuid         | PK                                         | UUID khóa chính.[cite: 2]                                          |
| UserId              | uuid         | NOT NULL, FK → Users.Id, onDelete: Cascade | Chủ sở hữu token.[cite: 2]                                         |
| TokenHash           | varchar(64)  | NOT NULL, UNIQUE, IDX_RefreshToken_Hash    | SHA-256 hash của raw token. Không lưu raw token.[cite: 2]          |
| ExpiresAt           | timestamptz  | NOT NULL                                   | Thời hạn token (7 ngày kể từ CreatedAt).[cite: 2]                  |
| RevokedAt           | timestamptz? | NULL                                       | Thời điểm revoke. NULL = còn hiệu lực.[cite: 2]                    |
| ReplacedByTokenHash | varchar(64)? | NULL                                       | Hash của token mới (khi rotation). Để trace token family.[cite: 2] |
| CreatedAt           | timestamptz  | NOT NULL, @default(now())                  | Thời điểm tạo.[cite: 2]                                            |
| CreatedByIp         | varchar(45)? | NULL                                       | IP address tạo token. Lưu để audit.[cite: 2]                       |

## 8. Đặc tả REST API[cite: 2]

Chương này liệt kê tất cả API endpoints của hệ thống Culinary Blog.[cite: 2] Base URL: /api/v1.[cite: 2] Tài liệu chi tiết (request/response schemas) được sinh tự động qua Scalar UI tại /scalar.[cite: 2]

| Convention         | Mô tả                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP Method + Path | Prefixed /api/v1                                                                                                                                           |
| auth required      | = Bearer JWT Access Token                                                                                                                                  |
| role               | = Role tối thiểu cần thiết (Author ⊂ Admin)                                                                                                                |
| Pagination         | Query params: ?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc. Response wrapper: `{ "data":[], "meta":{ "page", "pageSize", "total", "totalPages" } }` |
| Error Format       | RFC 7807 Problem Details: `{ "type":"about:blank", "title":"...", "status":400, "detail":"...", "errors":{"field":["msg"]} }`                              |

### 8.1. Authentication Module (/auth)[cite: 2]

| Method | Endpoint       | Mô tả                           | Auth                      | Request Body / Params                           | Response                                                                                                 |
| ------ | -------------- | ------------------------------- | ------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| POST   | /auth/register | Đăng ký tài khoản mới           | Không                     | { email, password, displayName }                | 201: { userId, email, displayName } 400: validation errors 409: email đã tồn tại[cite: 2]                |
| POST   | /auth/login    | Đăng nhập email/password        | Không                     | { email, password }                             | 200: { accessToken, refreshToken, expiresIn } 401: sai credentials 429: quá giới hạn rate limit[cite: 2] |
| POST   | /auth/google   | Đăng nhập Google OAuth          | Không                     | { idToken } — ID Token từ Google Sign-In JS SDK | 200: { accessToken, refreshToken, expiresIn } 400: invalid token[cite: 2]                                |
| POST   | /auth/refresh  | Làm mới Access Token            | Không (dùng refreshToken) | { refreshToken }                                | 200: { accessToken, refreshToken, expiresIn } 401: token hết hạn / bị revoke[cite: 2]                    |
| POST   | /auth/logout   | Đăng xuất, revoke Refresh Token | Bearer JWT                | { refreshToken }                                | 204: No Content 401: Unauthorized[cite: 2]                                                               |
| GET    | /auth/me       | Lấy thông tin user hiện tại     | Bearer JWT                | —                                               | 200: { id, email, displayName, avatarUrl, bio, roles } 401: Unauthorized[cite: 2]                        |
| PATCH  | /auth/me       | Cập nhật profile người dùng     | Bearer JWT                | { displayName?, avatarUrl?, bio? }              | 200: { id, email, displayName, avatarUrl, bio } 400: validation 401: Unauthorized[cite: 2]               |

### 8.2. Categories Module (/categories)[cite: 2]

| Method | Endpoint           | Mô tả                                     | Auth / Role    | Request                                        | Response                                                                                          |
| ------ | ------------------ | ----------------------------------------- | -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | /categories        | Lấy danh sách tất cả categories           | Không          | —                                              | 200: [{ id, name, slug, description, imageUrl, recipeCount }][cite: 2]                            |
| GET    | /categories/{slug} | Lấy chi tiết category + danh sách recipes | Không          | ?page=1&pageSize=10&sortBy=...                 | 200: { category, recipes: PagedResult } 404: Category not found[cite: 2]                          |
| POST   | /categories        | Tạo category mới                          | Bearer + Admin | { name, description?, imageUrl? }              | 201: { id, name, slug, description } 400: validation 403: Forbidden 409: name đã tồn tại[cite: 2] |
| PUT    | /categories/{id}   | Cập nhật category                         | Bearer + Admin | { name, description?, imageUrl?, orderIndex? } | 200: category updated 400/403/404[cite: 2]                                                        |
| DELETE | /categories/{id}   | Xóa category (soft delete)                | Bearer + Admin | —                                              | 204: No Content 403: Forbidden 404: Not found 409: Có recipes thuộc category này[cite: 2]         |

### 8.3. Recipes Module (/recipes)[cite: 2]

| Method | Endpoint                | Mô tả                                                                 | Auth / Role                 | Request                                                                                                                 |
| ------ | ----------------------- | --------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET    | /recipes                | Danh sách recipes (Published, paginated)                              | Không                       | ?page&pageSize&sortBy&sortOrder&categoryId&difficulty&minPrepTime&maxPrepTime[cite: 2]                                  |
| GET    | /recipes/{slug}         | Chi tiết recipe theo slug (kèm steps, ingredients, images, nutrition) | Không (Draft: Author/Admin) | —[cite: 2]                                                                                                              |
| GET    | /recipes/search         | Full-text search công thức                                            | Không                       | ?q={keyword}&page&pageSize&categoryId&difficulty[cite: 2]                                                               |
| POST   | /recipes                | Tạo recipe mới (trạng thái Draft)                                     | Bearer (Author/Admin)       | { title, description, categoryId, prepTime, cookTime, servings, difficulty, instructions, nutrition? }[cite: 2]         |
| PUT    | /recipes/{id}           | Cập nhật thông tin cơ bản recipe                                      | Bearer (Owner/Admin)        | { title?, description?, categoryId?, prepTime?, cookTime?, servings?, difficulty?, instructions?, nutrition? }[cite: 2] |
| PATCH  | /recipes/{id}/publish   | Publish recipe (Draft → Published)                                    | Bearer (Owner/Admin)        | —[cite: 2]                                                                                                              |
| PATCH  | /recipes/{id}/unpublish | Unpublish recipe (Published → Draft)                                  | Bearer (Owner/Admin)        | —[cite: 2]                                                                                                              |
| PATCH  | /recipes/{id}/archive   | Archive recipe                                                        | Bearer (Owner/Admin)        | —[cite: 2]                                                                                                              |
| DELETE | /recipes/{id}           | Xóa recipe (soft delete)                                              | Bearer (Owner/Admin)        | —[cite: 2]                                                                                                              |

### 8.4. Recipe Images (/recipes/{id}/images)[cite: 2]

| Method | Endpoint                       | Mô tả                                                  | Auth                 | Request                                                 | Response                                                                                          |
| ------ | ------------------------------ | ------------------------------------------------------ | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| POST   | /recipes/{id}/images           | Upload ảnh mới cho recipe                              | Bearer (Owner/Admin) | multipart/form-data: file (image), altText?, isPrimary? | 201: { imageId, originalUrl, altText, isPrimary } 400: MIME invalid / size > 5MB 403/404[cite: 2] |
| PATCH  | /recipes/{id}/images/{imageId} | Cập nhật metadata ảnh (altText, isPrimary, orderIndex) | Bearer (Owner/Admin) | { altText?, isPrimary?, orderIndex? }                   | 200: image updated 403/404[cite: 2]                                                               |
| DELETE | /recipes/{id}/images/{imageId} | Xóa ảnh (MinIO file deleted async via BullMQ)          | Bearer (Owner/Admin) | —                                                       | 204: No Content 403/404[cite: 2]                                                                  |

### 8.5. Recipe Steps (/recipes/{id}/steps)[cite: 2]

| Method | Endpoint                     | Mô tả                    | Auth                 | Request                                                         | Response                                |
| ------ | ---------------------------- | ------------------------ | -------------------- | --------------------------------------------------------------- | --------------------------------------- |
| POST   | /recipes/{id}/steps          | Thêm bước mới vào recipe | Bearer (Owner/Admin) | { stepNumber, title, description, timerMinutes?, imageUrl? }    | 201: RecipeStepDto 400/403/404[cite: 2] |
| PUT    | /recipes/{id}/steps/{stepId} | Cập nhật một bước        | Bearer (Owner/Admin) | { stepNumber?, title?, description?, timerMinutes?, imageUrl? } | 200: RecipeStepDto 400/403/404[cite: 2] |
| DELETE | /recipes/{id}/steps/{stepId} | Xóa một bước             | Bearer (Owner/Admin) | —                                                               | 204: No Content 403/404[cite: 2]        |

### 8.6. Recipe Ingredients (/recipes/{id}/ingredients)[cite: 2]

| Method | Endpoint                          | Mô tả                | Auth                 | Request                                          | Response                                      |
| ------ | --------------------------------- | -------------------- | -------------------- | ------------------------------------------------ | --------------------------------------------- |
| POST   | /recipes/{id}/ingredients         | Thêm nguyên liệu     | Bearer (Owner/Admin) | { name, quantity?, unit?, notes?, orderIndex? }  | 201: RecipeIngredientDto 400/403/404[cite: 2] |
| PUT    | /recipes/{id}/ingredients/{ingId} | Cập nhật nguyên liệu | Bearer (Owner/Admin) | { name?, quantity?, unit?, notes?, orderIndex? } | 200: RecipeIngredientDto 400/403/404[cite: 2] |
| DELETE | /recipes/{id}/ingredients/{ingId} | Xóa nguyên liệu      | Bearer (Owner/Admin) | —                                                | 204: No Content 403/404[cite: 2]              |

### 8.7. Health Check Endpoints[cite: 2]

| Method | Endpoint      | Mô tả                                                  | Auth  | Response                                                                                                          |
| ------ | ------------- | ------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------- |
| GET    | /health       | Tổng hợp health tất cả dependencies (DB, Redis, MinIO) | Không | 200: Healthy \| 503: Unhealthy `{ "status":"Healthy", "entries":{"database":{"status":"Healthy"},...} }`[cite: 2] |
| GET    | /health/live  | Liveness probe — chỉ kiểm tra process còn sống         | Không | 200: Healthy (luôn luôn, trừ khi process crashed)[cite: 2]                                                        |
| GET    | /health/ready | Readiness probe — kiểm tra DB và Redis sẵn sàng        | Không | 200: Healthy (DB + Redis up) 503: Unhealthy (không nhận traffic)[cite: 2]                                         |

## Phụ lục A – HTTP Status Codes[cite: 2]

Bảng dưới đây liệt kê tất cả HTTP Status Codes được sử dụng trong API Culinary Blog, cùng ngữ cảnh sử dụng cụ thể.[cite: 2]

| Code | Status                | Ngữ cảnh sử dụng                                                                                                                                |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 200  | OK                    | GET request thành công; PATCH trả về resource đã cập nhật; POST /auth/login thành công.[cite: 2]                                                |
| 201  | Created               | POST tạo resource mới thành công (Recipe, Category, Step, Ingredient, Image). Response body chứa resource vừa tạo.[cite: 2]                     |
| 204  | No Content            | DELETE thành công; POST /auth/logout thành công. Không có response body.[cite: 2]                                                               |
| 400  | Bad Request           | Validation lỗi (Zod), request body malformed, file MIME không hợp lệ, business rule vi phạm (ví dụ: publish recipe thiếu ingredients).[cite: 2] |
| 401  | Unauthorized          | Access Token thiếu hoặc invalid; Refresh Token hết hạn / bị revoke.[cite: 2]                                                                    |
| 403  | Forbidden             | Đã xác thực nhưng không có quyền: Author truy cập endpoint Admin; Author cố xóa recipe của người khác.[cite: 2]                                 |
| 404  | Not Found             | Resource không tồn tại hoặc đã soft-delete (IsDeleted=true).[cite: 2]                                                                           |
| 409  | Conflict              | Trùng lặp unique field (email đã đăng ký, category slug đã tồn tại); Xóa category đang có recipes.[cite: 2]                                     |
| 422  | Unprocessable Entity  | Dữ liệu hợp lệ về cú pháp nhưng không thể xử lý về ngữ nghĩa (ví dụ: Version conflict — Optimistic Concurrency).[cite: 2]                       |
| 429  | Too Many Requests     | Rate limit bị vượt. Response kèm header Retry-After (giây).[cite: 2]                                                                            |
| 500  | Internal Server Error | Lỗi không xử lý được (unhandled exception). Trả RFC 7807, log đầy đủ qua Pino. Không lộ stack trace.[cite: 2]                                   |
| 503  | Service Unavailable   | Health check failed (DB/Redis down); hoặc server overloaded.[cite: 2]                                                                           |

## Phụ lục B – Application Error Codes[cite: 2]

Hệ thống sử dụng Application Error Codes (mã lỗi tùy chỉnh) trong trường RFC 7807 "type" để frontend có thể xử lý lỗi theo programmatic way mà không phụ thuộc vào chuỗi message (có thể thay đổi theo locale).[cite: 2]

| Error Code                  | HTTP Status | Mô tả                                                                               | Module            |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------- | ----------------- |
| AUTH_EMAIL_EXISTS           | 409         | Email đã được đăng ký bởi tài khoản khác.                                           | Auth[cite: 2]     |
| AUTH_INVALID_CREDENTIALS    | 401         | Email hoặc mật khẩu không đúng.                                                     | Auth[cite: 2]     |
| AUTH_TOKEN_EXPIRED          | 401         | Access Token đã hết hạn (15 phút).                                                  | Auth[cite: 2]     |
| AUTH_TOKEN_INVALID          | 401         | Access Token sai định dạng hoặc chữ ký không hợp lệ.                                | Auth[cite: 2]     |
| AUTH_REFRESH_TOKEN_EXPIRED  | 401         | Refresh Token đã hết hạn (7 ngày).                                                  | Auth[cite: 2]     |
| AUTH_REFRESH_TOKEN_REVOKED  | 401         | Refresh Token đã bị thu hồi (reuse detection).                                      | Auth[cite: 2]     |
| AUTH_GOOGLE_TOKEN_INVALID   | 400         | Google ID Token không hợp lệ hoặc đã hết hạn.                                       | Auth[cite: 2]     |
| AUTH_ACCOUNT_DISABLED       | 403         | Tài khoản bị vô hiệu hóa (IsActive=false) bởi Admin.                                | Auth[cite: 2]     |
| RECIPE_NOT_FOUND            | 404         | Recipe với id/slug không tồn tại hoặc đã bị xóa.                                    | Recipe[cite: 2]   |
| RECIPE_SLUG_EXISTS          | 409         | Slug đã tồn tại — tự động thêm suffix (slug-1, slug-2...).                          | Recipe[cite: 2]   |
| RECIPE_PUBLISH_INCOMPLETE   | 400         | Recipe thiếu điều kiện publish: phải có ít nhất 1 ingredient và 1 step.             | Recipe[cite: 2]   |
| RECIPE_FORBIDDEN            | 403         | User không phải owner và không phải Admin.                                          | Recipe[cite: 2]   |
| RECIPE_CONCURRENCY_CONFLICT | 422         | Version không khớp — resource đã được cập nhật bởi request khác. Client cần reload. | Recipe[cite: 2]   |
| CATEGORY_NOT_FOUND          | 404         | Category không tồn tại.                                                             | Category[cite: 2] |
| CATEGORY_NAME_EXISTS        | 409         | Tên category đã tồn tại.                                                            | Category[cite: 2] |
| CATEGORY_DELETE_HAS_RECIPES | 409         | Không thể xóa category đang có recipes thuộc về.                                    | Category[cite: 2] |
| FILE_SIZE_EXCEEDED          | 400         | File upload vượt quá giới hạn 5MB.                                                  | File[cite: 2]     |
| FILE_MIME_INVALID           | 400         | Loại file không được phép. Chỉ chấp nhận JPEG, PNG, WebP, AVIF.                     | File[cite: 2]     |
| VALIDATION_ERROR            | 400         | Một hoặc nhiều field không hợp lệ. Xem "errors" object.                             | Common[cite: 2]   |
| RATE_LIMIT_EXCEEDED         | 429         | Quá giới hạn request. Xem Retry-After header.                                       | Common[cite: 2]   |

## Phụ lục C – Từ điển Thuật ngữ[cite: 2]

| Thuật ngữ                                | Viết tắt | Định nghĩa                                                                                                                                                                       |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access Token                             | AT       | JSON Web Token (JWT) dùng để xác thực API request. TTL = 15 phút. Ký bằng HS256.[cite: 2]                                                                                        |
| Application Error Code                   | AEC      | Mã lỗi tùy chỉnh dạng SCREAMING_SNAKE_CASE trong trường "type" của RFC 7807 Problem Details.[cite: 2]                                                                            |
| Archive                                  | —        | Trạng thái Recipe khi bị ẩn khỏi public listing nhưng không bị xóa. RecipeStatus.Archived.[cite: 2]                                                                              |
| Author                                   | —        | Role người dùng mặc định sau khi đăng ký. Có thể tạo/quản lý recipe của mình.[cite: 2]                                                                                           |
| Background Job                           | —        | Tác vụ xử lý bất đồng bộ chạy ngoài HTTP request cycle, quản lý bởi BullMQ.[cite: 2]                                                                                             |
| Clean Architecture                       | CA       | Kiến trúc phần mềm của Robert C. Martin tách biệt concerns theo layers (Domain, Application, Infrastructure, Presentation). Dependency chỉ đi vào trong (hướng Domain).[cite: 2] |
| Command Query Responsibility Segregation | CQRS     | Pattern tách biệt write model (Commands) và read model (Queries) để tối ưu từng luồng riêng.[cite: 2]                                                                            |
| Content Delivery Network                 | CDN      | Mạng phân phối nội dung tĩnh (ảnh, JS, CSS) từ server gần người dùng nhất.[cite: 2]                                                                                              |
| Command Bus                              | —        | Lớp trung gian (mediator pattern) dispatch Commands/Queries qua Handlers với pipeline middleware (logging, validation, caching, cache invalidation).[cite: 2]                    |
| Core Web Vitals                          | CWV      | Chỉ số đo lường UX của Google: LCP (tải trang), CLS (ổn định layout), INP (phản hồi tương tác).[cite: 2]                                                                         |
| CQRS                                     | —        | Xem Command Query Responsibility Segregation.[cite: 2]                                                                                                                           |
| Docker Compose                           | —        | Công cụ định nghĩa và chạy multi-container Docker application qua file YAML.[cite: 2]                                                                                            |
| Draft                                    | —        | Trạng thái mặc định của Recipe khi mới tạo. Chỉ Author/Admin thấy.[cite: 2]                                                                                                      |
| Full-Text Search                         | FTS      | Tìm kiếm ngôn ngữ tự nhiên trong PostgreSQL qua tsvector/tsquery + unaccent extension.[cite: 2]                                                                                  |
| HTTP Status Code                         | —        | Mã phản hồi HTTP chuẩn (RFC 7231) cho biết kết quả xử lý request (2xx: thành công, 4xx: client error, 5xx: server error).[cite: 2]                                               |
| Incremental Static Regeneration          | ISR      | Tính năng Next.js tái sinh (regenerate) trang tĩnh theo chu kỳ (revalidate interval) thay vì build lại toàn bộ.[cite: 2]                                                         |
| JSON Web Token                           | JWT      | Chuẩn mở (RFC 7519) định nghĩa cách truyền thông tin an toàn giữa các bên dưới dạng JSON object được ký.[cite: 2]                                                                |
| MinIO                                    | —        | Object storage server mã nguồn mở tương thích Amazon S3 API. Dùng để lưu trữ ảnh.[cite: 2]                                                                                       |
| Non-Functional Requirement               | NFR      | Yêu cầu chất lượng hệ thống: hiệu năng, bảo mật, độ tin cậy, khả năng bảo trì...[cite: 2]                                                                                        |
| Nginx                                    | —        | Web server hiệu năng cao, dùng làm reverse proxy, load balancer và SSL termination.[cite: 2]                                                                                     |
| OpenTelemetry                            | OTEL     | Framework quan sát hệ thống phân tán: distributed tracing, metrics, logs.[cite: 2]                                                                                               |
| Optimistic Concurrency                   | —        | Kỹ thuật xử lý concurrent writes bằng Version field — không lock DB, phát hiện conflict khi save.[cite: 2]                                                                       |
| Published                                | —        | Trạng thái Recipe khi được công bố công khai. RecipeStatus.Published.[cite: 2]                                                                                                   |
| Rate Limiting                            | —        | Giới hạn số lượng request từ một IP trong khoảng thời gian nhất định để ngăn brute force/DDoS.[cite: 2]                                                                          |
| Refresh Token                            | RT       | Token dài hạn (7 ngày) dùng để lấy Access Token mới mà không cần đăng nhập lại.[cite: 2]                                                                                         |
| Refresh Token Rotation                   | —        | Mỗi lần dùng Refresh Token để refresh → token cũ bị revoke, cấp token mới (bảo mật cao hơn).[cite: 2]                                                                            |
| Reuse Detection                          | —        | Cơ chế phát hiện khi Refresh Token đã bị revoke được dùng lại → revoke toàn bộ token family của user.[cite: 2]                                                                   |
| Slug                                     | —        | Chuỗi URL-friendly, dạng chữ-thường-gạch-nối, duy nhất, dùng để định danh Recipe/Category trên URL.[cite: 2]                                                                     |
| Soft Delete                              | —        | Đánh dấu IsDeleted=true thay vì xóa vật lý khỏi database. Dữ liệu có thể khôi phục.[cite: 2]                                                                                     |
| Software Requirements Specification      | SRS      | Tài liệu đặc tả yêu cầu phần mềm theo IEEE 830 / ISO/IEC/IEEE 29148.[cite: 2]                                                                                                    |
| TanStack Query                           | —        | Thư viện React quản lý server state: caching, background refetch, optimistic updates.[cite: 2]                                                                                   |
| Transaction (Prisma)                     | —        | Cơ chế của Prisma ($transaction) đảm bảo nhiều operations được thực hiện trong một transaction duy nhất — tương ứng Unit of Work pattern.[cite: 2]                               |
| tsvector / tsquery                       | —        | Kiểu dữ liệu PostgreSQL cho full-text search. tsvector là chỉ mục đã xử lý, tsquery là biểu thức tìm kiếm.[cite: 2]                                                              |
