import { StyleSheet, FlatList, Pressable, Alert, View, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

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

type MonthlyPayment = {
  id: string;
  name: string;
  amount: number;
  currency: string;
};

type Expense = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
};

const INITIAL_VISIBLE_ACCOUNTS = 4;

// Добавляем константы для ключей хранилища
const STORAGE_KEYS = {
  INCOME_SOURCES: 'incomeSources',
  MONTHLY_PAYMENTS: 'monthlyPayments',
  EXPENSES: 'expenses',
  ACCOUNTS: 'accounts'
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    action?: 'add' | 'edit' | 'add_income' | 'edit_income' | 'add_payment' | 'edit_payment' | 'add_expense' | 'edit_expense';
    id?: string;
    name?: string;
    currency?: string;
    balance?: string;
    amount?: string;
    timestamp?: string;
    category?: string;
  }>();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);

  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const { displayCurrency, exchangeRates, isLoading } = useSettings();
  const colorScheme = useColorScheme();

  console.log('Current params:', params);
  console.log('Current incomeSources:', incomeSources);

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

  const totalBalance = accounts.reduce((total, account) => {
    if (exchangeRates) {
      const convertedAmount = convertAmount(
        account.balance,
        account.currency,
        displayCurrency,
        exchangeRates
      );
      return total + convertedAmount;
    }
    return total + account.balance;
  }, 0);

  // Добавляем вычисление общей суммы платежей
  const totalMonthlyPayments = monthlyPayments.reduce((total, payment) => {
    if (exchangeRates) {
      const convertedAmount = convertAmount(
        payment.amount,
        payment.currency,
        displayCurrency,
        exchangeRates
      );
      return total + convertedAmount;
    }
    return total + (payment.currency === displayCurrency ? payment.amount : 0);
  }, 0);

  // Добавляем вычисление общей суммы расходов
  const totalExpenses = expenses.reduce((total, expense) => {
    if (exchangeRates) {
      const convertedAmount = convertAmount(
        expense.amount,
        expense.currency,
        displayCurrency,
        exchangeRates
      );
      return total + convertedAmount;
    }
    return total + (expense.currency === displayCurrency ? expense.amount : 0);
  }, 0);

  // Загрузка источников дохода при монтировании компонента
  useEffect(() => {
    const loadIncomeSources = async () => {
      try {
        const savedSources = await AsyncStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
        if (savedSources) {
          console.log('Loading saved sources:', savedSources);
          setIncomeSources(JSON.parse(savedSources));
        }
      } catch (error) {
        console.error('Error loading income sources:', error);
      }
    };

    loadIncomeSources();
  }, []);

  // Добавляем загрузку платежей при монтировании
  useEffect(() => {
    const loadMonthlyPayments = async () => {
      try {
        const savedPayments = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_PAYMENTS);
        if (savedPayments) {
          console.log('Loading saved payments:', savedPayments);
          setMonthlyPayments(JSON.parse(savedPayments));
        }
      } catch (error) {
        console.error('Error loading monthly payments:', error);
      }
    };

    loadMonthlyPayments();
  }, []);

  // Загрузка расходов при монтировании
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const savedExpensesJson = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
        if (savedExpensesJson) {
          const savedExpenses = JSON.parse(savedExpensesJson);
          setExpenses(savedExpenses);
          console.log('Loaded expenses:', savedExpenses);
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    };

    loadExpenses();
  }, []); // Выполнится один раз при монтировании

  // Загрузка счетов при монтировании компонента
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const savedAccountsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
        if (savedAccountsJson) {
          const savedAccounts = JSON.parse(savedAccountsJson);
          setAccounts(savedAccounts);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  // Обработка параметров для счетов
  useEffect(() => {
    if (params.action === 'add' || params.action === 'edit') {
      const newAccount = {
        id: params.id!,
        name: params.name!,
        currency: params.currency!,
        balance: Number(params.balance),
      };

      const updateAccounts = async () => {
        try {
          const savedAccountsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
          const savedAccounts = savedAccountsJson ? JSON.parse(savedAccountsJson) : [];

          let updatedAccounts;
          if (params.action === 'edit') {
            updatedAccounts = savedAccounts.map(account => 
              account.id === newAccount.id ? newAccount : account
            );
          } else {
            const exists = savedAccounts.some(account => account.id === newAccount.id);
            if (exists) {
              return;
            }
            updatedAccounts = [...savedAccounts, newAccount];
          }

          await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
          setAccounts(updatedAccounts);
        } catch (error) {
          console.error('Error updating accounts:', error);
        }
      };

      updateAccounts();
      router.setParams({}); // Очищаем параметры после обработки
    }
  }, [params.action, params.id, params.name, params.currency, params.balance]);

  // Изменяем обработку параметров в useEffect
  useEffect(() => {
    if (params.action === 'add' || params.action === 'edit') {
      // Очищаем параметры после обработки
      router.setParams({});
    }
  }, [params.action, params.id, params.name, params.currency, params.balance]);

  // Исправляем обработчик параметров для расходов
  useEffect(() => {
    const handleExpenseAction = async () => {
      if (params.action === 'add_expense' || params.action === 'edit_expense') {
        const newExpense: Expense = {
          id: params.id!,
          name: params.name!,
          amount: Number(params.amount),
          currency: params.currency!,
          category: params.category!
        };

        try {
          // Получаем текущие расходы из AsyncStorage
          const savedExpensesJson = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
          let currentExpenses: Expense[] = savedExpensesJson ? JSON.parse(savedExpensesJson) : [];

          if (params.action === 'add_expense') {
            // Проверяем на дубликаты
            if (!currentExpenses.some(expense => expense.id === newExpense.id)) {
              currentExpenses = [...currentExpenses, newExpense];
            }
          } else {
            currentExpenses = currentExpenses.map(expense => 
              expense.id === newExpense.id ? newExpense : expense
            );
          }

          // Сохраняем обновленный список в AsyncStorage
          await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(currentExpenses));
          
          // Обновляем состояние
          setExpenses(currentExpenses);
          
          console.log('Updated expenses:', currentExpenses);
        } catch (error) {
          console.error('Error handling expense action:', error);
        }
      }
    };

    handleExpenseAction();
  }, [params.action, params.id, params.name, params.amount, params.currency, params.category]); // Добавляем все зависимости

  // Изменяем обработчик добавления источника дохода
  useEffect(() => {
    if (params.action && params.id && params.name) {
      if (params.action === 'add_income') {
        const newIncomeSource = {
          id: params.id!,
          name: params.name!,
          currency: params.currency!,
          amount: Number(params.amount),
        };
        
        // Обновляем состояние и AsyncStorage атомарно
        const updateIncomeSources = async () => {
          try {
            // Получаем текущие данные из AsyncStorage
            const savedSourcesJson = await AsyncStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
            const savedSources = savedSourcesJson ? JSON.parse(savedSourcesJson) : [];
            
            // Проверяем на дубликаты
            const exists = savedSources.some(source => source.id === newIncomeSource.id);
            if (exists) {
              return;
            }

            // Создаем обновленный массив
            const updatedSources = [...savedSources, newIncomeSource];
            
            // Сохраняем в AsyncStorage
            await AsyncStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updatedSources));
            
            // Обновляем состояние компонента
            setIncomeSources(updatedSources);
            
            console.log('Successfully saved and updated income sources:', updatedSources);
          } catch (error) {
            console.error('Error updating income sources:', error);
          }
        };

        updateIncomeSources();
      } else if (params.action === 'edit_income') {
        // Обновляем редактирование аналогичным образом
        const updateEditedSource = async () => {
          try {
            const savedSourcesJson = await AsyncStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
            const savedSources = savedSourcesJson ? JSON.parse(savedSourcesJson) : [];
            
            const updatedSources = savedSources.map(income => 
              income.id === params.id 
                ? {
                    id: params.id!,
                    name: params.name!,
                    currency: params.currency!,
                    amount: Number(params.amount),
                  }
                : income
            );
            
            await AsyncStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updatedSources));
            setIncomeSources(updatedSources);
          } catch (error) {
            console.error('Error updating edited source:', error);
          }
        };

        updateEditedSource();
      } else if (params.action === 'add') {
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
      } else if (params.action === 'add_payment') {
        const newPayment = {
          id: params.id!,
          name: params.name!,
          currency: params.currency!,
          amount: Number(params.amount),
        };
        
        const updateMonthlyPayments = async () => {
          try {
            const savedPaymentsJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_PAYMENTS);
            const savedPayments = savedPaymentsJson ? JSON.parse(savedPaymentsJson) : [];
            
            const exists = savedPayments.some(payment => payment.id === newPayment.id);
            if (exists) {
              return;
            }

            const updatedPayments = [...savedPayments, newPayment];
            
            await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_PAYMENTS, JSON.stringify(updatedPayments));
            setMonthlyPayments(updatedPayments);
            
            console.log('Successfully saved and updated monthly payments:', updatedPayments);
          } catch (error) {
            console.error('Error updating monthly payments:', error);
          }
        };

        updateMonthlyPayments();
      } else if (params.action === 'edit_payment') {
        const updateEditedPayment = async () => {
          try {
            const savedPaymentsJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_PAYMENTS);
            const savedPayments = savedPaymentsJson ? JSON.parse(savedPaymentsJson) : [];
            
            const updatedPayments = savedPayments.map(payment => 
              payment.id === params.id 
                ? {
                    id: params.id!,
                    name: params.name!,
                    currency: params.currency!,
                    amount: Number(params.amount),
                  }
                : payment
            );
            
            await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_PAYMENTS, JSON.stringify(updatedPayments));
            setMonthlyPayments(updatedPayments);
          } catch (error) {
            console.error('Error updating edited payment:', error);
          }
        };

        updateEditedPayment();
      }
    }
  }, [params.action, params.id, params.name, params.currency, params.amount, params.category]);

  const handleDeleteAccount = (id: string) => {
    Alert.alert(
      'Удаление счета',
      'Вы уверены, что хотите удалить этот счет?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAccounts = accounts.filter(account => account.id !== id);
              await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
              setAccounts(updatedAccounts);
            } catch (error) {
              console.error('Error deleting account:', error);
            }
          }
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
          onPress: async () => {
            try {
              // Получаем текущие источники дохода из AsyncStorage
              const savedSourcesJson = await AsyncStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
              const savedSources = savedSourcesJson ? JSON.parse(savedSourcesJson) : [];
              
              // Фильтруем источники, удаляя выбранный
              const updatedSources = savedSources.filter(source => source.id !== id);
              
              // Сохраняем обновленный список в AsyncStorage
              await AsyncStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updatedSources));
              
              // Обновляем состояние компонента
              setIncomeSources(updatedSources);
            } catch (error) {
              console.error('Error deleting income source:', error);
            }
          }
        },
      ]
    );
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert(
      'Удаление платежа',
      'Вы уверены, что хотите удалить этот платеж?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const savedPaymentsJson = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_PAYMENTS);
              const savedPayments = savedPaymentsJson ? JSON.parse(savedPaymentsJson) : [];
              
              const updatedPayments = savedPayments.filter(payment => payment.id !== id);
              
              await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_PAYMENTS, JSON.stringify(updatedPayments));
              setMonthlyPayments(updatedPayments);
            } catch (error) {
              console.error('Error deleting payment:', error);
            }
          }
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

  const renderAmount = (amount: number, currency: string) => {
    const convertedAmount = exchangeRates 
      ? convertAmount(amount, currency, displayCurrency, exchangeRates)
      : amount;

    return (
      <View>
        <ThemedText type="defaultSemiBold">
          {amount.toLocaleString()} {currency}
        </ThemedText>
        {currency !== displayCurrency && exchangeRates && (
          <ThemedText style={styles.convertedAmount}>
            ≈ {convertedAmount.toLocaleString()} {displayCurrency}
          </ThemedText>
        )}
      </View>
    );
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
        onLongPress={() => handleDeleteAccount(item.id)}
        style={({ pressed }) => [
          styles.accountCard,
          index > 0 && styles.accountCardBorder,
          pressed && styles.accountCardPressed
        ]}
      >
        <ThemedView style={styles.accountHeader}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          {renderAmount(item.balance, item.currency)}
        </ThemedView>
      </Pressable>
    );
  };

  const renderIncomeSource = ({ item, index }: { item: IncomeSource; index: number }) => {
    console.log('Rendering income source:', item);
    return (
      <Pressable 
        onPress={() => router.push({
          pathname: '/income-form',
          params: {
            id: item.id,
            name: item.name,
            currency: item.currency,
            amount: item.amount.toString(),
          }
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
          <View>
            <ThemedText>{item.amount.toLocaleString()} {item.currency}</ThemedText>
            {item.currency !== displayCurrency && exchangeRates && (
              <ThemedText style={styles.convertedAmount}>
                ≈ {convertAmount(item.amount, item.currency, displayCurrency, exchangeRates).toLocaleString()} {displayCurrency}
              </ThemedText>
            )}
          </View>
        </ThemedView>
      </Pressable>
    );
  };

  const renderPayment = ({ item, index }: { item: MonthlyPayment; index: number }) => {
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
          pathname: '/payment-form',
          params: item
        })}
        onLongPress={() => handleDeletePayment(item.id)}
        style={({ pressed }) => [
          styles.accountCard,
          index > 0 && styles.accountCardBorder,
          pressed && styles.accountCardPressed
        ]}
      >
        <ThemedView style={styles.accountHeader}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <View>
            <ThemedText>{item.amount.toLocaleString()} {item.currency}</ThemedText>
            {convertedAmount && (
              <ThemedText style={styles.convertedAmount}>
                ≈ {convertedAmount.toLocaleString()} {displayCurrency}
              </ThemedText>
            )}
          </View>
        </ThemedView>
      </Pressable>
    );
  };

  // Добавляем ref для ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Добавляем обработчик скролла
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };

  // Восстанавливаем позицию скролла после обновления данных
  useEffect(() => {
    if (scrollViewRef.current && scrollPosition > 0) {
      scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
    }
  }, [incomeSources, monthlyPayments, accounts]);

  // Добавляем useEffect для логирования расходов
  useEffect(() => {
    console.log('Current expenses:', expenses);
    console.log('Total expenses amount:', totalExpenses);
    console.log('Expenses by category:', groupExpensesByCategory());
  }, [expenses, totalExpenses]);

  // Вспомогательная функция для группировки расходов по категориям
  const groupExpensesByCategory = () => {
    return expenses.reduce((groups, expense) => {
      const category = expense.category || 'Другое';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);
  };

  // Добавляем функцию удаления расхода
  const handleDeleteExpense = async (id: string) => {
    Alert.alert(
      'Удаление расхода',
      'Вы уверены, что хотите удалить этот расход?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedExpenses = expenses.filter(expense => expense.id !== id);
              await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
              setExpenses(updatedExpenses);
            } catch (error) {
              console.error('Error deleting expense:', error);
            }
          },
        },
      ]
    );
  };

  // В начале компонента HomeScreen
  useEffect(() => {
    const debugStorage = async () => {
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('All storage keys:', allKeys);
      
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`Storage ${key}:`, value);
      }
    };

    debugStorage();
  }, [expenses]); // Логируем при каждом изменении expenses

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      >
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Счета</ThemedText>
              <ThemedText style={styles.totalBalance}>
                Всего: {totalBalance.toLocaleString()} {displayCurrency}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/account-form')}>
              <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </Pressable>
          </View>
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
              <ThemedText type="link">
                {isExpanded ? 'Скрыть' : `Показать ещё ${accounts.length - INITIAL_VISIBLE_ACCOUNTS}`}
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Источники дохода</ThemedText>
              <ThemedText style={styles.totalIncome}>
                Всего: {totalIncome.toLocaleString()} {displayCurrency}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/income-form')}>
              <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </Pressable>
          </View>
          {incomeSources.map((source, index) => (
            <View key={source.id}>
              {renderIncomeSource({ item: source, index })}
            </View>
          ))}
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Ежемесячные платежи</ThemedText>
              <ThemedText style={styles.totalPayments}>
                Всего: {totalMonthlyPayments.toLocaleString()} {displayCurrency}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/payment-form')}>
              <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </Pressable>
          </View>
          {monthlyPayments.map((payment, index) => (
            <View key={payment.id}>
              {renderPayment({ item: payment, index })}
            </View>
          ))}
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Расходы</ThemedText>
              <ThemedText style={styles.totalExpenses}>
                Всего: {totalExpenses.toLocaleString()} {displayCurrency}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/expense-form')}>
              <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </Pressable>
          </View>
          {expenses.map((expense, index) => (
            <View key={expense.id}>
              <Pressable
                onPress={() => router.push({
                  pathname: '/expense-form',
                  params: {
                    id: expense.id,
                    name: expense.name,
                    currency: expense.currency,
                    amount: expense.amount.toString(),
                    category: expense.category,
                  }
                })}
                style={({ pressed }) => [
                  styles.expenseItem,
                  index > 0 && styles.expenseItemBorder,
                  pressed && styles.expenseItemPressed
                ]}
              >
                <View>
                  <ThemedText>{expense.name}</ThemedText>
                  <ThemedText type="secondary">{expense.category}</ThemedText>
                </View>
                <View style={styles.expenseAmount}>
                  <ThemedText>
                    {expense.amount.toLocaleString()} {expense.currency}
                  </ThemedText>
                  {expense.currency !== displayCurrency && (
                    <ThemedText type="secondary">
                      {convertAmount(
                        expense.amount,
                        expense.currency,
                        displayCurrency,
                        exchangeRates
                      ).toLocaleString()} {displayCurrency}
                    </ThemedText>
                  )}
                </View>
              </Pressable>
            </View>
          ))}
        </ThemedView>
      </ScrollView>
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
  accountItem: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  accountItemPressed: {
    opacity: 0.7,
  },
  totalIncome: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  totalBalance: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  totalPayments: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  expenseItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  expenseItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  totalExpenses: {
    fontSize: 14,
    color: Colors[colorScheme ?? 'light'].secondaryText,
  },
});
