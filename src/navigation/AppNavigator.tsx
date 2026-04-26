import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';
import { FarmerReportsScreen } from '../components/FarmerReportsScreen';
import { ExpoGoMapScreen } from '../components/ExpoGoMapScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Diagnostic: {
    diseaseId: string;
    confidence: number;
    imageUri: string;
    sampleId?: string;
  };
  LocalReports: undefined;
  Map: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Diagnostic"
        component={DiagnosticScreen}
        options={{ headerShown: false }}
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
