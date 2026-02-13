const mongoose = require('mongoose');

const { DB } = require('#configs/constants');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required in environment variables');
  }

  for (let attempt = 1; attempt <= DB.RETRY_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log('DATABASE connect success !!!');
      return;
    } catch (error) {
      console.log(`DATABASE connect failed (attempt ${attempt}/${DB.RETRY_ATTEMPTS})`, error);
      if (attempt === DB.RETRY_ATTEMPTS) {
        throw error;
      }
      await sleep(DB.RETRY_DELAY);
    }
  }
};

module.exports = connectDatabase;
