import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ExchangeRate from './models/ExchangeRate.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const rates = await ExchangeRate.find({});
    console.log('Cached Rates:');
    console.log(JSON.stringify(rates, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
