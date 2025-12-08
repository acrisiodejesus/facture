import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { router } from 'expo-router';
import { Package, Users } from 'lucide-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-gray-200 bg-transparent">
        <Text variant="heading">Registo</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <View className="flex-row gap-4">
            <TouchableOpacity className="flex-1" onPress={() => router.push('/clients')}>
                <Card className="items-center p-6">
                    <Users size={32} color="#606c38" />
                    <Text variant="subheading" className="mt-2">Clientes</Text>
                </Card>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1" onPress={() => router.push('/products')}>
                <Card className="items-center p-6">
                    <Package size={32} color="#606c38" />
                    <Text variant="subheading" className="mt-2">Produtos</Text>
                </Card>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
