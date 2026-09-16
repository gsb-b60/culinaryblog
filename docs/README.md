# Culinary Blog — Agent Documentation Index

This folder contains the complete **Software Requirements Specification (SRS)** for the **Culinary Blog** project, split into per-chapter sub-documents written in **English** for agent (LLM) consumption.

> **Source of truth:** `srs.md` (Vietnamese, IEEE 830 / ISO/IEC/IEEE 29148:2018, v4). These English docs are a lossless translation of that file — nothing is omitted. Do not edit `srs.md` based on these docs alone; when in doubt, cross-check the source.

## Project at a Glance

| Attribute | Value |
|---|---|
| Product | Culinary Blog – a platform to share, discover, and save cooking recipes |
| Project identifier | CULINARY-BLOG-V1 |
| Product version | 1.0.0 |
| Architecture | Full-Stack Web App (API-Driven Architecture) |
| Backend | Node.js 20 LTS, Express.js, TypeScript (Clean Architecture + CQRS) |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS, Auth.js v5 |
| Database | PostgreSQL 16 (Prisma ORM, `tsvector` full-text search + `unaccent`) |
| Object Storage | MinIO (S3-compatible, `@aws-sdk/client-s3`) |
| Cache / Queue | Redis 7 (ioredis, BullMQ background jobs) |
| Observability | Pino structured logging, OpenTelemetry tracing/metrics |
| Deployment | Docker Compose + Nginx reverse proxy |
| Release date | 04/06/2026 |

## Document Map

| # | Sub-document | Source chapter (srs.md lines) | Contents |
|---|---|---|---|
| — | [README.md](./README.md) | — | This index + navigation guide |
| 1 | [01-introduction.md](./01-introduction.md) | Ch 1 (L71-117) | Product identity, product description, out-of-scope, document overview |
| 2 | [02-system-overview.md](./02-system-overview.md) | Ch 2 (L119-265) | Product context, external systems, functional groups, user classes, operating environments, design constraints (CONS-001..010), assumptions & dependencies |
| 3 | [03-fr-auth.md](./03-fr-auth.md) | Ch 3 intro + 3.1 (L267-569) | Functional Requirements overview + Authentication/User Management module (FR-AUTH-001..007) |
| 4 | [03-fr-catalog.md](./03-fr-catalog.md) | Ch 3.2 (L570-771) | Category Management module (FR-CAT-001..005) |
| 5 | [03-fr-recipes.md](./03-fr-recipes.md) | Ch 3.3 (L772-1129) | Recipe Management module (FR-RCP-001..010) |
| 6 | [03-fr-misc.md](./03-fr-misc.md) | Ch 3.4-3.7 (L1130-1209) | Search & Pagination (FR-SRCH), File Management (FR-FILE), Background Jobs (FR-JOB), Observability (FR-OBS) |
| 7 | [04-non-functional.md](./04-non-functional.md) | Ch 4 (L1210-1470) | Non-Functional Requirements: NFR-PERF, NFR-SEC, NFR-USE, NFR-REL, NFR-MAINT, NFR-SCALE, NFR-SEO |
| 8 | [05-external-interfaces.md](./05-external-interfaces.md) | Ch 5 (L1471-1536) | External interfaces: UI screens/routes, REST API conventions, third-party services, hardware requirements |
| 9 | [06-system-architecture.md](./06-system-architecture.md) | Ch 6 (L1537-1623) | System architecture: clean architecture layers, CQRS command bus pipeline, ERD summary, Docker Compose |
| 10 | [07-data-model.md](./07-data-model.md) | Ch 7 (L1624-1751) | Data model: BaseEntity, Recipe (+RecipeNutrition), RecipeStep, RecipeIngredient, RecipeImage, Category, User, RefreshToken |
| 11 | [08-rest-api.md](./08-rest-api.md) | Ch 8 (L1752-1831) | REST API specification: conventions, auth, categories, recipes, images, steps, ingredients, health check endpoints |
| 12 | [appendices.md](./appendices.md) | Appendices A-C (L1832-1914) | Appendix A: HTTP Status Codes; Appendix B: Application Error Codes; Appendix C: Glossary |
| — | [tech-stack-architecture.md](./tech-stack-architecture.md) | (consolidated) | Technology stack by layer with versions + architecture summary: Clean Architecture, CQRS pipeline, caching/rendering strategy, Docker topology |

## Reading Guide for Agents

Start here for a high-level overview, then read the sub-documents in order 1 → 12 when a task requires full detail.

- **Quick onboarding** → `tech-stack-architecture.md` (first), then `01-introduction.md` and `02-system-overview.md`
- **Implementing an API** → `08-rest-api.md`, `05-external-interfaces.md`, `07-data-model.md`
- **Implementing a feature** → find the relevant `03-fr-*.md`, then cross-reference `04-non-functional.md` for quality constraints
- **Debugging/QA** → `appendices.md` (status codes + error codes) and `04-non-functional.md`

## Conventions Used in These Docs

- Section identifiers, requirement codes (FR-*, NFR-*, CONS-*), API endpoint paths, DTO names, and code snippets are kept **verbatim** from the source.
- All prose is translated to English; Vietnamese terms appear only where they are product content (e.g., example recipe titles).
- Referenced Prisma field names (`prisma.user.findUnique`, etc.) mirror the intended implementation as stated in the SRS.