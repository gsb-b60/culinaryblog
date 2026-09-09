# GIÁO TRÌNH PHÁT TRIỂN ỨNG DỤNG WEB NÂNG CAO
## Phiên bản V4
### .NET 10 + Next.js App Router

---

# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM
## Software Requirements Specification (SRS)
### Tiêu chuẩn IEEE 830/ISO/IEC/IEEE 29148:2018

**Dự án:** Blog Ẩm thực và Nấu ăn (*Culinary Blog*)[cite: 2]

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Phiên bản tài liệu** | 1.0.0[cite: 2] |
| **Ngày phát hành** | 04/06/2026[cite: 2] |
| **Trạng thái** | Đã duyệt (Approved)[cite: 2] |
| **Công nghệ Backend** | .NET 10 Minimal APIs, C#[cite: 2] |
| **Công nghệ Frontend** | Next.js App Router, TypeScript[cite: 2] |
| **Cơ sở dữ liệu** | PostgreSQL 16[cite: 2] |
| **Object Storage** | MinIO (S3-Compatible)[cite: 2] |
| **Cache** | Redis 7[cite: 2] |

*Tài liệu này được biên soạn theo tiêu chuẩn IEEE 830/ISO/IEC/IEEE 29148:2018.*[cite: 2]

---

## LỊCH SỬ THAY ĐỔI TÀI LIỆU[cite: 2]

| Phiên bản | Ngày | Tác giả / Vai trò | Nội dung thay đổi | Trạng thái |
| :---: | :---: | :--- | :--- | :---: |
| **1.0.0** | 04/06/2026 | Senior BA / Architect | Phát hành lần đầu – Bản hoàn chỉnh theo IEEE 830 / ISO 29148. | Approved |
| **0.9.0** | 20/05/2026 | Senior BA | Bổ sung Chương 7 (Data Model), Chương 8 (API Spec) và Phụ lục. | Under Review |
| **0.8.0** | 05/05/2026 | Senior BA | Hoàn thiện Chương 3 (FR), bổ sung FR-FILE, FR-JOB, FR-OBS. | Draft |
| **0.5.0** | 15/04/2026 | Senior BA | Phác thảo ban đầu: Chương 1-4 (skeleton). | Draft |

**Phê duyệt tài liệu:** Tài liệu phiên bản 1.0.0 đã được xem xét và phê duyệt bởi Trưởng nhóm Kiến trúc Hệ thống (Lead Systems Architect). Mọi thay đổi từ phiên bản 1.0.0 trở đi đều phải thông qua quy trình Change Request (CR) và được cập nhật vào bảng này.[cite: 2]

---

## MỤC LỤC[cite: 2]

* [LỊCH SỬ THAY ĐỔI TÀI LIỆU](#lich-su-thay-doi-tai-lieu)[cite: 2]
* [MỤC LỤC](#muc-luc)[cite: 2]
* [CHƯƠNG 1. GIỚI THIỆU](#chuong-1-gioi-thieu)[cite: 2]
  * [1.1. Mục đích Tài liệu](#11-muc-dich-tai-lieu)[cite: 2]
  * [1.2. Phạm vi Sản phẩm](#12-pham-vi-san-pham)[cite: 2]
    * [1.2.1. Tên và Định danh](#121-ten-va-dinh-danh)[cite: 2]
    * [1.2.2. Mô tả Sản phẩm](#122-mo-ta-san-pham)[cite: 2]
    * [1.2.3. Những gì KHÔNG thuộc phạm vi](#123-nhung-gi-khong-thuoc-pham-vi)[cite: 2]
  * [1.3. Định nghĩa, Từ viết tắt và Ký hiệu](#13-dinh-nghia-tu-viet-tat-va-ky-hieu)[cite: 2]
  * [1.4. Tài liệu Tham chiếu](#14-tai-lieu-tham-chieu)[cite: 2]
  * [1.5. Tổng quan Tài liệu](#15-tong-quan-tai-lieu)[cite: 2]
* [CHƯƠNG 2. MÔ TẢ TỔNG QUAN HỆ THỐNG](#chuong-2-mo-ta-tong-quan-he-thong)[cite: 2]
  * [2.1. Bối cảnh Sản phẩm](#21-boi-canh-san-pham)[cite: 2]
    * [2.1.1. Vị trí trong Hệ sinh thái](#211-vi-tri-trong-he-sinh-thai)[cite: 2]
    * [2.1.2. Quan hệ với Hệ thống Ngoài](#212-quan-he-voi-he-thong-nguai)[cite: 2]
  * [2.2. Chức năng Sản phẩm Tổng quát](#22-chuc-nang-san-pham-tong-quat)[cite: 2]
  * [2.3. Các Lớp Người dùng và Đặc điểm](#23-cac-lop-nguoi-dung-va-dac-diem)[cite: 2]
  * [2.4. Môi trường Vận hành](#24-moi-truong-van-hanh)[cite: 2]
    * [2.4.1. Môi trường Server (Production)](#241-moi-truong-server-production)[cite: 2]
    * [2.4.2. Môi trường Phát triển (Development)](#242-moi-truong-phat-trien-development)[cite: 2]
    * [2.4.3. Yêu cầu Trình duyệt Client](#243-yeu-cau-trinh-duyet-client)[cite: 2]
  * [2.5. Ràng buộc Thiết kế và Hiện thực](#25-rang-buoc-thiet-ke-va-hien-thuc)[cite: 2]
  * [2.6. Giả định và Phụ thuộc](#26-gia-dinh-va-phu-thuoc)[cite: 2]
    * [2.6.1. Giả định](#261-gia-dinh)[cite: 2]
    * [2.6.2. Phụ thuộc Bên ngoài](#262-phu-thuoc-ben-ngoai)[cite: 2]
* [CHƯƠNG 3. YÊU CẦU CHỨC NĂNG CHI TIẾT](#chuong-3-yeu-cau-chuc-nang-chi-tiet)[cite: 2]
  * [3.1. Module Xác thực và Quản lý Người dùng (FR-AUTH)](#31-module-xac-thuc-va-quan-ly-nguoi-dung-fr-auth)[cite: 2]
  * [3.2. Module Quản lý Danh mục (FR-CAT)](#32-module-quan-ly-danh-muc-fr-cat)[cite: 2]
  * [3.3. Module Quản lý Công thức Nấu ăn (FR-RCP)](#33-module-quan-ly-cong-thuc-nau-an-fr-rcp)[cite: 2]
  * [3.4. Module Tìm kiếm và Phân trang (FR-SRCH)](#34-module-tim-kiem-va-phan-trang-fr-srch)[cite: 2]
  * [3.5. Module Quản lý Tệp tin (FR-FILE)](#35-module-quan-ly-tep-tin-fr-file)[cite: 2]
  * [3.6. Module Background Jobs (FR-JOB)](#36-module-background-jobs-fr-job)[cite: 2]
  * [3.7. Module Quan sát Hệ thống (FR-OBS)](#37-module-quan-sat-he-thong-fr-obs)[cite: 2]
* [4. Yêu cầu Phi Chức năng (NFR)](#4-yeu-cau-phi-chuc-nang-nfr)[cite: 2]
  * [4.1. Hiệu năng (NFR-PERF)](#41-hieu-nang-nfr-perf)[cite: 2]
  * [4.2. Bảo mật (NFR-SEC)](#42-bao-mat-nfr-sec)[cite: 2]
  * [4.3. Khả năng Sử dụng (NFR-USE)](#43-kha-nang-su-dung-nfr-use)[cite: 2]
  * [4.4. Độ tin cậy (NFR-REL)](#44-do-tin-cay-nfr-rel)[cite: 2]
  * [4.5. Khả năng Bảo trì (NFR-MAINT)](#45-kha-nang-bao-tri-nfr-maint)[cite: 2]
  * [4.6. Khả năng Mở rộng (NFR-SCALE)](#46-kha-nang-mo-rong-nfr-scale)[cite: 2]
  * [4.7. Tối ưu SEO (NFR-SEO)](#47-toi-uu-seo-nfr-seo)[cite: 2]
* [5. Yêu cầu Giao diện Ngoài](#5-yeu-cau-giao-dien-ngoai)[cite: 2]
* [6. Kiến trúc Hệ thống](#6-kien-truc-he-thong)[cite: 2]
* [7. Mô hình Dữ liệu](#7-mo-hinh-du-lieu)[cite: 2]
* [8. Đặc tả REST API](#8-dac-ta-rest-api)[cite: 2]
* [Phụ lục A - HTTP Status Codes](#phu-luc-a---http-status-codes)[cite: 2]
* [Phụ lục B - Application Error Codes](#phu-luc-b---application-error-codes)[cite: 2]
* [Phụ lục C – Từ điển Thuật ngữ](#phu-luc-c--tu-dien-thuat-ngu)[cite: 2]

---

## CHƯƠNG 1. GIỚI THIỆU[cite: 2]

### 1.1. Mục đích Tài liệu[cite: 2]

Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này được biên soạn theo tiêu chuẩn IEEE 830-1998 và ISO/IEC/IEEE 29148:2018 nhằm mô tả đầy đủ, chính xác và nhất quán toàn bộ yêu cầu chức năng (Functional Requirements) và yêu cầu phi chức năng (Non-Functional Requirements) của dự án ứng dụng web Blog Ẩm thực và Nấu ăn (Culinary Blog).[cite: 2]

Tài liệu này phục vụ các đối tượng sau:[cite: 2]
* **Nhóm phát triển Backend (.NET 10/C#):** Căn cứ thiết kế API, domain model, và business rules.[cite: 2]
* **Nhóm phát triển Frontend (Next.js/TypeScript):** Căn cứ thiết kế giao diện, luồng người dùng và tích hợp API.[cite: 2]
* **Kỹ sư Kiểm thử (QA/QC):** Cơ sở xây dựng test cases, kiểm thử chấp nhận (acceptance testing).[cite: 2]
* **Kiến trúc sư Hệ thống:** Tham chiếu khi đưa ra quyết định kiến trúc (architecture decisions).[cite: 2]
* **Giảng viên và Sinh viên:** Tài liệu học thuật mẫu cho dự án thực hành xuyên suốt giáo trình.[cite: 2]
* **Stakeholder / Product Owner:** Phê duyệt phạm vi và ưu tiên tính năng.[cite: 2]

**Phạm vi hiệu lực:** Tài liệu này có hiệu lực từ phiên bản 1.0.0 và là tài liệu nền tảng (baseline) cho toàn bộ vòng đời phát triển dự án. Mọi thay đổi yêu cầu sau khi tài liệu được phê duyệt phải tuân theo quy trình quản lý thay đổi (Change Management Process).[cite: 2]

### 1.2. Phạm vi Sản phẩm[cite: 2]

#### 1.2.1. Tên và Định danh[cite: 2]

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Tên sản phẩm** | Culinary Blog – Blog Ẩm thực và Nấu ăn[cite: 2] |
| **Định danh dự án** | CULINARY-BLOG-V1[cite: 2] |
| **Loại hệ thống** | Ứng dụng Web Full-Stack (API-Driven Architecture)[cite: 2] |
| **Phiên bản sản phẩm** | 1.0.0[cite: 2] |
| **Môi trường đích** | Cloud/On-premise (Docker Compose + Nginx)[cite: 2] |

#### 1.2.2. Mô tả Sản phẩm[cite: 2]

Culinary Blog là một nền tảng web cho phép người dùng chia sẻ, khám phá và lưu trữ các công thức nấu ăn từ nhiều nền ẩm thực khác nhau. Ứng dụng cung cấp hệ sinh thái hoàn chỉnh bao gồm:[cite: 2]
* **Nền tảng chia sẻ công thức:** Tác giả (Author) đăng tải công thức với hình ảnh, danh sách nguyên liệu chi tiết, hướng dẫn từng bước thực hiện và thông tin dinh dưỡng.[cite: 2]
* **Tổ chức nội dung:** Phân loại công thức theo danh mục (Category), độ khó (Difficulty Level), thời gian chuẩn bị và nấu.[cite: 2]
* **Tìm kiếm thông minh:** Full-Text Search tiếng Việt sử dụng PostgreSQL `tsvector`/`tsquery` với `unaccent` extension.[cite: 2]
* **Bảo mật đa lớp:** Xác thực JWT stateless, phân quyền theo vai trò (RBAC) và theo tài nguyên (Resource-Based Authorization), đăng nhập Google OAuth 2.0.[cite: 2]
* **Tối ưu hiệu năng và SEO:** Redis distributed cache, Next.js ISR, Open Graph Protocol, JSON-LD Schema.org Recipe markup.[cite: 2]
* **Quan sát hệ thống:** Structured logging (Serilog), distributed tracing (OpenTelemetry), health check endpoints.[cite: 2]

#### 1.2.3. Những gì KHÔNG thuộc phạm vi[cite: 2]

Các tính năng sau đây nằm ngoài phạm vi phiên bản 1.0.0:[cite: 2]
* Hệ thống bình luận (Comment System) và đánh giá sao (Rating System).[cite: 2]
* Tính năng lưu/đánh dấu công thức yêu thích (Bookmark/Favorite).[cite: 2]
* Thông báo real-time (SignalR/WebSocket).[cite: 2]
* Ứng dụng di động native (iOS/Android).[cite: 2]
* Thanh toán / Tính năng thương mại điện tử.[cite: 2]
* Hệ thống nhắn tin trực tiếp giữa người dùng.[cite: 2]
* GraphQL API (định hướng sau khóa học).[cite: 2]

### 1.3. Định nghĩa, Từ viết tắt và Ký hiệu[cite: 2]

| Thuật ngữ / Viết tắt | Định nghĩa đầy đủ |
| :--- | :--- |
| **SRS** | Software Requirements Specification – Đặc tả Yêu cầu Phần mềm.[cite: 2] |
| **FR** | Functional Requirement – Yêu cầu chức năng.[cite: 2] |
| **NFR** | Non-Functional Requirement – Yêu cầu phi chức năng.[cite: 2] |
| **API** | Application Programming Interface – Giao diện lập trình ứng dụng.[cite: 2] |
| **REST** | Representational State Transfer – Kiểu kiến trúc API phổ biến nhất.[cite: 2] |
| **JWT** | JSON Web Token - Chuẩn token xác thực stateless (RFC 7519).[cite: 2] |
| **RBAC** | Role-Based Access Control - Kiểm soát truy cập dựa trên vai trò.[cite: 2] |
| **CQRS** | Command Query Responsibility Segregation – Pattern tách biệt lệnh và truy vấn.[cite: 2] |
| **DDD** | Domain-Driven Design – Phương pháp thiết kế phần mềm lấy domain làm trung tâm.[cite: 2] |
| **ORM** | Object-Relational Mapper - Công cụ ánh xạ object-database (EF Core).[cite: 2] |
| **FTS** | Full-Text Search - Tìm kiếm toàn văn bản.[cite: 2] |
| **ISR** | Incremental Static Regeneration – Kỹ thuật tái tạo trang tĩnh của Next.js.[cite: 2] |
| **LCP** | Largest Contentful Paint - Core Web Vital đo tốc độ tải nội dung lớn nhất.[cite: 2] |
| **CLS** | Cumulative Layout Shift - Core Web Vital đo độ ổn định bố cục trang.[cite: 2] |
| **INP** | Interaction to Next Paint - Core Web Vital đo thời gian phản hồi tương tác.[cite: 2] |
| **CI/CD** | Continuous Integration / Continuous Delivery – Tích hợp và triển khai liên tục.[cite: 2] |
| **DXA** | Device-independent pixel unit used in OOXML (1 inch = 1440 DXA).[cite: 2] |
| **TTL** | Time-To-Live - Thời gian sống của dữ liệu trong cache.[cite: 2] |
| **SSR** | Server-Side Rendering - Render HTML trên server.[cite: 2] |
| **SSG** | Static Site Generation - Tạo trang tĩnh lúc build time.[cite: 2] |
| **MOSCOW** | Must Have / Should Have / Could Have / Won't Have - Mô hình phân loại ưu tiên.[cite: 2] |
| **RFC** | Request For Comments – Tài liệu tiêu chuẩn kỹ thuật (e.g., RFC 7807).[cite: 2] |
| **ERD** | Entity Relationship Diagram - Sơ đồ quan hệ thực thể.[cite: 2] |
| **PBKDF2** | Password-Based Key Derivation Function 2 – Thuật toán hash mật khẩu an toàn.[cite: 2] |
| **CDN** | Content Delivery Network - Mạng phân phối nội dung.[cite: 2] |
| **MIME** | Multipurpose Internet Mail Extensions - Chuẩn định dạng tệp trên Internet.[cite: 2] |
| **JSON-LD** | JavaScript Object Notation for Linked Data – Định dạng dữ liệu có cấu trúc cho SEO.[cite: 2] |

### 1.4. Tài liệu Tham chiếu[cite: 2]

| STT | Tài liệu / Tiêu chuẩn | Nguồn / URL |
| :---: | :--- | :--- |
| 1 | IEEE Std 830-1998 Recommended Practice for Software Requirements Specifications | [https://ieeexplore.ieee.org/document/720574](https://ieeexplore.ieee.org/document/720574)[cite: 2] |
| 2 | ISO/IEC/IEEE 29148:2018 - Requirements Engineering | [https://www.iso.org/standard/72089.html](https://www.iso.org/standard/72089.html)[cite: 2] |
| 3 | OWASP Top 10:2021 Top 10 Web Application Security Risks | [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)[cite: 2] |
| 4 | RFC 7807 Problem Details for HTTP APIs | [https://datatracker.ietf.org/doc/html/rfc7807](https://datatracker.ietf.org/doc/html/rfc7807)[cite: 2] |
| 5 | RFC 7519 JSON Web Token (JWT) | [https://datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)[cite: 2] |
| 6 | RFC 6749 - The OAuth 2.0 Authorization Framework | [https://datatracker.ietf.org/doc/html/rfc6749](https://datatracker.ietf.org/doc/html/rfc6749)[cite: 2] |
| 7 | .NET 10 Minimal APIs - Microsoft Learn | [https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis)[cite: 2] |
| 8 | ASP.NET Core Identity - Microsoft Learn | [https://learn.microsoft.com/aspnet/core/security/authentication/identity](https://learn.microsoft.com/aspnet/core/security/authentication/identity)[cite: 2] |
| 9 | Entity Framework Core 10 Documentation | [https://learn.microsoft.com/ef/core/](https://learn.microsoft.com/ef/core/)[cite: 2] |
| 10 | Next.js 15 App Router Documentation | [https://nextjs.org/docs](https://nextjs.org/docs)[cite: 2] |
| 11 | PostgreSQL 16 Documentation - Full-Text Search | [https://www.postgresql.org/docs/16/textsearch.html](https://www.postgresql.org/docs/16/textsearch.html)[cite: 2] |
| 12 | Redis 7 Documentation | [https://redis.io/docs/](https://redis.io/docs/)[cite: 2] |
| 13 | MinIO S3-Compatible Object Storage | [https://min.io/docs/](https://min.io/docs/)[cite: 2] |
| 14 | Google Web Vitals Core Web Vitals | [https://web.dev/explore/learn-core-web-vitals](https://web.dev/explore/learn-core-web-vitals)[cite: 2] |
| 15 | Schema.org Recipe - Structured Data | [https://schema.org/Recipe](https://schema.org/Recipe)[cite: 2] |
| 16 | OpenTelemetry .NET Documentation | [https://opentelemetry.io/docs/languages/dotnet/](https://opentelemetry.io/docs/languages/dotnet/)[cite: 2] |
| 17 | Serilog Documentation | [https://serilog.net/](https://serilog.net/)[cite: 2] |
| 18 | Hangfire Documentation | [https://docs.hangfire.io/](https://docs.hangfire.io/)[cite: 2] |
| 19 | FluentValidation Documentation | [https://docs.fluentvalidation.net/](https://docs.fluentvalidation.net/)[cite: 2] |
| 20 | Giáo trình Phát triển Ứng dụng Web Nâng cao V4 Nội bộ | N/A (tài liệu nội bộ)[cite: 2] |

### 1.5. Tổng quan Tài liệu[cite: 2]

Tài liệu SRS này được tổ chức thành 8 chương chính và 3 phụ lục, theo cấu trúc từ tổng quan đến chi tiết:[cite: 2]
* **Chương 2 – Mô tả Tổng quan:** Bối cảnh sản phẩm, chức năng tóm tắt, các lớp người dùng, môi trường vận hành và ràng buộc thiết kế.[cite: 2]
* **Chương 3 – Yêu cầu Chức năng:** 27 FR được đặc tả chi tiết theo format chuẩn, nhóm thành 7 module chức năng.[cite: 2]
* **Chương 4 – Yêu cầu Phi chức năng:** Hiệu năng, bảo mật, khả năng sử dụng, độ tin cậy, khả năng bảo trì/mở rộng và SEO.[cite: 2]
* **Chương 5 – Giao diện Ngoài:** Tích hợp với các hệ thống và dịch vụ ngoài (Google OAuth, MinIO, Redis, SendGrid).[cite: 2]
* **Chương 6 – Kiến trúc Hệ thống:** Clean Architecture Backend, Next.js App Router Frontend, chiến lược caching và deployment.[cite: 2]
* **Chương 7 – Mô hình Dữ liệu:** ERD mô tả văn bản và bảng định nghĩa chi tiết từng entity/table.[cite: 2]
* **Chương 8 – Đặc tả API REST:** Quy ước, chuẩn lỗi RFC 7807, và bảng tổng hợp tất cả ~30 endpoint.[cite: 2]
* **Phụ lục A-C:** HTTP Status Codes, Application Error Codes, và Từ điển thuật ngữ.[cite: 2]

---

## CHƯƠNG 2. MÔ TẢ TỔNG QUAN HỆ THỐNG[cite: 2]

### 2.1. Bối cảnh Sản phẩm[cite: 2]

#### 2.1.1. Vị trí trong Hệ sinh thái[cite: 2]

Culinary Blog vận hành theo mô hình API-Driven Architecture, trong đó Backend (.NET 10) và Frontend (Next.js) là hai hệ thống độc lập giao tiếp hoàn toàn qua HTTP/JSON RESTful API.[cite: 2] Không có server-side rendering truyền thống (MVC Razor/Blazor) hay shared view engine giữa hai tầng.[cite: 2]

Sơ đồ bối cảnh hệ thống (Context Diagram):[cite: 2]

```text
CULINARY BLOG SYSTEM
┌────────────────────────────────┐       REST/JSON        ┌──────────────────────────────────────────────┐
│       NEXT.JS FRONTEND         │ ─────────────────────► │            .NET 10 BACKEND API               │
│          (App Router)          │                        │     (Minimal APIs + Clean Architecture)      │
│           Port: 3000           │                        │                 Port: 5000                   │
└────────────────────────────────┘                        └──────────────────────┬───────────────────────┘
                                                                                 │
                                    ┌────────────────────┬───────────────────────┼───────────────────────┬────────────────────┐
                                    ▼                    ▼                       ▼                       ▼                    ▼
                             ┌─────────────┐      ┌─────────────┐         ┌─────────────┐         ┌─────────────┐      ┌─────────────┐
                             │ PostgreSQL  │      │    Redis    │         │    MinIO    │         │  Hangfire   │      │ Google Auth │
                             │  Port: 5432 │      │  Port: 6379 │         │  Port: 9000 │         │    Jobs     │      │   OAuth2.0  │
                             └─────────────┘      └─────────────┘         └─────────────┘         └─────────────┘      └─────────────┘