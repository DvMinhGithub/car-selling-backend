# Car Selling Backend

Backend API for car selling application, built with Node.js and Express.

## Technologies Used

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (File upload handling)
- Bcrypt (Password hashing)
- Helmet (Security)
- CORS
- Morgan (Logging)

## Project Structure

```
src/
├── configs/     # Database and other configurations
├── controllers/ # Business logic handlers
├── middlewares/ # Middleware functions
├── models/      # Mongoose models
├── routes/      # API routes
└── utils/       # Utility functions
```

## Installation

1. Clone repository:

```bash
git clone https://github.com/DvMinhGithub/car-selling-backend.git
cd car-selling-backend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create .env file and configure environment variables:

```env
NODE_ENV=development
PORT=3001
APP_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
STATIC_DIR=public
MORGAN_FORMAT=dev
APP_TIMEZONE=Asia/Bangkok

MONGODB_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

COOKIE_EXPIRES_DAYS=7
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict
COOKIE_PATH=/

BCRYPT_SALT_ROUNDS=10

UPLOAD_PUBLIC_PATH=/images
UPLOAD_DIR=public/images
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
UPLOAD_MAX_SIZE=5242880
UPLOAD_MAX_FILES=5

PAGINATION_LIMIT=10
PAGINATION_MAX_LIMIT=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY_MS=1000
```

4. Run server:

```bash
npm start
# or
yarn start
```

## Scripts

- `npm start`: Run server in production mode
- `npm run dev`: Run server with nodemon
- `npm run lint`: Check for ESLint errors
- `npm run lint:fix`: Automatically fix ESLint errors
- `npm run format:check`: Check code formatting
- `npm run format`: Automatically format code
- `npm run test:api`: Run smoke API tests with Newman

## Auto API Test (Simple)

1. Start backend:

```bash
npm run dev
```

2. In another terminal, run API tests:

```bash
npm run test:api
```

Notes:
- Test file is `tests/api.collection.json`.
- Update collection variable `baseUrl` if your server is not `http://localhost:3001`.

## Seed Vietnamese Demo Data

- Seed data with many Vietnamese samples for FE/test:

```bash
npm run seed
```

- Reset all data then seed lại từ đầu:

```bash
npm run seed:reset
```

Seed sẽ tạo dữ liệu mẫu cho:
- Admin
- Customer (kèm sổ địa chỉ)
- Car
- Cart
- Bill
- Customer/Car reviews

Tài khoản mẫu sau khi seed:
- `admin01@carvn.demo / MatKhau@123`
- `khach01@carvn.demo / MatKhau@123`

## Features

- User authentication (JWT)
- Image upload and management
- RESTful API for car management
- Security with Helmet
- Logging with Morgan
- CORS enabled
- Centralized error handling

## Security

- Helmet for HTTP headers protection
- Password hashing with bcrypt
- JWT for authentication
- Secure CORS configuration

## Development

Project uses:

- ESLint for linting
- Prettier for code formatting
- Husky for git hooks
- Lint-staged for pre-commit code checking

## Frontend Build Reference

- See `FE_BUILD_GUIDE.md` for complete FE page mapping, user flows, and API integration guide.
