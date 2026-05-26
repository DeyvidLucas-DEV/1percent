import { Tabs } from 'expo-router';
import { TabBarPill } from '../../src/components/ui/TabBarPill';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <TabBarPill {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="areas" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="config" />
    </Tabs>
  );
}
