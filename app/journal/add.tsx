import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { addJournalEntry } from '@/db/queries';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JournalEntryScreen() {
  const { type } = useLocalSearchParams<{ type: 'ENTRY' | 'EXIT' }>();
  const isEntry = type === 'ENTRY';
  
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: ''
  });

  async function handleSave() {
    if (!form.amount || !form.description) {
        Alert.alert('Erro', 'Valor e Descrição são obrigatórios');
        return;
    }

    setLoading(true);
    try {
      await addJournalEntry(db, {
          type,
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao guardar operação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-white flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">{isEntry ? 'Nova Entrada' : 'Nova Saída'}</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Input 
          label="Valor (MT) *" 
          value={form.amount}
          onChangeText={(text) => setForm({...form, amount: text})}
          keyboardType="numeric"
        />
        <Input 
          label="Descrição *" 
          value={form.description}
          onChangeText={(text) => setForm({...form, description: text})}
        />
        <Input 
          label="Categoria" 
          value={form.category}
          onChangeText={(text) => setForm({...form, category: text})}
          placeholder="Ex: Vendas, Alimentação, Transporte"
        />

        <Button 
          label={isEntry ? "Registar Entrada" : "Registar Saída"}
          onPress={handleSave} 
          loading={loading}
          className={`mt-4 ${isEntry ? 'bg-primary' : 'bg-red-500'}`}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
