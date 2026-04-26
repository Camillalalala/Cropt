import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';
import { NotifyScreen } from '../screens/NotifyScreen';
import { CompletionScreen } from '../screens/CompletionScreen';
import { FarmerReportsScreen } from '../components/FarmerReportsScreen';
import { ExpoGoMapScreen } from '../components/ExpoGoMapScreen';
import { VoiceScreen } from '../screens/VoiceScreen';
import { VoiceAnalyzingScreen } from '../screens/VoiceAnalyzingScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Diagnostic: {
    diseaseId: string;
    confidence: number;
    imageUri: string;
    sampleId?: string;
  };
  Notify: {
    diseaseId: string;
    confidence: number;
    imageUri: string;
    sampleId?: string;
  };
  Completion: undefined;
  LocalReports: undefined;
  Map: undefined;
  Voice: undefined;
  VoiceAnalyzing: { agentSummary: string };
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
        name="Notify"
        component={NotifyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Completion"
        component={CompletionScreen}
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
      <Stack.Screen
        name="Voice"
        component={VoiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VoiceAnalyzing"
        component={VoiceAnalyzingScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
