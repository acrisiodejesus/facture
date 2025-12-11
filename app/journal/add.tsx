import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { addJournalEntry, getInvoices } from '@/db/queries';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JournalEntryScreen() {
  const { type } = useLocalSearchParams<{ type: 'ENTRY' | 'EXIT' }>();
  const isEntry = type === 'ENTRY';
  
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: '',
    document_type: 'FACTURA', // Default to FACTURA
    invoice_id: null as number | null
  });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (isEntry) {
      loadInvoices();
    }
  }, [isEntry]);

  async function loadInvoices() {
    try {
      const data = await getInvoices(db);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    }
  }

  function handleSelectInvoice(invoice: any) {
    setForm({
      ...form,
      amount: String(invoice.total),
      description: `Pagamento ${invoice.type} #${invoice.invoice_number || invoice.id}`,
      document_type: invoice.type === 'VD' ? 'VD' : 'FACTURA',
      invoice_id: invoice.id
    });
    setShowInvoiceModal(false);
  }

  async function handleSave() {
    if (!form.amount || !form.description) {
        Alert.alert('Erro', 'Valor e Descrição são obrigatórios');
        return;
    }

    setLoading(true);
    try {
      await addJournalEntry(db, {
          type,
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category,
          document_type: isEntry ? form.document_type : null,
          invoice_id: isEntry ? form.invoice_id : null
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao guardar operação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-card flex-row items-center gap-2">
        <Button variant="ghost" label="Voltar" onPress={() => router.back()} size="sm" />
        <Text variant="heading">{isEntry ? 'Nova Entrada' : 'Nova Saída'}</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Input 
          label="Valor (MT) *" 
          value={form.amount}
          onChangeText={(text) => setForm({...form, amount: text})}
          keyboardType="numeric"
        />
        <Input 
          label="Descrição *" 
          value={form.description}
          onChangeText={(text) => setForm({...form, description: text})}
        />
        <Input 
          label="Categoria" 
          value={form.category}
          onChangeText={(text) => setForm({...form, category: text})}
          placeholder="Ex: Vendas, Alimentação, Transporte"
        />

        {isEntry && (
            <View className="mb-4">
                <Button 
                    label={form.invoice_id ? `Factura #${form.invoice_id} Selecionada` : "Selecionar Factura / VD"} 
                    variant="outline" 
                    onPress={() => setShowInvoiceModal(true)}
                    className="mb-4"
                />

                <Text className="mb-2 text-sm font-medium text-text">Tipo de Documento</Text>
                <View className="flex-row gap-4">
                    <Button 
                        label="Factura" 
                        variant={form.document_type === 'FACTURA' ? 'default' : 'outline'} 
                        onPress={() => setForm({...form, document_type: 'FACTURA'})}
                        className="flex-1"
                        size="sm"
                    />
                    <Button 
                        label="VD" 
                        variant={form.document_type === 'VD' ? 'default' : 'outline'} 
                        onPress={() => setForm({...form, document_type: 'VD'})}
                        className="flex-1"
                        size="sm"
                    />
                </View>
            </View>
        )}

        <Button 
          label={isEntry ? "Registar Entrada" : "Registar Saída"}
          onPress={handleSave} 
          loading={loading}
          className={`mt-4 ${isEntry ? 'bg-primary' : 'bg-destructive'}`}
        />
      </ScrollView>

      <Modal visible={showInvoiceModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background p-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text variant="heading">Selecionar Documento</Text>
                <Button label="Fechar" variant="ghost" onPress={() => setShowInvoiceModal(false)} size="sm" />
            </View>
            <ScrollView>
                {invoices.map((inv) => (
                    <TouchableOpacity 
                        key={inv.id} 
                        className="p-4 border-b border-border bg-card mb-2 rounded-lg"
                        onPress={() => handleSelectInvoice(inv)}
                    >
                        <View className="flex-row justify-between">
                            <Text className="font-bold">{inv.type} #{inv.invoice_number || inv.id}</Text>
                            <Text className="font-bold">{inv.total.toFixed(2)} MT</Text>
                        </View>
                        <Text className="text-gray-500 text-sm">{new Date(inv.date).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
