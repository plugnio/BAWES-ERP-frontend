# API Documentation

## Authentication API

### Login
- Method: `login(email: string, password: string)`
- Returns: `{ access_token: string, refresh_token: string }`
- Storage: HTTP-only cookies
- Security: 
  - Secure flag in production
  - Same-site policy
  - HTTP-only to prevent XSS

### Register
- Method: `register(email: string, password: string, nameEn: string, nameAr: string)`
- Returns: Success message
- Flow:
  - Creates user account
  - Sends verification email
  - Redirects to verification page

### Verify Email
- Method: `verifyEmail(email: string, code: string)`
- Returns: Success message
- Flow:
  - Validates verification code
  - Marks email as verified
  - Redirects to login with success message

### Token Refresh Process
- Method: `refresh(refreshToken: string)`
- Returns: `{ access_token: string, refresh_token: string }`
- Automatic refresh flow:
  1. Detects expired access token
  2. Uses refresh token from HTTP-only cookie
  3. Gets new token pair from API
  4. Updates both tokens in cookies
  5. Retries original request

### Logout (Current Implementation)
- Client-side:
  - Clears auth cookies
  - Redirects to login page
- Server-side (Pending):
  - Token revocation endpoint needed in SDK
  - Will invalidate refresh tokens

## Error Handling
All API calls are wrapped in try-catch blocks with:
- Error messages from API response
- Fallback error messages if API response is missing
- Proper error state management in forms
- Automatic error recovery where possible

## Security Measures
- CSRF protection via same-site cookies
- XSS prevention with HTTP-only cookies
- Automatic token refresh
- Protected route middleware
- Rate limiting on auth endpoints