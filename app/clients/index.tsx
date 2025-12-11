import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { getClients } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { User } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientsListScreen() {
  const db = useSQLiteContext();
  const [clients, setClients] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  async function loadClients() {
    const data = await getClients(db);
    setClients(data);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="p-4 border-b border-border bg-transparent flex-row justify-between items-center">
        <Text variant="heading">Clientes</Text>
        <Button 
            label="Novo" 
            size="sm" 
            onPress={() => router.push('/clients/new')} 
        />
      </View>
      
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
            <Text variant="muted" className="text-center mt-10">Nenhum cliente registado.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/clients/${item.id}`)}>
            <Card className="mb-3 flex-row items-center gap-4">
                <View className="bg-primary/10 p-3 rounded-full">
                    <User size={24} color="#606c38" />
                </View>
                <View>
                    <Text variant="subheading">{item.name}</Text>
                    <Text variant="muted">{item.nuit || 'Sem NUIT'}</Text>
                </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
