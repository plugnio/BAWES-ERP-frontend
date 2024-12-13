# UI Components

## Auth Components

### LoginForm
- Location: `src/components/auth/forms/login-form.tsx`
- Features:
  - Email/password validation
  - Error handling
  - Loading states
  - Success redirection

### RegisterForm
- Location: `src/components/auth/forms/register-form.tsx`
- Features:
  - Email/password/name validation
  - Bilingual name fields (En/Ar)
  - Error handling
  - Success redirection

### VerifyEmailForm
- Location: `src/components/auth/forms/verify-email-form.tsx`
- Features:
  - Code verification
  - Pre-filled email from URL
  - Error handling
  - Success redirection

### AuthCard
- Location: `src/components/auth/shared/auth-card.tsx`
- Features:
  - Consistent card layout
  - Title/description support
  - Optional footer
  - Responsive design

## shadcn/ui Components
- Alert
- AlertDialog
- Button
- Card
- Form
- Input
- Label

## Form Validation
All forms use Zod schemas from `src/lib/validations/auth.ts` 