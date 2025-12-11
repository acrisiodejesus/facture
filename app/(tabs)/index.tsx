import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getInvoiceItems, getSettings } from '@/db/queries';
import { formatInvoiceId } from '@/lib/formatters';
import { generateInvoicePDF } from '@/lib/pdf';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Edit2, Share2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
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

  async function handleShare(invoice: any) {
    try {
        const items = await getInvoiceItems(db, invoice.id);
        const settings = await getSettings(db);
        // Client info is already in invoice object (joined), but we might need structure expected by PDF
        // The query in loadInvoices does: LEFT JOIN clients c ON i.client_id = c.id
        // It selects i.*, c.name as client_name.
        // But generateInvoicePDF expects a client object with name, nuit, address.
        // We should fetch the full client or construct it.
        // Let's fetch the client to be safe and get all details (address, nuit).
        let client = null;
        if (invoice.client_id) {
            client = await db.getFirstAsync('SELECT * FROM clients WHERE id = ?', [invoice.client_id]);
        }
        
        await generateInvoicePDF(invoice, items, settings, client);
    } catch (e: any) {
        if (e.message && e.message.includes('Unable to activate keep awake')) {
            return;
        }
        Alert.alert('Erro', 'Falha ao partilhar factura');
        console.error(e);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-transparent flex-row justify-between items-center">
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
                        <Text variant="subheading">{formatInvoiceId(item.type, item.id)}</Text>
                        <Text variant="muted">{item.client_name || 'Consumidor Final'}</Text>
                    </View>
                    {item.status !== 'DRAFT' && (
                        <Badge label={item.status} variant={item.status === 'PAID' ? 'default' : 'secondary'} />
                    )}
                </View>
                <View className="flex-row justify-between items-center mt-2">
                    <Text variant="heading" className="text-lg">{item.total.toFixed(2)} MT</Text>
                    <View className="flex-row gap-2">
                        <TouchableOpacity 
                            className="p-2 bg-secondary/10 rounded-full"
                            onPress={() => router.push({ pathname: '/invoices/edit', params: { id: item.id } })}
                        >
                            <Edit2 size={20} color="#606c38" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className="p-2 bg-secondary/10 rounded-full"
                            onPress={() => handleShare(item)}
                        >
                            <Share2 size={20} color="#606c38" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
