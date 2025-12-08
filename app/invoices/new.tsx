import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getClients, getProducts, getSettings } from '@/db/queries';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Trash } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewInvoiceScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [form, setForm] = useState({
    type: 'FACTURA', // FACTURA, COTACAO, VD
    client_id: null as number | null,
    items: [] as any[],
    discount: '0'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const c = await getClients(db);
    const p = await getProducts(db);
    const s = await getSettings(db);
    setClients(c);
    setProducts(p);
    setSettings(s);
  }

  function addItem() {
      // For simplicity, just adding a dummy item for now or navigating to a picker
      // In a real app, open a modal to select product
      if (products.length === 0) {
          Alert.alert('Aviso', 'Registe produtos primeiro');
          return;
      }
      const product = products[0]; // Default to first for demo
      
      setForm(prev => ({
          ...prev,
          items: [...prev.items, {
              product_id: product.id,
              description: product.name,
              quantity: 1,
              unit_price: product.price,
              tax_rate: product.tax_rate,
              total: product.price // qty * price
          }]
      }));
  }

  function removeItem(index: number) {
      setForm(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
      }));
  }

  const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxTotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0);
  const total = subtotal + taxTotal;

  async function handleSave() {
      if (form.items.length === 0) {
          Alert.alert('Erro', 'Adicione pelo menos um item');
          return;
      }

      setLoading(true);
      try {
          // 1. Create Invoice
          const result = await db.runAsync(
              'INSERT INTO invoices (type, client_id, subtotal, tax_total, total, status) VALUES (?, ?, ?, ?, ?, ?)',
              [form.type, form.client_id, subtotal, taxTotal, total, 'DRAFT']
          );
          const invoiceId = result.lastInsertRowId;

          // 2. Create Items
          for (const item of form.items) {
              await db.runAsync(
                  'INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, tax_rate, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [invoiceId, item.product_id, item.description, item.quantity, item.unit_price, item.tax_rate, item.total]
              );
          }

          Alert.alert('Sucesso', 'Documento criado!');
          router.back();
      } catch (error) {
          console.error(error);
          Alert.alert('Erro', 'Falha ao criar documento');
      } finally {
          setLoading(false);
      }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-white flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">Novo Documento</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        {/* Type Selection */}
        <View className="flex-row gap-2 mb-4">
            {['FACTURA', 'COTACAO', 'VD'].map(t => (
                <TouchableOpacity 
                    key={t} 
                    onPress={() => setForm({...form, type: t})}
                    className={`flex-1 p-3 rounded-md border ${form.type === t ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                    <Text className={`text-center font-bold ${form.type === t ? 'text-white' : 'text-gray-600'}`}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Client Selection (Simplified) */}
        <Text variant="subheading" className="mb-2">Cliente</Text>
        <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
                onPress={() => setForm({...form, client_id: null})}
                className={`mr-2 p-3 rounded-md border ${form.client_id === null ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
            >
                <Text className={form.client_id === null ? 'text-white' : 'text-gray-800'}>Consumidor Final</Text>
            </TouchableOpacity>
            {clients.map(c => (
                <TouchableOpacity 
                    key={c.id} 
                    onPress={() => setForm({...form, client_id: c.id})}
                    className={`mr-2 p-3 rounded-md border ${form.client_id === c.id ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
                >
                    <Text className={form.client_id === c.id ? 'text-white' : 'text-gray-800'}>{c.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Items */}
        <View className="flex-row justify-between items-center mb-2">
            <Text variant="subheading">Itens</Text>
            <Button label="Adicionar Item" size="sm" onPress={addItem} />
        </View>
        
        {form.items.map((item, index) => (
            <Card key={index} className="mb-2 p-3 flex-row justify-between items-center">
                <View className="flex-1">
                    <Text className="font-bold">{item.description}</Text>
                    <Text variant="muted">{item.quantity} x {item.unit_price.toFixed(2)}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Text className="font-bold">{item.total.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                        <Trash size={18} color="red" />
                    </TouchableOpacity>
                </View>
            </Card>
        ))}

        {/* Totals */}
        <View className="mt-6 bg-white p-4 rounded-lg">
            <View className="flex-row justify-between mb-2">
                <Text>Subtotal</Text>
                <Text>{subtotal.toFixed(2)} MT</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>IVA</Text>
                <Text>{taxTotal.toFixed(2)} MT</Text>
            </View>
            <View className="border-t border-gray-200 pt-2 flex-row justify-between">
                <Text variant="heading" className="text-lg">Total</Text>
                <Text variant="heading" className="text-lg">{total.toFixed(2)} MT</Text>
            </View>
        </View>

        <Button 
          label="Criar Documento" 
          onPress={handleSave} 
          loading={loading}
          className="mt-6 mb-10"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
