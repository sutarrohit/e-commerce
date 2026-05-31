# E-Commerce Monorepo

A full-stack e-commerce platform built with Turborepo, TypeScript, and modern web technologies.

## Architecture

![Architecture Diagram](images/architecture-server.png)

## Structure

```
├── apps/
│   ├── server/    # Backend API server
│   └── web/       # Frontend web application
├── packages/      # Shared packages
└── images/        # Architecture diagrams and assets
```

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command          | Description                |
| ---------------- | -------------------------- |
| `npm run dev`    | Start all apps in dev mode |
| `npm run build`  | Build all apps             |
| `npm run lint`   | Lint all projects          |
| `npm run format` | Format code with Prettier  |
