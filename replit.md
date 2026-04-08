# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Application

**Al-Yamen Business Management System** — a full-featured business management system for small-to-medium businesses. Features:
- Multi-language support (English, Bengali, Arabic)
- Authentication (admin/manager/cashier roles)
- Dashboard with live stats and charts
- Sales module (orders, customers)
- Purchase module (orders, suppliers)
- Inventory/Products module with low-stock alerts
- HR module (employees, attendance, payroll)
- Accounting module (transactions, income/expense tracking)
- Reports module (sales, inventory, HR reports)

## Demo Accounts

| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@alyamen.com        | admin123     |
| Manager  | manager@alyamen.com      | manager123   |
| Cashier  | cashier@alyamen.com      | cashier123   |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
