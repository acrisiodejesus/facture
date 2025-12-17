import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { getClients, getProducts, getSettings } from '@/db/queries';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Trash } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewInvoiceScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [form, setForm] = useState({
    type: 'FACTURA', // FACTURA, COTAÇÃO, VD
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

  function addItem(product: any) {
      setForm(prev => {
          const existingItemIndex = prev.items.findIndex(item => item.description === product.name);
          
          if (existingItemIndex >= 0) {
              const newItems = [...prev.items];
              newItems[existingItemIndex].quantity += 1;
              newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unit_price;
              
              return {
                  ...prev,
                  items: newItems
              };
          } else {
              return {
                  ...prev,
                  items: [...prev.items, {
                      product_id: product.id,
                      description: product.name,
                      quantity: 1,
                      unit_price: product.price,
                      tax_rate: product.tax_rate,
                      total: product.price // qty * price
                  }]
              };
          }
      });
      setShowProductModal(false);
  }

  function updateItem(index: number, field: string, value: string) {
      setForm(prev => {
          const newItems = [...prev.items];
          if (field === 'quantity') {
              const qty = parseFloat(value) || 0;
              newItems[index].quantity = qty;
              newItems[index].total = qty * newItems[index].unit_price;
          } else if (field === 'unit_price') {
              const price = parseFloat(value) || 0;
              newItems[index].unit_price = price;
              newItems[index].total = newItems[index].quantity * price;
          } else {
              newItems[index][field] = value;
          }
          return {
              ...prev,
              items: newItems
          };
      });
  }

  function removeItem(index: number) {
      setForm(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
      }));
  }

  const subtotal = form.items.reduce((sum, item) => sum + item.total, 0);
  const taxTotal = subtotal * ((settings?.tax_percentage || 16) / 100);
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
      <View className="p-4 border-b border-border bg-card flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">Novo Documento</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        {/* Type Selection */}
        <View className="flex-row gap-2 mb-4">
            {['FACTURA', 'COTAÇÃO', 'VD'].map(t => (
                <TouchableOpacity 
                    key={t} 
                    onPress={() => setForm({...form, type: t})}
                    className={`flex-1 p-3 rounded-md border ${form.type === t ? 'bg-primary border-primary' : 'bg-card border-border'}`}
                >
                    <Text className={`text-center font-bold ${form.type === t ? 'text-white' : 'text-text'}`}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Client Selection (Simplified) */}
        <Text variant="subheading" className="mb-2">Cliente</Text>
        <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
                onPress={() => setForm({...form, client_id: null})}
                className={`mr-2 p-3 rounded-md border ${form.client_id === null ? 'bg-secondary border-secondary' : 'bg-card border-border'}`}
            >
                <Text className={form.client_id === null ? 'text-white' : 'text-text'}>Consumidor Final</Text>
            </TouchableOpacity>
            {clients.map(c => (
                <TouchableOpacity 
                    key={c.id} 
                    onPress={() => setForm({...form, client_id: c.id})}
                    className={`mr-2 p-3 rounded-md border ${form.client_id === c.id ? 'bg-secondary border-secondary' : 'bg-card border-border'}`}
                >
                    <Text className={form.client_id === c.id ? 'text-white' : 'text-text'}>{c.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Items */}
        <View className="flex-row justify-between items-center mb-2">
            <Text variant="subheading">Itens</Text>
            <Button label="Adicionar Item" size="sm" onPress={() => setShowProductModal(true)} />
        </View>
        
        {form.items.map((item, index) => (
            <Card key={index} className="mb-2 p-3">
                <View className="flex-row justify-between mb-2">
                    <Text className="font-bold flex-1">{item.description}</Text>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                        <Trash size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">Qtd</Text>
                        <Input 
                            value={item.quantity.toString()} 
                            onChangeText={(v) => updateItem(index, 'quantity', v)}
                            keyboardType="numeric"
                            className="h-10"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-muted mb-1">Preço</Text>
                        <Input 
                            value={item.unit_price.toString()} 
                            onChangeText={(v) => updateItem(index, 'unit_price', v)}
                            keyboardType="numeric"
                            className="h-10"
                        />
                    </View>
                    <View className="flex-1 justify-end">
                        <Text className="text-right font-bold text-text h-10 pt-2">
                            {item.total.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </Card>
        ))}

        {/* Totals */}
        <View className="mt-6 bg-card p-4 rounded-lg border border-border">
            <View className="flex-row justify-between mb-2">
                <Text>Subtotal</Text>
                <Text>{subtotal.toFixed(2)} MT</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text>IVA ({settings?.tax_percentage || 16}%)</Text>
                <Text>{taxTotal.toFixed(2)} MT</Text>
            </View>
            <View className="border-t border-border pt-2 flex-row justify-between">
                <Text variant="heading" className="text-lg">Total</Text>
                <Text variant="heading" className="text-lg">{total.toFixed(2)} MT</Text>
            </View>
        </View>

        <Text className="text-xs text-muted text-center mt-2 px-4">
            Taxas configuradas pelo usuário. Verifique a conformidade com a <Text className="text-primary underline" onPress={() => Linking.openURL('https://www.at.gov.mz')}>AT (www.at.gov.mz)</Text>.
        </Text>

        <Button 
          label="Criar Documento" 
          onPress={handleSave} 
          loading={loading}
          className="mt-6 mb-10"
        />
      </ScrollView>

      {/* Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl h-[70%] p-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text variant="heading">Adicionar Item</Text>
                    <TouchableOpacity onPress={() => setShowProductModal(false)}>
                        <Text className="text-primary font-bold">Fechar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {products.map((product) => (
                        <TouchableOpacity 
                            key={product.id} 
                            className="p-4 border-b border-border flex-row justify-between items-center"
                            onPress={() => addItem(product)}
                        >
                            <View>
                                <Text className="text-text font-bold">{product.name}</Text>
                                <Text className="text-muted text-xs">{product.code}</Text>
                            </View>
                            <Text className="text-primary font-bold">{product.price.toFixed(2)} MT</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
