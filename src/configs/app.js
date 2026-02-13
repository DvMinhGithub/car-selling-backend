const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { APP } = require('#configs/constants');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: APP.CORS_ORIGIN.includes('*') ? true : APP.CORS_ORIGIN,
    credentials: APP.CORS_CREDENTIALS,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan(APP.MORGAN_FORMAT));

app.use('/', express.static(APP.STATIC_DIR));

module.exports = app;
