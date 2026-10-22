import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useCurrentUser } from '@servicienta/query-hooks';
import type { ColorValue } from 'react-native';
import { MobileAccess } from '@/features/auth/MobileAccess';
import { colors } from '@/theme/colors';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: TabIconName) {
  return function TabIcon({
    color,
    size,
  }: {
    focused: boolean;
    color: ColorValue;
    size: number;
  }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function MainTabsLayout() {
  return (
    <MobileAccess>
      <MainTabs />
    </MobileAccess>
  );
}

function MainTabs() {
  const { data: user } = useCurrentUser();
  const isClient = user?.role === 'client';
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: isClient ? 'Búsqueda' : 'Hoy',
          tabBarIcon: tabIcon(isClient ? 'search-outline' : 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: tabIcon('clipboard-outline'),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Visitas',
          tabBarIcon: tabIcon('construct-outline'),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: tabIcon('chatbubbles-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: tabIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
