# BAWES ERP Frontend

## Overview

A modern, secure, and feature-rich frontend for the BAWES ERP system, built with Next.js, TypeScript, and Shadcn UI.

## Documentation Structure

### 1. Architecture (`/docs/architecture.md`)
- Authentication & Authorization flow
- Component structure
- SDK integration
- Best practices

### 2. Implementation Status (`/docs/status.md`)
- Core features status
- SDK integration status
- UI components status
- Testing status
- Documentation status

### 3. Requirements (`/docs/requirements.md`)
- Missing SDK features
- Frontend requirements
- Integration requirements
- Security requirements
- Performance requirements

### 4. API Documentation (`/docs/api.md`)
- SDK overview
- Available APIs
- Configuration
- Error handling
- Best practices

### 5. Components (`/docs/components.md`)
- Dashboard components
- Shared components
- Hooks and utilities
- Best practices

## Features

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes
- Debug panel for JWT/permissions

### Dashboard
- Responsive layout
- Collapsible sidebar
- User profile management
- Permission-based navigation

### People Management
- User listing
- Role assignment
- Status management
- Bulk operations (planned)

### Roles & Permissions
- Role management
- Permission matrix
- Visual permission indicators
- Role hierarchy (planned)

## Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Build**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── dashboard/         # Dashboard pages
│   ├── auth/             # Authentication pages
│   └── api/              # API routes
├── components/
│   ├── dashboard/        # Dashboard components
│   ├── ui/              # Shadcn UI components
│   └── shared/          # Shared components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── services/            # API services
```

## SDK Integration

The frontend integrates with the BAWES ERP API using the auto-generated SDK:

```typescript
import { AuthenticationApi, PeopleApi, Configuration } from '@bawes/erp-api-sdk';

// Create API instance
const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL,
});
const api = new AuthenticationApi(config);

// Use API methods
const response = await api.authControllerLogin({
  email,
  password,
});
```

## Development Guidelines

1. **Code Style**
   - Use TypeScript for all files
   - Follow ESLint rules
   - Use Prettier for formatting

2. **Components**
   - Use Shadcn UI components
   - Follow atomic design principles
   - Implement proper prop types

3. **State Management**
   - Use React hooks for local state
   - Implement proper loading states
   - Handle errors gracefully

4. **Testing**
   - Write unit tests for hooks
   - Write integration tests for flows
   - Test error scenarios

## Security

1. **Authentication**
   - JWT tokens in localStorage
   - Automatic token refresh
   - Protected routes middleware

2. **Authorization**
   - Role-based access control
   - Permission-based UI
   - Secure API calls

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## Documentation

For detailed documentation, see the `/docs` directory:
- [Architecture](docs/architecture.md)
- [Implementation Status](docs/status.md)
- [Requirements](docs/requirements.md)
- [API Documentation](docs/api.md)
- [Components](docs/components.md)
