import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { getJournalEntries, getSettings, updateSettings } from '@/db/queries';
import { exportToExcel } from '@/lib/excel';
import { generateJournalPDF, generateSalesMapPDF } from '@/lib/pdf';
import Constants from 'expo-constants';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { Briefcase } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
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
    currency: 'MZN',
    logo_uri: null as string | null
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
          currency: settings.currency || 'MZN',
          logo_uri: settings.logo_uri || null
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

  async function handlePickLogo() {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setForm({ ...form, logo_uri: result.assets[0].uri });
    }
  }

  async function handleExportJournalExcel() {
      try {
          const entries = await getJournalEntries(db);
          await exportToExcel(entries, 'Diario', 'diario_operacoes', 'JOURNAL');
      } catch (e) {
          console.error(e);
          Alert.alert('Erro', 'Falha ao exportar Excel');
      }
  }

  async function handleExportJournalPDF() {
      try {
          const entries = await getJournalEntries(db);
          const settings = await getSettings(db);
          await generateJournalPDF(entries, settings);
      } catch (e) {
          console.error(e);
          Alert.alert('Erro', 'Falha ao exportar PDF');
      }
  }

  async function handleExportSalesMapExcel() {
      try {
          const entries = await getJournalEntries(db);
          const sales = entries.filter((e: any) => e.type === 'ENTRY');
          await exportToExcel(sales, 'MapaVendas', 'mapa_vendas', 'SALES_MAP');
      } catch (e) {
          console.error(e);
          Alert.alert('Erro', 'Falha ao exportar Excel');
      }
  }

  async function handleExportSalesMapPDF() {
      try {
          const entries = await getJournalEntries(db);
          const settings = await getSettings(db);
          const sales = entries.filter((e: any) => e.type === 'ENTRY');
          await generateSalesMapPDF(sales, settings);
      } catch (e) {
          console.error(e);
          Alert.alert('Erro', 'Falha ao exportar PDF');
      }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-border bg-transparent">
        <Text variant="heading">Definições</Text>
      </View>
      <ScrollView className="flex-1 p-4">
        <Text variant="subheading" className="mb-4">Dados da Empresa</Text>
        
        <View className="items-center mb-6">
            <TouchableOpacity onPress={handlePickLogo} className="h-24 w-24 bg-input rounded-full items-center justify-center overflow-hidden border border-border">
                {form.logo_uri ? (
                    <Image source={{ uri: form.logo_uri }} className="h-full w-full" resizeMode="cover" />
                ) : (
                    <Text className="text-muted text-xs text-center">Logo</Text>
                )}
            </TouchableOpacity>
            <Text className="text-primary text-sm mt-2 font-medium" onPress={handlePickLogo}>Alterar Logo</Text>
        </View>
        
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
        
        <Text variant="subheading" className="mb-4">Exportar Dados</Text>
        
        <View className="mb-6">
            <Text className="mb-2 font-medium text-text">Exportar Diário</Text>
            <Text className="mb-2 text-xs text-muted">Inclui todas as operações (Entradas e Saídas).</Text>
            <View className="flex-row gap-3">
                <Button 
                    variant="outline" 
                    label="PDF" 
                    onPress={handleExportJournalPDF} 
                    className="flex-1"
                />
                <Button 
                    variant="outline" 
                    label="Excel" 
                    onPress={handleExportJournalExcel} 
                    className="flex-1"
                />
            </View>
        </View>

        <View className="mb-6">
            <Text className="mb-2 font-medium text-text">Exportar Mapa de Vendas</Text>
            <Text className="mb-2 text-xs text-muted">Apenas entradas, com cálculo de IVA.</Text>
            <View className="flex-row gap-3">
                <Button 
                    variant="outline" 
                    label="PDF" 
                    onPress={handleExportSalesMapPDF} 
                    className="flex-1"
                />
                <Button 
                    variant="outline" 
                    label="Excel" 
                    onPress={handleExportSalesMapExcel} 
                    className="flex-1"
                />
            </View>
        </View>

        <View className="mt-4 mb-8 border-t border-border pt-6">
            <Text variant="subheading" className="mb-4">Legal e Comercial</Text>
            
            <TouchableOpacity 
                className="bg-primary p-6 rounded-xl mb-6 shadow-lg shadow-primary/20 flex-row items-center gap-4"
                onPress={() => Linking.openURL('https://sejacriativo.org/facture/comercial')}
            >
                <View className="bg-white/20 p-3 rounded-full">
                    <Briefcase size={24} color="white" />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-white text-xl mb-1">Quero usar Comercialmente</Text>
                    <Text className="text-white/90 text-sm leading-5">
                        Use o facture como sistema de facturação da sua empresa com autorização legal da Autoridade Tributária de Moçambique.
                    </Text>
                </View>
            </TouchableOpacity>

            <View className="flex-row justify-center gap-6 mb-6">
                <Text 
                    className="text-primary underline"
                    onPress={() => Linking.openURL('https://sejacriativo.org/facture/terms')}
                >
                    Termos e Condições
                </Text>
                <Text 
                    className="text-primary underline"
                    onPress={() => Linking.openURL('https://sejacriativo.org/facture/privacy')}
                >
                    Políticas de Privacidade
                </Text>
            </View>

            <View className="mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <Text className="font-bold text-secondary mb-2">Isenção de Responsabilidade</Text>
                <Text className="text-text text-sm mb-2">
                    Este aplicativo não representa nenhuma entidade governamental.
                </Text>
                <Text className="text-text text-sm">
                    Fonte das informações fiscais: <Text className="text-primary underline" onPress={() => Linking.openURL('https://www.at.gov.mz')}>Autoridade Tributária de Moçambique (www.at.gov.mz)</Text>.
                </Text>
            </View>

            <Text className="text-center text-text opacity-50 text-xs">
                facture - Versão {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
