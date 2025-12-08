import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getSettings } from '@/db/queries';
import { generateInvoicePDF } from '@/lib/pdf';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
        const inv = await db.getFirstAsync('SELECT * FROM invoices WHERE id = ?', [id]);
        // @ts-ignore
        setInvoice(inv);

        const its = await db.getAllAsync('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
        setItems(its);

        // @ts-ignore
        if (inv.client_id) {
            // @ts-ignore
            const cli = await db.getFirstAsync('SELECT * FROM clients WHERE id = ?', [inv.client_id]);
            setClient(cli);
        }

        const sets = await getSettings(db);
        setSettings(sets);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  async function handleShare() {
      if (!invoice || !settings) return;
      try {
          await generateInvoicePDF(invoice, items, settings, client);
      } catch (e) {
          Alert.alert('Erro', 'Falha ao gerar PDF');
      }
  }

  if (loading || !invoice) return <View className="flex-1 bg-white justify-center items-center"><Text>Carregando...</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-white flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
            <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
            <Text variant="heading">Detalhes</Text>
        </View>
        <Button 
            label="Partilhar" 
            size="sm" 
            onPress={handleShare}
            className="bg-primary"
        />
      </View>
      <ScrollView className="flex-1 p-4">
        <Card className="mb-4">
            <View className="flex-row justify-between mb-2">
                <Text variant="subheading">{invoice.type} #{invoice.id}</Text>
                <Text>{new Date(invoice.date).toLocaleDateString()}</Text>
            </View>
            <Text variant="heading" className="text-2xl mb-2">{invoice.total.toFixed(2)} MT</Text>
            <Text variant="muted">Cliente: {client ? client.name : 'Consumidor Final'}</Text>
        </Card>

        <Text variant="subheading" className="mb-2">Itens</Text>
        {items.map((item, index) => (
            <View key={index} className="bg-white p-3 border-b border-gray-100 flex-row justify-between">
                <View>
                    <Text className="font-medium">{item.description}</Text>
                    <Text variant="muted">{item.quantity} x {item.unit_price.toFixed(2)}</Text>
                </View>
                <Text className="font-bold">{item.total.toFixed(2)}</Text>
            </View>
        ))}

        <View className="mt-6 bg-white p-4 rounded-lg">
            <View className="flex-row justify-between mb-2">
                <Text>Subtotal</Text>
                <Text>{invoice.subtotal.toFixed(2)} MT</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>IVA</Text>
                <Text>{invoice.tax_total.toFixed(2)} MT</Text>
            </View>
            <View className="border-t border-gray-200 pt-2 flex-row justify-between">
                <Text variant="heading" className="text-lg">Total</Text>
                <Text variant="heading" className="text-lg">{invoice.total.toFixed(2)} MT</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
