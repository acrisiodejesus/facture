import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getJournalBalance, getJournalEntries } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-gray-200 bg-transparent">
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
            className="flex-1 bg-red-500" 
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
            <View className="flex-row items-center gap-3">
                <View className={`p-2 rounded-full ${item.type === 'ENTRY' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {item.type === 'ENTRY' ? (
                        <ArrowDownRight size={20} color="#16a34a" />
                    ) : (
                        <ArrowUpRight size={20} color="#dc2626" />
                    )}
                </View>
                <View>
                    <Text variant="subheading">{item.description}</Text>
                    <Text variant="muted">{new Date(item.date).toLocaleDateString()}</Text>
                </View>
            </View>
            <Text className={`font-bold ${item.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'}`}>
                {item.type === 'ENTRY' ? '+' : '-'}{item.amount.toFixed(2)} MT
            </Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
