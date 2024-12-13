# BAWES ERP Frontend

A modern, type-safe frontend for the BAWES ERP system built with Next.js 13+.

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- BAWES SDK
- Zod for validation

## Documentation

- [Requirements](docs/requirements.md) - Missing features and implementation needs
- [Status](docs/status.md) - Implementation status and progress
- [Architecture](docs/architecture.md) - System design and structure
- [API](docs/api.md) - API documentation and usage
- [Components](docs/components.md) - UI components documentation

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

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

## Contributing

1. Follow the [cursor rules](.cursorrules) for development guidelines
2. Check existing implementations before adding new code
3. Ensure proper documentation is maintained
4. Validate changes with linting before submitting
