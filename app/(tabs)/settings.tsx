import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { getJournalEntries, getSettings, updateSettings } from '@/db/queries';
import { exportToExcel } from '@/lib/excel';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    nuit: '',
    address: '',
    email: '',
    phone: '',
    tax_percentage: '16',
    currency: 'MZN'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings: any = await getSettings(db);
      if (settings) {
        setForm({
          company_name: settings.company_name || '',
          nuit: settings.nuit || '',
          address: settings.address || '',
          email: settings.email || '',
          phone: settings.phone || '',
          tax_percentage: String(settings.tax_percentage || '16'),
          currency: settings.currency || 'MZN'
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao carregar definições');
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateSettings(db, {
        ...form,
        tax_percentage: parseFloat(form.tax_percentage)
      });
      Alert.alert('Sucesso', 'Definições actualizadas com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao guardar definições');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportExcel() {
      try {
          const entries = await getJournalEntries(db);
          await exportToExcel(entries, 'Diario', 'backup_diario');
      } catch (e) {
          console.error(e);
          Alert.alert('Erro', 'Falha ao exportar Excel');
      }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-gray-200 bg-transparent">
        <Text variant="heading">Definições</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Text variant="subheading" className="mb-4">Dados da Empresa</Text>
        
        <Input 
          label="Nome da Empresa" 
          value={form.company_name}
          onChangeText={(text) => setForm({...form, company_name: text})}
        />
        <Input 
          label="NUIT" 
          value={form.nuit}
          onChangeText={(text) => setForm({...form, nuit: text})}
        />
        <Input 
          label="Endereço" 
          value={form.address}
          onChangeText={(text) => setForm({...form, address: text})}
        />
        <Input 
          label="Email" 
          value={form.email}
          onChangeText={(text) => setForm({...form, email: text})}
          keyboardType="email-address"
        />
        <Input 
          label="Telefone" 
          value={form.phone}
          onChangeText={(text) => setForm({...form, phone: text})}
          keyboardType="phone-pad"
        />

        <Text variant="subheading" className="mb-4 mt-4">Configuração Fiscal</Text>
        <View className="flex-row gap-4">
            <Input 
              label="Imposto (%)" 
              value={form.tax_percentage}
              onChangeText={(text) => setForm({...form, tax_percentage: text})}
              keyboardType="numeric"
              containerClassName="flex-1"
            />
            <Input 
              label="Moeda" 
              value={form.currency}
              onChangeText={(text) => setForm({...form, currency: text})}
              containerClassName="flex-1"
            />
        </View>

        <Button 
          label="Guardar Alterações" 
          onPress={handleSave} 
          loading={loading}
          className="mt-4 mb-8"
        />
        
        <Text variant="subheading" className="mb-4">Backups</Text>
        <Button variant="outline" label="Exportar Relatório (Excel)" onPress={handleExportExcel} />
      </ScrollView>
    </SafeAreaView>
  );
}
