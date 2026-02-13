require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { APP } = require('#configs/constants');
const routes = require('#routes/index');
const connectDb = require('#configs/db');

const app = express();
connectDb().catch((error) => {
  console.error('Failed to initialize database connection', error);
  process.exit(1);
});
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOptions = {
  origin: APP.CORS_ORIGIN.includes('*') ? true : APP.CORS_ORIGIN,
  credentials: APP.CORS_CREDENTIALS,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(APP.STATIC_DIR));
app.use(routes);

app.use((err, req, res, next) => {
  void next;
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = APP.PORT;
app.listen(PORT, () => {
  const serverUrl = APP.BASE_URL || `port ${PORT}`;
  console.log(`Server running at ${serverUrl}`);
});
