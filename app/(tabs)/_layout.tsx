import { Tabs } from 'expo-router';
import { BookOpen, FileText, Settings, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Platform } from 'react-native';


export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#dda15e' : '#606c38', // accent : primary
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#9ca3af',
        tabBarStyle: {
          borderTopColor: isDark ? '#404040' : '#e5e7eb',
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Facturas',
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Diário',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Registo',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Definições',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
