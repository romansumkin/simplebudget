import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchExchangeRates, type ExchangeRates } from '@/utils/currencyConverter';

type SettingsContextType = {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState('RUB');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function updateRates() {
      setIsLoading(true);
      try {
        const rates = await fetchExchangeRates(displayCurrency);
        setExchangeRates(rates);
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    updateRates();
  }, [displayCurrency]);

  return (
    <SettingsContext.Provider 
      value={{ 
        displayCurrency, 
        setDisplayCurrency, 
        exchangeRates, 
        isLoading 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 