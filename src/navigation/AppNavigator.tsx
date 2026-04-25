import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

export type RootStackParamList = {
  Home: undefined;
  LocalReports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'CropOpt Scanner' }}
      />
      <Stack.Screen
        name="LocalReports"
        component={ReportsScreen}
        options={{ title: 'Local Reports' }}
      />
    </Stack.Navigator>
  );
}
