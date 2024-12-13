# Architecture

## Tech Stack
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- BAWES SDK for API integration

## Directory Structure
```
src/
  app/              # Next.js 13+ app directory
    (auth)/         # Auth group layout
      login/
      register/
      verify-email/
  components/
    auth/
      forms/        # Auth form components
      shared/       # Shared auth components
    ui/             # shadcn/ui components
  lib/
    validations/    # Zod schemas
  services/         # API services
```

## Authentication Flow
1. User registers -> Redirected to verify email
2. User verifies email -> Redirected to login with success message
3. User logs in -> Redirected to dashboard
4. Token refresh handled automatically
5. Logout (pending SDK implementation) 