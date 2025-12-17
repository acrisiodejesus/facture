import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useColorScheme } from '@/components/useColorScheme';
import { deleteInvoice, getClients, getInvoice, getInvoiceItems, getProducts, getSettings, updateInvoice } from '@/db/queries';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditInvoiceScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const db = useSQLiteContext();
  
  const [type, setType] = useState('FACTURA');
  const [clientId, setClientId] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [date, setDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const clientsData = await getClients(db);
    const productsData = await getProducts(db);
    const settingsData = await getSettings(db);
    setClients(clientsData);
    setProducts(productsData);
    setSettings(settingsData);

    if (id) {
        const invoice: any = await getInvoice(db, Number(id));
        const invoiceItems = await getInvoiceItems(db, Number(id));
        
        if (invoice) {
            setType(invoice.type);
            setClientId(invoice.client_id);
            setDate(new Date(invoice.date));
            setDueDate(new Date(invoice.due_date));
            setItems(invoiceItems);
        }
    }
  }

  const addItem = (product: any) => {
    const existingItemIndex = items.findIndex(item => item.description === product.name);

    if (existingItemIndex >= 0) {
        const newItems = [...items];
        newItems[existingItemIndex].quantity += 1;
        newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unit_price;
        setItems(newItems);
    } else {
        setItems([...items, { 
            description: product.name, 
            quantity: 1, 
            unit_price: product.price, 
            total: product.price 
        }]);
    }
    setShowProductModal(false);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
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
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * ((settings?.tax_percentage || 16) / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleSave = async () => {
    if (items.length === 0) {
        Alert.alert('Erro', 'Adicione pelo menos um item');
        return;
    }

    const { subtotal, tax, total } = calculateTotals();

    try {
        await updateInvoice(db, Number(id), {
            client_id: clientId,
            type,
            date: date.toISOString(),
            due_date: dueDate.toISOString(),
            subtotal,
            tax_total: tax,
            total
        }, items);
        
        router.back();
    } catch (e) {
        console.error(e);
        Alert.alert('Erro', 'Falha ao actualizar documento');
    }
  };

  const handleDelete = () => {
    Alert.alert(
        'Eliminar Documento',
        'Tem a certeza que pretende eliminar este documento? Esta acção não pode ser desfeita.',
        [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Eliminar', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteInvoice(db, Number(id));
                        router.back();
                    } catch (e) {
                        console.error(e);
                        Alert.alert('Erro', 'Falha ao eliminar documento');
                    }
                }
            }
        ]
    );
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <Text variant="heading">Editar Documento</Text>
        <View className="flex-1" />
        <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="flex-row gap-2 mb-4">
            {['FACTURA', 'COTAÇÃO', 'VD'].map((t) => (
                <TouchableOpacity 
                    key={t}
                    onPress={() => setType(t)}
                    className={`px-4 py-2 rounded-full border ${type === t ? 'bg-primary border-primary' : 'bg-transparent border-border'}`}
                >
                    <Text className={type === t ? 'text-white' : 'text-text opacity-60'}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <Card className="p-4 mb-4">
            <Text className="mb-2 font-medium text-text">Cliente</Text>
            <TouchableOpacity 
                onPress={() => setShowClientModal(true)}
                className="p-3 border border-border rounded-lg bg-card"
            >
                <Text className={clientId ? 'text-text' : 'text-muted'}>
                    {clientId ? clients.find(c => c.id === clientId)?.name : 'Seleccionar Cliente...'}
                </Text>
            </TouchableOpacity>
        </Card>

        <View className="flex-row justify-between items-center mb-2">
            <Text variant="subheading">Itens</Text>
            <Button size="sm" variant="outline" label="Adicionar Item" onPress={() => setShowProductModal(true)} />
        </View>

        {items.map((item, index) => (
            <Card key={index} className="p-3 mb-3">
                <View className="flex-row justify-between mb-2">
                    <Text className="font-bold text-text flex-1">{item.description}</Text>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                        <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <Text className="text-xs text-text opacity-60 mb-1">Qtd</Text>
                        <Input 
                            value={item.quantity.toString()} 
                            onChangeText={(v) => updateItem(index, 'quantity', v)}
                            keyboardType="numeric"
                            className="h-10"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs text-text opacity-60 mb-1">Preço</Text>
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

        <Card className="p-4 mt-4 mb-8 bg-muted/10">
            <View className="flex-row justify-between mb-2">
                <Text className="text-text opacity-60">Subtotal</Text>
                <Text className="text-text">{subtotal.toFixed(2)} MT</Text>
            </View>
            <View className="flex-row justify-between mb-2">
                <Text className="text-text opacity-60">IVA ({settings?.tax_percentage || 16}%)</Text>
                <Text className="text-text">{tax.toFixed(2)} MT</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-border">
                <Text className="font-bold text-lg text-text">Total</Text>
                <Text className="font-bold text-lg text-primary">{total.toFixed(2)} MT</Text>
            </View>
        </Card>

        <Text className="text-xs text-text opacity-60 text-center mb-4 px-4">
            Taxas configuradas pelo usuário. Verifique a conformidade com a <Text className="text-primary underline" onPress={() => Linking.openURL('https://www.at.gov.mz')}>AT (www.at.gov.mz)</Text>.
        </Text>

        <Button label="Actualizar Documento" onPress={handleSave} className="mb-10" />
      </ScrollView>

      {/* Client Modal */}
      <Modal visible={showClientModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl h-[70%] p-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text variant="heading">Seleccionar Cliente</Text>
                    <TouchableOpacity onPress={() => setShowClientModal(false)}>
                        <Text className="text-primary font-bold">Fechar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <TouchableOpacity 
                        className="p-4 border-b border-border"
                        onPress={() => { setClientId(null); setShowClientModal(false); }}
                    >
                        <Text className="text-text">Consumidor Final</Text>
                    </TouchableOpacity>
                    {clients.map((client) => (
                        <TouchableOpacity 
                            key={client.id} 
                            className="p-4 border-b border-border"
                            onPress={() => { setClientId(client.id); setShowClientModal(false); }}
                        >
                            <Text className="text-text font-bold">{client.name}</Text>
                            <Text className="text-muted text-xs">{client.nuit}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>

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
