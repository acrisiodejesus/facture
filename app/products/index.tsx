import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getProducts } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Package } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductsListScreen() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  async function loadProducts() {
    const data = await getProducts(db);
    setProducts(data);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-transparent flex-row justify-between items-center">
        <Text variant="heading">Produtos</Text>
        <Button 
            label="Novo" 
            size="sm" 
            onPress={() => router.push('/products/new')} 
        />
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
            <Text variant="muted" className="text-center mt-10">Nenhum produto registado.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/products/${item.id}`)}>
            <Card className="mb-3 flex-row items-center gap-4">
                <View className="bg-primary/10 p-3 rounded-full">
                    <Package size={24} color="#606c38" />
                </View>
                <View className="flex-1">
                    <Text variant="subheading">{item.name}</Text>
                    <Text variant="muted">{item.code || 'Sem Código'}</Text>
                </View>
                <Text variant="heading" className="text-lg">{item.price.toFixed(2)} MT</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
