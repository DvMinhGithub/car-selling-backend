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
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Run server:

```bash
npm start
# or
yarn start
```

## Scripts

- `npm start`: Run server with nodemon
- `npm run lint`: Check for ESLint errors
- `npm run lint:fix`: Automatically fix ESLint errors
- `npm run format:check`: Check code formatting
- `npm run format`: Automatically format code

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
