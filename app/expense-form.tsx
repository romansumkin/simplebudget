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
const CATEGORIES = ['Продукты', 'Транспорт', 'Развлечения', 'Здоровье', 'Покупки', 'Другое'];

export default function ExpenseFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ 
    id?: string;
    name?: string;
    currency?: string;
    amount?: string;
    category?: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [currency, setCurrency] = useState(params.currency ?? 'RUB');
  const [amount, setAmount] = useState(params.amount ?? '0');
  const [category, setCategory] = useState(params.category ?? 'Другое');
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название расхода');
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
        action: params.id ? 'edit_expense' : 'add_expense',
        id: params.id ?? Date.now().toString(),
        name: name.trim(),
        currency,
        amount: numAmount,
        category,
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
            title: params.id ? 'Редактировать расход' : 'Новый расход',
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
              placeholder="Например: Продукты"
              placeholderTextColor="#999"
              autoFocus
            />
          </ThemedView>

          <ThemedView style={[styles.inputContainer, styles.categoryContainer]}>
            <ThemedText type="subtitle">Категория</ThemedText>
            <Pressable 
              onPress={() => setShowCategories(!showCategories)}
              style={styles.categoryButton}
            >
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                value={category}
                placeholder="Выберите категорию"
                placeholderTextColor="#999"
                editable={false}
                pointerEvents="none"
              />
            </Pressable>
            {showCategories && (
              <ThemedView style={[
                styles.dropdownList,
                { backgroundColor: Colors[colorScheme ?? 'light'].background }
              ]}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      category === cat && styles.selectedItem
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <ThemedText>{cat}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={[styles.inputContainer, styles.currencyContainer]}>
            <ThemedText type="subtitle">Валюта</ThemedText>
            <Pressable 
              onPress={() => setShowCurrencies(!showCurrencies)}
              style={styles.currencyButton}
            >
              <TextInput
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                value={currency}
                placeholder="RUB"
                placeholderTextColor="#999"
                editable={false}
                pointerEvents="none"
              />
            </Pressable>
            {showCurrencies && (
              <ThemedView style={[
                styles.dropdownList,
                { backgroundColor: Colors[colorScheme ?? 'light'].background }
              ]}>
                {CURRENCIES.map((curr) => (
                  <Pressable
                    key={curr}
                    style={[
                      styles.dropdownItem,
                      currency === curr && styles.selectedItem
                    ]}
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
  currencyButton: {
    width: '100%',
  },
  categoryButton: {
    width: '100%',
  },
  currencyContainer: {
    position: 'relative',
    zIndex: 2,
  },
  categoryContainer: {
    position: 'relative',
    zIndex: 3,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  formContent: {
    paddingBottom: 24,
  },
  selectedItem: {
    backgroundColor: '#E5E5F5',
  },
}); 