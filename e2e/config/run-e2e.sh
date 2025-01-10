#!/bin/bash

# Build the app
cross-env NODE_ENV=test NEXT_PUBLIC_APP_URL=http://localhost:3456 PORT=3456 CI=true npm run build

# Start the server and run tests
cross-env NODE_ENV=test NEXT_PUBLIC_APP_URL=http://localhost:3456 PORT=3456 CI=true start-server-and-test \
  "next start -p 3456 > test-server.log 2>&1" \
  http://localhost:3456 \
  "playwright test --config=e2e/config/playwright.config.ts $*" 