const BASE_URL = 'https://open.er-api.com/v6/latest';

export type ExchangeRates = {
  [key: string]: number;
};

export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${BASE_URL}/${baseCurrency}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
  
  // Сначала конвертируем в базовую валюту, затем в целевую
  const amountInBaseCurrency = amount / rates[fromCurrency];
  return amountInBaseCurrency * rates[toCurrency];
} 