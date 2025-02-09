import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Pressable } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';

const CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'CNY'];

export default function SettingsScreen() {
  const { displayCurrency, setDisplayCurrency } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Настройки</ThemedText>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Основная валюта</ThemedText>
        <ThemedView style={styles.currencyList}>
          {CURRENCIES.map((currency) => (
            <Pressable
              key={currency}
              style={[
                styles.currencyItem,
                currency === displayCurrency && styles.selectedCurrency
              ]}
              onPress={() => setDisplayCurrency(currency)}
            >
              <ThemedText>{currency}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  currencyList: {
    marginTop: 12,
  },
  currencyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedCurrency: {
    backgroundColor: '#E5E5F5',
  },
}); 