# API Documentation

## Authentication API

### Login
- Method: `login(email: string, password: string)`
- Returns: `{ access_token: string, refresh_token: string }`

### Register
- Method: `register(email: string, password: string, nameEn: string, nameAr: string)`
- Returns: Success message

### Verify Email
- Method: `verifyEmail(email: string, code: string)`
- Returns: Success message

### Refresh Token
- Method: `refresh(refreshToken: string)`
- Returns: `{ access_token: string, refresh_token: string }`

### Logout (Not Implemented)
- Method: TBD
- Parameters: TBD
- Returns: TBD

## Error Handling
All API calls are wrapped in try-catch blocks with:
- Error messages from API response
- Fallback error messages if API response is missing
- Proper error state management in forms 