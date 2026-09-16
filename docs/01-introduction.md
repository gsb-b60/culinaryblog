# Chapter 1 — Introduction

Source: `srs.md` lines 71-117.

## 1.2. Product Scope

### 1.2.1. Product Name and Identification

| Attribute | Value |
|---|---|
| Product name | Culinary Blog |
| Project identifier | CULINARY-BLOG-V1 |
| System type | Full-Stack Web Application (API-Driven Architecture) |
| Product version | 1.0.0 |
| Target environment | Cloud / On-premise (Docker Compose + Nginx) |

### 1.2.2. Product Description

Culinary Blog is a web platform that lets users share, discover, and save cooking recipes from many different cuisines. The application provides a complete ecosystem including:

- **Recipe sharing platform:** Authors publish recipes with images, a detailed ingredient list, step-by-step instructions, and nutritional information.
- **Content organization:** Recipes are classified by category, difficulty level, and preparation/cook time.
- **Smart search:** Vietnamese full-text search using PostgreSQL `tsvector`/`tsquery` with the `unaccent` extension.
- **Multi-layer security:** Stateless JWT authentication, Role-Based Access Control (RBAC), and Resource-Based Authorization, Google OAuth 2.0 login.
- **Performance & SEO optimization:** Redis distributed cache, Next.js ISR, Open Graph Protocol, JSON-LD Schema.org Recipe markup.
- **System observability:** Structured logging (Pino), distributed tracing (OpenTelemetry), health check endpoints.

### 1.2.3. Out of Scope

The following features are outside the scope of version 1.0.0:

- Comment system and star rating system.
- Bookmark / Favorite recipe feature.
- Real-time notifications (SignalR/WebSocket).
- Native mobile applications (iOS/Android).
- Payments / E-commerce features.
- Direct messaging between users.
- GraphQL API (planned for after this course).

## 1.5. Document Overview

- **Chapter 2 — System Overview:** Product context, summarized functionality, user classes, operating environments, and design constraints.
- **Chapter 3 — Functional Requirements:** 27 FRs specified in detail using a standard template, grouped into 7 functional modules.
- **Chapter 4 — Non-Functional Requirements:** Performance, security, usability, reliability, maintainability, scalability, and SEO.
- **Chapter 5 — External Interfaces:** Integration with external systems and services (Google OAuth, MinIO, Redis, SendGrid).
- **Chapter 6 — System Architecture:** Clean Architecture backend, Next.js App Router frontend, caching strategy, and deployment.
- **Chapter 7 — Data Model:** Textual ERD and detailed table definitions for each entity/table.
- **Chapter 8 — REST API Specification:** Conventions, RFC 7807 error standard, and a consolidated table of ~30 endpoints.
- **Appendices A-C:** HTTP Status Codes, Application Error Codes, and Glossary.