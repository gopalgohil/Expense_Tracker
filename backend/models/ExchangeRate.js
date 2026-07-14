import mongoose from 'mongoose';

/**
 * Caches one document per (baseCurrency, date) pair.
 * `rates` stores all target currency rates from the base.
 * e.g. { baseCurrency:'USD', date:'2024-07-14', rates: { INR: 83.5, EUR: 0.92 } }
 */
const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: { type: String, required: true, uppercase: true, trim: true },
  date:         { type: String, required: true }, // YYYY-MM-DD
  rates:        { type: Map, of: Number },        // { INR: 83.5, EUR: 0.92 … }
}, { timestamps: false });

exchangeRateSchema.index({ baseCurrency: 1, date: 1 }, { unique: true });

export default mongoose.model('ExchangeRate', exchangeRateSchema);
