# Currency Exchange Tracker

A Parallel and Distributed Systems course project built with **.NET 10**, **ASP.NET Core Web API**, and **React**.

This project implements a microservices-based currency platform with authentication, role-based access control, parallel processing, encryption, distributed tracing, and monitoring.

## Architecture

Services and ports:

- **ApiGateway** (`http://localhost:5000`) - YARP reverse proxy entry point
- **AuthService** (`http://localhost:5001`) - JWT login/register and RBAC
- **RateService** (`http://localhost:5002`) - live exchange rates + alert management
- **ConvertService** (`http://localhost:5003`) - conversion workflows + encrypted history
- **AuditService** (`http://localhost:5004`) - central audit logs and monitoring
- **Frontend** (`http://localhost:3000`) - React UI

## Core Features

### 1) Concurrency and Parallelism

- `RateService`: multi-currency fetch using `Task.WhenAll`
- `ConvertService`: parallel conversion calculations using `Task.WhenAll`
- async/await used across controllers and service calls

### 2) Security

- JWT authentication across protected APIs
- RBAC with roles: `User`, `PremiumUser`, `Admin`
- role-protected endpoints for admin and premium features
- blocked role-escalation at registration (register always creates `User`)
- AES encryption for conversion history values (`ConvertedAmount`, `Rate`)

### 3) Distributed Systems

- microservices decomposition (Gateway/Auth/Rate/Convert/Audit)
- internal service-to-service communication
- correlation ID middleware (`X-Correlation-ID`) for cross-service traceability

### 4) Logging and Monitoring

- Serilog request logging
- OpenTelemetry instrumentation (AspNetCore + HttpClient)
- Audit service endpoints for logs, errors, trace journey, monitoring summary
- `/health` endpoint on each service

### 5) Premium / Admin Workflows

- favorite currency pairs
- CSV export of history (`PremiumUser`, `Admin`)
- rate alerts with threshold direction (`Above` / `Below`)
- admin-configurable max alerts-per-user
- admin role management for users (`User`, `PremiumUser`, `Admin`)
- role editing directly from the admin panel

## Tech Stack

- Backend: .NET 10, ASP.NET Core Web API, EF Core, SQL Server
- Frontend: React, Axios, React Router
- Security: JWT Bearer + RBAC, BCrypt password hashing
- Observability: Serilog, OpenTelemetry
- Gateway: YARP

## Run Instructions

## Prerequisites

- .NET SDK 10
- Node.js + npm
- SQL Server / SQL Express

## Start backend services

From solution root, run each service in separate terminal:

- `dotnet run --project ApiGateway/ApiGateway.csproj`
- `dotnet run --project AuthService/AuthService.csproj`
- `dotnet run --project RateService/RateService.csproj`
- `dotnet run --project ConvertService/ConvertService.csproj`
- `dotnet run --project AuditService/AuditService.csproj`

## Start frontend

- `cd frontend`
- `npm install`
- `npm start`

## Build checks

- Backend: `dotnet build`
- Frontend: `cd frontend && npm run build`

## Main API Routes (via Gateway)

- Auth: `/api/auth/*`
- Rates: `/api/rates/*`
- Convert: `/api/convert/*`
- Audit: `/api/audit/*`

See `WORKFLOW_FEATURE_GUIDE.md` for full feature-by-feature endpoint walkthrough.

## Notes

- Databases are migrated automatically at service startup.
- Rate alerts are now persisted in SQL Server (EF Core migrations).
- Audit ingestion endpoint is protected with internal API key header.
