import { StyleSheet, FlatList, Pressable, Alert, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { colorScheme } from '@/constants/Colors';
import { useSettings } from '@/contexts/SettingsContext';
import { convertAmount } from '@/utils/currencyConverter';

type Account = {
  id: string;
  name: string;
  currency: string;
  balance: number;
};

type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

const INITIAL_VISIBLE_ACCOUNTS = 4;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    action?: 'add' | 'edit' | 'add_income' | 'edit_income';
    id?: string;
    name?: string;
    currency?: string;
    balance?: string;
    amount?: string;
    timestamp?: string;
  }>();

  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: 'Наличные', currency: 'RUB', balance: 10000 },
    { id: '2', name: 'Банк', currency: 'RUB', balance: 50000 },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([
    { id: '1', name: 'Зарплата', amount: 150000, currency: 'RUB' },
  ]);

  const { displayCurrency, exchangeRates, isLoading } = useSettings();

  // Вычисляем, какие счета показывать
  const visibleAccounts = isExpanded 
    ? accounts 
    : accounts.slice(0, INITIAL_VISIBLE_ACCOUNTS);

  const hasHiddenAccounts = accounts.length > INITIAL_VISIBLE_ACCOUNTS;

  // Добавляем вычисление общей суммы доходов
  const totalIncome = incomeSources.reduce((total, income) => {
    if (exchangeRates) {
      const convertedAmount = convertAmount(
        income.amount,
        income.currency,
        displayCurrency,
        exchangeRates
      );
      return total + convertedAmount;
    }
    return total + (income.currency === displayCurrency ? income.amount : 0);
  }, 0);

  useEffect(() => {
    if (params.action && params.id && params.name) {
      if (params.action === 'add') {
        setAccounts(prev => [...prev, {
          id: params.id!,
          name: params.name!,
          currency: params.currency!,
          balance: Number(params.balance),
        }]);
      } else if (params.action === 'edit') {
        setAccounts(prev => prev.map(account => 
          account.id === params.id 
            ? {
                id: params.id!,
                name: params.name!,
                currency: params.currency!,
                balance: Number(params.balance),
              }
            : account
        ));
      }
      
      // Очищаем параметры URL после обработки
      router.setParams({});
    }
  }, [params.action, params.id, params.name]);

  useEffect(() => {
    if (params.action === 'add_income' && params.id && params.name && params.currency && params.amount) {
      const newIncome: IncomeSource = {
        id: params.id,
        name: params.name,
        currency: params.currency,
        amount: Number(params.amount),
      };
      
      setIncomeSources(prev => {
        // Проверяем, существует ли уже источник дохода с таким id
        const exists = prev.some(income => income.id === params.id);
        if (exists) {
          // Если существует - обновляем
          return prev.map(income => 
            income.id === params.id ? newIncome : income
          );
        }
        // Если нет - добавляем новый
        return [...prev, newIncome];
      });
    }
  }, [params.action, params.id, params.name, params.currency, params.amount, params.timestamp]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Удаление счета',
      'Вы уверены, что хотите удалить этот счет?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить',
          style: 'destructive',
          onPress: () => setAccounts(prev => prev.filter(account => account.id !== id))
        },
      ]
    );
  };

  const handleDeleteIncome = (id: string) => {
    Alert.alert(
      'Удаление источника дохода',
      'Вы уверены, что хотите удалить этот источник дохода?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить',
          style: 'destructive',
          onPress: () => setIncomeSources(prev => prev.filter(source => source.id !== id))
        },
      ]
    );
  };

  const calculateTotalBalance = (
    accounts: Account[],
    targetCurrency: string,
    rates: ExchangeRates | null
  ): number => {
    if (!rates) return 0;

    return accounts.reduce((total, account) => {
      if (account.currency === targetCurrency) {
        return total + account.balance;
      }

      const convertedAmount = convertAmount(
        account.balance,
        account.currency,
        targetCurrency,
        rates
      );
      return total + convertedAmount;
    }, 0);
  };

  const renderAccount = ({ item, index }: { item: Account; index: number }) => {
    const convertedBalance = exchangeRates && item.currency !== displayCurrency
      ? convertAmount(
          item.balance,
          item.currency,
          displayCurrency,
          exchangeRates
        )
      : null;

    return (
      <Pressable 
        onPress={() => router.push({
          pathname: '/account-form',
          params: item
        })}
        onLongPress={() => handleDelete(item.id)}
        style={({ pressed }) => [
          styles.accountCard,
          index > 0 && styles.accountCardBorder,
          pressed && styles.accountCardPressed
        ]}
      >
        <ThemedView style={styles.accountHeader}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText type="defaultSemiBold">{item.currency}</ThemedText>
        </ThemedView>
        <ThemedView>
          <ThemedText type="title">
            {item.balance.toLocaleString()} {item.currency}
          </ThemedText>
          {convertedBalance !== null && item.currency !== displayCurrency && (
            <ThemedText style={styles.convertedAmount}>
              ≈ {convertedBalance.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })} {displayCurrency}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>
    );
  };

  const renderIncomeSource = ({ item, index }: { item: IncomeSource; index: number }) => {
    const convertedAmount = exchangeRates && item.currency !== displayCurrency
      ? convertAmount(
          item.amount,
          item.currency,
          displayCurrency,
          exchangeRates
        )
      : null;

    return (
      <Pressable 
        onPress={() => router.push({
          pathname: '/income-form',
          params: item
        })}
        onLongPress={() => handleDeleteIncome(item.id)}
        style={({ pressed }) => [
          styles.accountCard,
          index > 0 && styles.accountCardBorder,
          pressed && styles.accountCardPressed
        ]}
      >
        <ThemedView style={styles.accountHeader}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText type="defaultSemiBold">{item.currency}</ThemedText>
        </ThemedView>
        <ThemedView>
          <ThemedText type="title">
            {item.amount.toLocaleString()} {item.currency}
          </ThemedText>
          {convertedAmount !== null && item.currency !== displayCurrency && (
            <ThemedText style={styles.convertedAmount}>
              ≈ {convertedAmount.toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })} {displayCurrency}
            </ThemedText>
          )}
        </ThemedView>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16, paddingHorizontal: 16 }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Счета</ThemedText>
        <Pressable onPress={() => router.push('/account-form')}>
          <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.totalContainer}>
        <ThemedText type="subtitle">Общий баланс</ThemedText>
        {isLoading ? (
          <ThemedText>Загрузка курсов валют...</ThemedText>
        ) : (
          <ThemedText type="title">
            {calculateTotalBalance(accounts, displayCurrency, exchangeRates).toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2
            })} {displayCurrency}
          </ThemedText>
        )}
      </ThemedView>
      
      <ThemedView style={styles.totalContainer}>
        <ThemedText type="subtitle">Общая сумма доходов</ThemedText>
        <ThemedText type="title">{totalIncome.toLocaleString()} {displayCurrency}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.accountsContainer}>
        {visibleAccounts.map((account, index) => (
          <View key={account.id}>
            {renderAccount({ item: account, index })}
          </View>
        ))}
        
        {hasHiddenAccounts && (
          <Pressable 
            onPress={() => setIsExpanded(!isExpanded)}
            style={({ pressed }) => [
              styles.expandButton,
              pressed && styles.expandButtonPressed
            ]}
          >
            <ThemedText type="defaultSemiBold">
              {isExpanded ? 'Свернуть' : `Показать еще ${accounts.length - INITIAL_VISIBLE_ACCOUNTS}`}
            </ThemedText>
            <IconSymbol 
              name={isExpanded ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={Colors[colorScheme ?? 'light'].text} 
            />
          </Pressable>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="title">Источники дохода</ThemedText>
          <Pressable onPress={() => router.push('/income-form')}>
            <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </Pressable>
        </ThemedView>

        {incomeSources.map((source, index) => (
          <View key={source.id}>
            {renderIncomeSource({ item: source, index })}
          </View>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  accountCard: {
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  accountCardBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  accountCardPressed: {
    backgroundColor: '#F5F5F5',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 8,
  },
  expandButtonPressed: {
    backgroundColor: '#F5F5F5',
  },
  totalContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  convertedAmount: {
    fontSize: 14,
    color: Colors[colorScheme ?? 'light'].secondaryText,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
