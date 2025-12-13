import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useColorScheme } from '@/components/useColorScheme';
import { deleteJournalEntry, getInvoices, getJournalEntry, updateJournalEntry } from '@/db/queries';
import { formatInvoiceId } from '@/lib/formatters';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditJournalEntryScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const db = useSQLiteContext();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadEntry();
    loadInvoices();
  }, [id]);

  async function loadEntry() {
    if (!id) return;
    const entry: any = await getJournalEntry(db, Number(id));
    if (entry) {
        setAmount(entry.amount.toString());
        setDescription(entry.description);
        setCategory(entry.category || '');
        setDocumentType(entry.document_type || '');
        setInvoiceId(entry.invoice_id);
        setType(entry.type as 'ENTRY' | 'EXIT');
    }
  }

  async function loadInvoices() {
    const data = await getInvoices(db);
    setInvoices(data);
  }

  async function handleSave() {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha o valor e a descrição');
      return;
    }

    try {
      await updateJournalEntry(db, Number(id), {
        amount: parseFloat(amount),
        description,
        category,
        document_type: documentType,
        invoice_id: invoiceId
      });
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Falha ao actualizar registo');
    }
  }

  function handleDelete() {
    Alert.alert(
        'Eliminar Registo',
        'Tem a certeza que pretende eliminar este registo? Esta acção não pode ser desfeita.',
        [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Eliminar', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteJournalEntry(db, Number(id));
                        router.back();
                    } catch (e) {
                        console.error(e);
                        Alert.alert('Erro', 'Falha ao eliminar registo');
                    }
                }
            }
        ]
    );
  }

  const selectInvoice = (invoice: any) => {
      setInvoiceId(invoice.id);
      setAmount(invoice.total.toString());
      setDescription(`Pagamento ${invoice.type} #${invoice.invoice_number}`);
      setDocumentType(invoice.type);
      setShowInvoiceModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <Text variant="heading">Editar {type === 'ENTRY' ? 'Entrada' : 'Saída'}</Text>
        <View className="flex-1" />
        <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <Card className="p-4 mb-4">
            {type === 'ENTRY' && (
                <View className="mb-4">
                    <Text className="mb-2 font-medium text-text">Vincular a Factura (Opcional)</Text>
                    <TouchableOpacity 
                        onPress={() => setShowInvoiceModal(true)}
                        className="flex-row items-center justify-between p-3 border border-border rounded-lg bg-card"
                    >
                        <Text className={invoiceId ? 'text-text' : 'text-text opacity-60'}>
                            {invoiceId 
                                ? `Factura ${invoices.find(i => i.id === invoiceId) ? formatInvoiceId(invoices.find(i => i.id === invoiceId).type, invoices.find(i => i.id === invoiceId).id) : invoiceId}` 
                                : 'Seleccionar Factura...'
                            }
                        </Text>
                        <FileText size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            )}

            <Input
                label="Valor (MT)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
            />
            
            <Input
                label="Descrição"
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Venda de serviços"
            />

            <View className="mb-4">
                <Text className="mb-2 font-medium text-text">Tipo de Documento</Text>
                <View className="flex-row gap-2">
                    {['Factura', 'VD', 'Recibo', 'Outro'].map((doc) => (
                        <TouchableOpacity
                            key={doc}
                            onPress={() => setDocumentType(doc)}
                            className={`px-4 py-2 rounded-full border ${
                                documentType === doc 
                                    ? 'bg-primary border-primary' 
                                    : 'bg-transparent border-border'
                            }`}
                        >
                            <Text className={documentType === doc ? 'text-white' : 'text-text opacity-60'}>
                                {doc}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Input
                label="Categoria (Opcional)"
                value={category}
                onChangeText={setCategory}
                placeholder="Ex: Vendas, Serviços, Alimentação"
            />
        </Card>

        <Button label="Actualizar" onPress={handleSave} />
      </ScrollView>

      <Modal visible={showInvoiceModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-background rounded-t-3xl h-[70%] p-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text variant="heading">Seleccionar Factura</Text>
                    <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                        <Text className="text-primary font-bold">Fechar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {invoices.map((invoice) => (
                        <TouchableOpacity 
                            key={invoice.id} 
                            className="p-4 border-b border-border flex-row justify-between items-center"
                            onPress={() => selectInvoice(invoice)}
                        >
                            <View>
                                <Text className="font-bold text-text">{formatInvoiceId(invoice.type, invoice.id)}</Text>
                                <Text className="text-text opacity-60">{new Date(invoice.date).toLocaleDateString()} - {invoice.client_name || 'Consumidor Final'}</Text>
                            </View>
                            <Text className="font-bold text-primary">{invoice.total.toFixed(2)} MT</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
