import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'CNY'];

export default function IncomeFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ 
    id?: string;
    name?: string;
    currency?: string;
    amount?: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [currency, setCurrency] = useState(params.currency ?? 'RUB');
  const [amount, setAmount] = useState(params.amount ?? '0');
  const [showCurrencies, setShowCurrencies] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название источника дохода');
      return;
    }

    const numAmount = Number(amount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    router.replace({
      pathname: '/(tabs)',
      params: {
        action: params.id ? 'edit_income' : 'add_income',
        id: params.id ?? Date.now().toString(),
        name: name.trim(),
        currency,
        amount: numAmount,
      },
    });
  };

  const handleClose = () => {
    router.back();
  };

  const formatAmount = (text: string) => {
    const numbers = text.replace(/[^0-9.]/g, '');
    if (numbers) {
      const parts = numbers.split('.');
      if (parts.length > 2) return amount;
      
      const integerPart = parts[0] ? parseInt(parts[0], 10).toLocaleString() : '0';
      
      if (parts.length === 2) {
        return `${integerPart}.${parts[1]}`;
      }
      return integerPart;
    }
    return '';
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: params.id ? 'Редактировать доход' : 'Новый доход',
            headerLeft: () => (
              <Pressable 
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed
                ]}
              >
                <IconSymbol 
                  name="xmark" 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].text} 
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable 
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed
                ]}
              >
                <ThemedText type="link">Сохранить</ThemedText>
              </Pressable>
            ),
          }}
        />

        <ScrollView 
          style={styles.form}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formContent}
        >
          <ThemedView style={styles.inputContainer}>
            <ThemedText type="subtitle">Название</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              value={name}
              onChangeText={setName}
              placeholder="Например: Зарплата"
              placeholderTextColor="#999"
              autoFocus
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText type="subtitle">Валюта</ThemedText>
            <Pressable onPress={() => setShowCurrencies(!showCurrencies)}>
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                value={currency}
                onChangeText={setCurrency}
                placeholder="RUB"
                placeholderTextColor="#999"
                editable={false}
              />
            </Pressable>
            {showCurrencies && (
              <ThemedView style={styles.currencyList}>
                {CURRENCIES.map((curr) => (
                  <Pressable
                    key={curr}
                    style={styles.currencyItem}
                    onPress={() => {
                      setCurrency(curr);
                      setShowCurrencies(false);
                    }}
                  >
                    <ThemedText>{curr}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText type="subtitle">Сумма</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              value={amount}
              onChangeText={(text) => setAmount(formatAmount(text))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  currencyList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  currencyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  formContent: {
    paddingBottom: 24,
  },
  selectedCurrency: {
    backgroundColor: '#E5E5F5',
  },
}); 