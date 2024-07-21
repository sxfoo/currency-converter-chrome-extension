const BASE_URL = 'https://open.er-api.com/v6';
const RATES_KEY = 'exchangeRates';
const RATES_TIMESTAMP_KEY = 'exchangeRatesTimestamp';
const REFRESH_INTERVAL = 60 * 60 * 1000;

export const fetchRates = async () => {
  const response = await fetch(`${BASE_URL}/latest/USD`);
  const data = await response.json();

  return data.rates
};

export const saveRates = (rates) => {
  return new Promise((resolve) => {
    const ratesStr = JSON.stringify(rates)
    const timestamp = Date.now().toString()

    localStorage.setItem(RATES_KEY, ratesStr);
    localStorage.setItem(RATES_TIMESTAMP_KEY, timestamp);
    resolve(timestamp);
  })
};

export const loadRates = () => {
  return new Promise((resolve) => {
    const rates = JSON.parse(localStorage.getItem(RATES_KEY));
    const timestamp = localStorage.getItem(RATES_TIMESTAMP_KEY);
    
    if (rates && timestamp) {
      if (Date.now() - parseInt(timestamp) < REFRESH_INTERVAL) {
        resolve({rates, timestamp});
      } else {
        resolve(null);
      }
    } else {
      resolve(null);
    }
  })
};

export const getExchangeRate = (rates, fromCurrency, toCurrency) => {
  if (fromCurrency === 'USD') return rates[toCurrency];
  if (toCurrency === 'USD') return 1 / rates[fromCurrency];

  return rates[toCurrency] / rates[fromCurrency];
};