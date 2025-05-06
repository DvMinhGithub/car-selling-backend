# 🚗 Car Selling Platform - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-brightgreen)

## 🛠 Technologies Used

| Category     | Technologies      |
| ------------ | ----------------- |
| **Core**     | Node.js, Express  |
| **Database** | MongoDB, Mongoose |
| **Auth**     | JWT, Bcrypt       |
| **Security** | Helmet, CORS      |
| **File**     | Multer            |
| **Logging**  | Morgan            |

## 💻 Installation

```bash
# Clone repository
git clone https://github.com/DvMinhGithub/car-selling-backend.git
cd car-selling-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run start
```

## Configuration

```bash
# .env.example
PORT = 3000
DB_URL = "mongodb://127.0.0.1/car_dealership"
ACCESS_TOKEN =  your_access_token
REFRESH_TOKEN =  your_refresh_token
```

## 📂 Project Structure

```bash
src/
├── configs/
├── controllers/
├── middlewares/
├── models/
├── routes/
└── utils/
```
