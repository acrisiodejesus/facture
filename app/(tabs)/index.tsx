import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Share2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InvoicesScreen() {
  const db = useSQLiteContext();
  const [invoices, setInvoices] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  async function loadInvoices() {
    // TODO: Implement getInvoices in queries.ts
    const data = await db.getAllAsync(`
        SELECT i.*, c.name as client_name 
        FROM invoices i 
        LEFT JOIN clients c ON i.client_id = c.id 
        ORDER BY date DESC
    `);
    setInvoices(data);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-transparent flex-row justify-between items-center">
        <Text variant="heading">Facturas</Text>
        <Button 
            label="Nova Factura" 
            size="sm" 
            onPress={() => router.push('/invoices/new')} 
        />
      </View>
      
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
            <Text variant="muted" className="text-center mt-10">Nenhum documento gerado ainda.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/invoices/${item.id}`)}>
            <Card className="mb-3">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text variant="subheading">{item.type} #{item.id}</Text>
                        <Text variant="muted">{item.client_name || 'Consumidor Final'}</Text>
                    </View>
                    <Badge label={item.status} variant={item.status === 'PAID' ? 'default' : 'secondary'} />
                </View>
                <View className="flex-row justify-between items-center mt-2">
                    <Text variant="heading" className="text-lg">{item.total.toFixed(2)} MT</Text>
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
                        <Share2 size={20} color="#606c38" />
                    </TouchableOpacity>
                </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
