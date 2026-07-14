import ExchangeRate from '../models/ExchangeRate.js';

const FRANKFURTER = 'https://api.frankfurter.app';

/**
 * Returns the exchange rate to convert `from` → `to`.
 * Fetches from Frankfurter API and caches per day in MongoDB.
 */
async function getRate(from, to) {
  if (from === to) return 1;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Try cache
  const cached = await ExchangeRate.findOne({ baseCurrency: from, date: today });
  if (cached) {
    const rate = cached.rates.get(to);
    if (rate) return rate;
  }

  // 2. Fetch from Frankfurter API
  try {
    const res  = await fetch(`${FRANKFURTER}/latest?from=${from}`);
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
    const data = await res.json();

    // Cache all rates for this base currency today (upsert)
    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: from, date: today },
      { rates: data.rates },
      { upsert: true, new: true }
    );

    return data.rates[to] ?? 1;
  } catch (err) {
    console.error('[currencyService] Failed to fetch rate:', err.message);
    return 1; // fallback: no conversion
  }
}

/**
 * Converts `amount` from `fromCurrency` to `toCurrency`.
 * Returns the original amount if currencies match or if API fails.
 */
export async function convertAmount(amount, fromCurrency, toCurrency) {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount;
  const rate = await getRate(fromCurrency.toUpperCase(), toCurrency.toUpperCase());
  return Math.round(amount * rate * 100) / 100; // 2 decimal precision
}
