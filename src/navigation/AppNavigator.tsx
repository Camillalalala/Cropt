import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FarmerHomeScreen } from '../components/FarmerHomeScreen';
import { FarmerReportsScreen } from '../components/FarmerReportsScreen';
import { ExpoGoMapScreen } from '../components/ExpoGoMapScreen';

export type RootStackParamList = {
  Home: undefined;
  LocalReports: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={FarmerHomeScreen}
        options={{ title: 'TerraSignal' }}
      />
      <Stack.Screen
        name="LocalReports"
        component={FarmerReportsScreen}
        options={{ title: 'Local Reports' }}
      />
      <Stack.Screen
        name="Map"
        component={ExpoGoMapScreen}
        options={{ title: 'Community Disease Map' }}
      />
    </Stack.Navigator>
  );
}
