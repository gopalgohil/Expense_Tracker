import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'email name');
    console.log('Registered Users:');
    console.log(users);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
