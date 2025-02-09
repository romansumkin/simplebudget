import { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AccountFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ 
    id?: string;
    name?: string;
    currency?: string;
    balance?: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [currency, setCurrency] = useState(params.currency ?? 'RUB');
  const [balance, setBalance] = useState(params.balance ?? '0');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название счета');
      return;
    }

    const numBalance = Number(balance.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numBalance)) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    router.push({
      pathname: '/',
      params: {
        action: params.id ? 'edit' : 'add',
        id: params.id ?? Date.now().toString(),
        name: name.trim(),
        currency,
        balance: numBalance,
      },
    });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: params.id ? 'Редактировать счёт' : 'Новый счёт',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <IconSymbol name="xmark" size={20} color={Colors.light.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave}>
              <ThemedText type="link">Сохранить</ThemedText>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.form}>
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle">Название</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Например: Наличные"
            placeholderTextColor="#999"
          />
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle">Валюта</ThemedText>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="RUB"
            placeholderTextColor="#999"
          />
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle">Баланс</ThemedText>
          <TextInput
            style={styles.input}
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#999"
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
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
}); 