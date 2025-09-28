# Porirua Club Backend API

## Setup

1. Copy `.env.example` to `.env` and fill in your environment variables.

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run the project:

```bash
npm start
```

5. Run tests:

```bash
npm test
```

## Environment Variables

- `DATABASE_URL`
- `REDIS_URL`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `POLIPAY_API_KEY`
- `POLIPAY_INIT_URL`
- `POLIPAY_WEBHOOK_SECRET`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_REDIRECT_URI`
- `XERO_TENANT_ID`

## Project Structure

- `/src` - source code
- `/src/modules` - feature modules
- `/src/middleware` - Express middlewares
- `/src/utils` - utility functions
- `/src/db` - database client
- `/jobs` - background jobs
- `/__tests__` - tests

