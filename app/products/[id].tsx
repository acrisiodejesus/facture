import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { addProduct } from '@/db/queries';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = id && id !== 'new';
  
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    price: '',
    tax_rate: '0',
    description: ''
  });

  useEffect(() => {
    if (isEditing) {
        loadProductData();
    }
  }, [id]);

  async function loadProductData() {
      const idParam = Array.isArray(id) ? id[0] : id;
      const result = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', idParam);
      if (result) {
          // @ts-ignore
          setForm({
              ...result,
              price: String(result.price),
              tax_rate: String(result.tax_rate)
          });
      }
  }

  async function handleSave() {
    if (!form.name || !form.price) {
        Alert.alert('Erro', 'Nome e Preço são obrigatórios');
        return;
    }

    setLoading(true);
    try {
      const productData = {
          ...form,
          price: isNaN(parseFloat(form.price)) ? 0 : parseFloat(form.price),
          tax_rate: isNaN(parseFloat(form.tax_rate)) ? 0 : parseFloat(form.tax_rate)
      };

      if (isEditing) {
        const idParam = Array.isArray(id) ? id[0] : id;
        await db.runAsync(
            'UPDATE products SET name = ?, code = ?, price = ?, tax_rate = ?, description = ? WHERE id = ?',
            productData.name, productData.code, productData.price, productData.tax_rate, productData.description, idParam
        );
      } else {
        await addProduct(db, productData);
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao guardar produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-card flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">{isEditing ? 'Editar Produto' : 'Novo Produto'}</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Input 
          label="Nome do Produto *" 
          value={form.name}
          onChangeText={(text) => setForm({...form, name: text})}
        />
        <Input 
          label="Código (SKU)" 
          value={form.code}
          onChangeText={(text) => setForm({...form, code: text})}
        />
        <View className="flex-row gap-4">
            <Input 
              label="Preço *" 
              value={form.price}
              onChangeText={(text) => setForm({...form, price: text})}
              keyboardType="numeric"
              containerClassName="flex-1"
            />
            <Input 
              label="Imposto (%)" 
              value={form.tax_rate}
              onChangeText={(text) => setForm({...form, tax_rate: text})}
              keyboardType="numeric"
              containerClassName="flex-1"
            />
        </View>
        <Input 
          label="Descrição" 
          value={form.description}
          onChangeText={(text) => setForm({...form, description: text})}
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
