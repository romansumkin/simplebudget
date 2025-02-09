import { StyleSheet, FlatList, Pressable, Alert, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { colorScheme } from '@/constants/Colors';

type Account = {
  id: string;
  name: string;
  currency: string;
  balance: number;
};

const INITIAL_VISIBLE_ACCOUNTS = 4;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    action?: 'add' | 'edit';
    id?: string;
    name?: string;
    currency?: string;
    balance?: string;
  }>();

  const [accounts, setAccounts] = useState<Account[]>([
    { id: '1', name: 'Наличные', currency: 'RUB', balance: 10000 },
    { id: '2', name: 'Банк', currency: 'RUB', balance: 50000 },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Вычисляем, какие счета показывать
  const visibleAccounts = isExpanded 
    ? accounts 
    : accounts.slice(0, INITIAL_VISIBLE_ACCOUNTS);

  const hasHiddenAccounts = accounts.length > INITIAL_VISIBLE_ACCOUNTS;

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

  const renderAccount = ({ item, index }: { item: Account; index: number }) => (
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
      <ThemedText type="title">
        {item.balance.toLocaleString()} {item.currency}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: Math.max(16, insets.left),
        paddingRight: Math.max(16, insets.right),
      }
    ]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Счета</ThemedText>
        <Pressable onPress={() => router.push('/account-form')}>
          <IconSymbol name="plus.circle.fill" size={32} color="#0a7ea4" />
        </Pressable>
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
});
