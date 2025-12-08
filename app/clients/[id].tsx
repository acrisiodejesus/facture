import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { addClient, updateClient } from '@/db/queries';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientFormScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = id && id !== 'new';
  
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nuit: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (isEditing) {
        // In a real app we would fetch the single client here
        // For now we rely on the list passing data or re-fetching
        // But since we don't have getClientById yet, let's just assume new for now or implement it
        loadClientData();
    }
  }, [id]);

  async function loadClientData() {
      // TODO: Implement getClientById
      const idParam = Array.isArray(id) ? id[0] : id;
      const result = await db.getFirstAsync('SELECT * FROM clients WHERE id = ?', idParam);
      if (result) {
          // @ts-ignore
          setForm(result);
      }
  }

  async function handleSave() {
    console.log('handleSave called', form);
    if (!form.name) {
        Alert.alert('Erro', 'O nome é obrigatório');
        return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const idParam = Array.isArray(id) ? id[0] : id;
        console.log('Updating client with id:', idParam);
        await updateClient(db, Number(idParam), form);
      } else {
        console.log('Adding new client');
        await addClient(db, form);
      }
      console.log('Save successful, navigating back');
      router.back();
    } catch (error) {
      console.error('Error in handleSave:', error);
      Alert.alert('Erro', 'Falha ao guardar cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-white flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Input 
          label="Nome do Cliente *" 
          value={form.name}
          onChangeText={(text) => setForm({...form, name: text})}
        />
        <Input 
          label="NUIT" 
          value={form.nuit}
          onChangeText={(text) => setForm({...form, nuit: text})}
          keyboardType="numeric"
        />
        <Input 
          label="Email" 
          value={form.email}
          onChangeText={(text) => setForm({...form, email: text})}
          keyboardType="email-address"
        />
        <Input 
          label="Telefone" 
          value={form.phone}
          onChangeText={(text) => setForm({...form, phone: text})}
          keyboardType="phone-pad"
        />
        <Input 
          label="Endereço" 
          value={form.address}
          onChangeText={(text) => setForm({...form, address: text})}
          multiline
          numberOfLines={3}
          className="h-24 py-2"
        />

        <Button 
          label="Guardar" 
          onPress={handleSave} 
          loading={loading}
          className="mt-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
