import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getJournalBalance, getJournalEntries, getSettings } from '@/db/queries';
import { generateReceiptPDF } from '@/lib/pdf';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowDownRight, ArrowUpRight, Edit2, Share2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JournalScreen() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const data = await getJournalEntries(db);
    const bal = await getJournalBalance(db);
    setEntries(data);
    setBalance(bal);
  }

  async function handleShareReceipt(entry: any) {
    try {
        const settings = await getSettings(db);
        await generateReceiptPDF(entry, settings);
    } catch (e: any) {
        if (e.message && e.message.includes('Unable to activate keep awake')) {
            return;
        }
        console.error(e);
        Alert.alert('Erro', 'Falha ao gerar recibo');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-transparent">
        <Text variant="heading" className="mb-2">Diário</Text>
        <Card className="bg-primary mb-4 p-4">
            <Text className="text-white/80 text-sm">Saldo Actual</Text>
            <Text className="text-white text-3xl font-bold mt-1">{balance.toFixed(2)} MT</Text>
        </Card>
        <View className="flex-row gap-2">
          <Button 
            label="Entrada" 
            className="flex-1 bg-primary" 
            onPress={() => router.push({ pathname: '/journal/add', params: { type: 'ENTRY' } })}
          />
          <Button 
            label="Saída" 
            className="flex-1 bg-destructive" 
            onPress={() => router.push({ pathname: '/journal/add', params: { type: 'EXIT' } })}
          />
        </View>
      </View>
      
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
            <Text variant="muted" className="text-center mt-10">Nenhuma operação registada.</Text>
        }
        renderItem={({ item }) => (
          <Card className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3 mr-2">
                <View className={`p-2 rounded-full ${item.type === 'ENTRY' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {item.type === 'ENTRY' ? (
                        <ArrowDownRight size={20} color="#16a34a" />
                    ) : (
                        <ArrowUpRight size={20} color="#dc2626" />
                    )}
                </View>
                <View className="flex-1">
                    <Text variant="subheading" numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
                    <Text variant="muted" numberOfLines={1} ellipsizeMode="tail">
                        {new Date(item.date).toLocaleDateString()} 
                        {item.invoice_number ? ` • ${item.invoice_type} #${item.invoice_number}` : (item.document_type ? ` • ${item.document_type}` : '')}
                    </Text>
                </View>
            </View>
            <View className="flex-row items-center gap-3 flex-shrink-0">
                <Text className={`font-bold ${item.type === 'ENTRY' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.type === 'ENTRY' ? '+' : '-'}{item.amount.toFixed(2)} MT
                </Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/journal/edit', params: { id: item.id } })}>
                    <Edit2 size={20} color="#9ca3af" />
                </TouchableOpacity>
                {item.type === 'ENTRY' && (
                    <TouchableOpacity onPress={() => handleShareReceipt(item)}>
                        <Share2 size={20} color="#9ca3af" />
                    </TouchableOpacity>
                )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
