# Required SDK Features

## Authentication API
- [ ] Add logout/signout method to BAWES SDK AuthenticationApi
  - Status: Endpoint not available (404)
  - Purpose: Allow users to sign out and revoke refresh tokens
  - Parameters: refresh_token (string)
  - Expected behavior: Invalidate the refresh token on the server
  - Current workaround: Client-side cookie removal only

## AI Assistant SDK Access Configuration
- [ ] Enable direct access to SDK source and distribution files:
  - node_modules/@bawes/erp-api-sdk/src/**/*
  - node_modules/@bawes/erp-api-sdk/dist/**/*
  - Purpose: Allow AI assistant to efficiently read and understand SDK implementation
  - Benefits: Faster development and more accurate assistance
  - Required for: Type checking, method signatures, and implementation details