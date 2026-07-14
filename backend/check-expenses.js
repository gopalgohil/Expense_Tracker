import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Expense from './models/Expense.js';
import User from './models/User.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const expenses = await Expense.find({}).sort({ createdAt: -1 }).limit(10);
    const users = await User.find({});
    
    console.log('--- RECENT EXPENSES ---');
    expenses.forEach(e => {
      console.log(`User ID: ${e.userId}, Category: ${e.category}, Date: ${e.date.toISOString().split('T')[0]}, Original: ${e.currency} ${e.amount}, In Base Currency: ${e.amountInBaseCurrency}`);
    });

    console.log('\n--- REGISTERED USERS ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Currency: ${u.currency}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
