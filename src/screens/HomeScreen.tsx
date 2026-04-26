import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VoiceAgentModal } from '../components/VoiceAgentModal';
import { DosageCalculatorModal } from '../components/DosageCalculatorModal';
import { SymptomInputModal } from '../components/SymptomInputModal';
import { LLMChatModal } from '../components/LLMChatModal';
import { getDemoScanSample, demoScanLibrary } from '../data/demoScanLibrary';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { createReport } from '../db/database';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { classifierService, type ClassificationResult } from '../services/ClassifierService';
import { syncPendingReports } from '../services/SyncService';
import { registerForPushNotifications, saveDeviceToken } from '../services/NotificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CENTER_BUTTON_SIZE = 200;
const CENTER_RING_SIZE = 280;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Core state
  const [networkOnline, setNetworkOnline] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState(demoScanLibrary[0]?.id ?? '');
  const [pickedImageUri, setPickedImageUri] = useState('');
  const [latestResult, setLatestResult] = useState<ClassificationResult | null>(null);
  const [mitigationText, setMitigationText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState<number | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);

  // Modal state
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [showSymptomInput, setShowSymptomInput] = useState(false);
  const [showDosageCalc, setShowDosageCalc] = useState(false);
  const [showLLMChat, setShowLLMChat] = useState(false);
  const [symptomDescription, setSymptomDescription] = useState('');
  const [initialAudioPcmBase64, setInitialAudioPcmBase64] = useState<string | undefined>();

  // Center button press state
  const [centerPressed, setCenterPressed] = useState(false);

  // ── Lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    // Network polling
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setNetworkOnline(Boolean(state.isConnected && state.isInternetReachable));
      } catch {
        setNetworkOnline(false);
      }
    };
    checkNetwork();
    const intervalId = setInterval(checkNetwork, 3000);

    let subscription: any;
    try {
      subscription = Network.addNetworkStateListener((state: any) => {
        setNetworkOnline(Boolean(state.isConnected && state.isInternetReachable));
      });
    } catch {}

    // Initialize ML model
    void (async () => {
      try {
        await classifierService.initialize((progress) => {
          setModelDownloadProgress(progress);
        });
        setIsModelReady(classifierService.isReady());
        setModelDownloadProgress(null);
      } catch {
        setModelDownloadProgress(null);
      }
    })();

    // Push notifications + location
    void (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            await saveDeviceToken(token, loc.coords.latitude, loc.coords.longitude);
          } else {
            await saveDeviceToken(token, 34.0522, -118.2437);
          }
        } catch {
          await saveDeviceToken(token, 34.0522, -118.2437);
        }
      }
    })();

    return () => {
      clearInterval(intervalId);
      subscription?.remove();
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────

  const selectedSample = getDemoScanSample(selectedSampleId) ?? demoScanLibrary[0];

  const speakMitigation = async (text: string) => {
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) await Speech.stop();
    Speech.speak(text, { language: 'en-US', pitch: 1, rate: 0.8, volume: 1 });
  };

  const handleOpenCamera = async () => {
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission.granted) {
      Alert.alert('Camera Access', 'Allow camera to take crop photos.');
      return;
    }
    navigation.navigate('Camera');
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo Access', 'Allow photo access to check crop photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPickedImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Photo Error', 'Could not open photo library.');
    }
  };

  const handleAnalyzeSample = async () => {
    if (!pickedImageUri) {
      Alert.alert('No Photo', 'Take or choose a crop photo first.');
      return;
    }
    try {
      setIsSaving(true);
      if (!classifierService.isReady()) {
        await classifierService.initialize();
        setIsModelReady(classifierService.isReady());
      }
      const result = await classifierService.classifyLeafImage(pickedImageUri, selectedSample.id);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const diseaseInfo = getDiseaseInfo(result.diseaseId);
      await createReport({
        diseaseId: result.diseaseId,
        lat: 34.0522,
        long: -118.2437,
        sampleId: selectedSample.id,
        sampleLabel: `${selectedSample.label} - ${selectedSample.crop}`,
        confidence: result.confidence,
        imageUri: pickedImageUri,
        userText: selectedSample.fieldNotes,
        isSynced: 0,
      });
      setLatestResult(result);
      setMitigationText(diseaseInfo.mitigationSteps);
      setSymptomDescription('');
      setInitialAudioPcmBase64(undefined);
      await speakMitigation(diseaseInfo.mitigationSteps);
      const syncResult = await syncPendingReports();
      if (syncResult.failedCount > 0) {
        Alert.alert('Saved Locally', 'Photo saved on phone. Will sync when online.');
      }
    } catch {
      Alert.alert('Analysis Error', 'Could not analyze photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOfflineDiagnosis = (diseaseId: string, confidence: number) => {
    const diseaseInfo = getDiseaseInfo(diseaseId);
    setLatestResult({ diseaseId, confidence });
    setMitigationText(diseaseInfo.mitigationSteps);
    setSymptomDescription('');
    setInitialAudioPcmBase64(undefined);
    void speakMitigation(diseaseInfo.mitigationSteps);
  };

  const handleOpenAgentWithSymptoms = (text: string, audioBase64?: string) => {
    setSymptomDescription(text);
    setInitialAudioPcmBase64(audioBase64);
    setShowVoiceAgent(true);
  };

  const handleCenterPress = () => {
    if (networkOnline) {
      // Online: open full-screen voice conversation
      navigation.navigate('Voice');
    } else {
      // Offline: open camera
      handleOpenCamera();
    }
  };

  const currentDiseaseId = latestResult?.diseaseId ?? '';
  const currentDiseaseLabel = latestResult ? getDiseaseInfo(latestResult.diseaseId).label : '';

  // ── Main screen ───────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[
            styles.pill,
            networkOnline ? styles.pillOnline : styles.pillOffline,
          ]}
          onPress={async () => {
            const state = await Network.getNetworkStateAsync();
            setNetworkOnline(Boolean(state.isConnected && state.isInternetReachable));
          }}
          accessibilityLabel={networkOnline ? 'Connected' : 'No internet'}
        >
          <View style={styles.wifiIconWrap}>
            <Ionicons
              name="wifi"
              size={24}
              color={networkOnline ? '#5c8a2e' : '#cc2222'}
            />
            {!networkOnline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>!</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, networkOnline ? styles.pillMapOnline : styles.pillMapOffline]}
          onPress={() => navigation.navigate('Map')}
          accessibilityLabel="Disease Map"
        >
          <MaterialCommunityIcons name="map-outline" size={24} color="#2c2a24" />
        </TouchableOpacity>
      </View>

      {/* Model download progress */}
      {modelDownloadProgress != null && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${modelDownloadProgress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Downloading AI... {(modelDownloadProgress * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Alert card - nearby disease (TODO: fetch real nearby alerts) */}
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => navigation.navigate('Map')}
        activeOpacity={0.8}
      >
        <View style={styles.alertRedBar} />
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View style={styles.alertIconWrap}>
              <MaterialCommunityIcons name="bullhorn" size={32} color="#dd5151" />
            </View>
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>Cassava Mosaic</Text>
              <Text style={styles.alertDistance}>8 km</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={28} color="#2c2a24" />
        </View>
      </TouchableOpacity>

      {/* Center action area */}
      <View style={styles.centerArea}>
        <View style={styles.centerRing}>
          <Pressable
            style={[styles.centerButton, centerPressed && styles.centerButtonPressed]}
            onPressIn={() => setCenterPressed(true)}
            onPressOut={() => setCenterPressed(false)}
            onPress={handleCenterPress}
            accessibilityLabel={networkOnline ? 'Start voice conversation' : 'Open camera'}
          >
            {networkOnline ? (
              <Ionicons name="mic" size={80} color="#fff" />
            ) : (
              <Ionicons name="camera" size={80} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Bottom action buttons */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        {networkOnline ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.bottomBtn}
              onPress={handleOpenCamera}
              accessibilityLabel="Take photo"
            >
              <Ionicons name="camera-outline" size={28} color="#000" />
              <Text style={styles.bottomBtnText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomBtn}
              onPress={() => setShowSymptomInput(true)}
              accessibilityLabel="Write symptoms"
            >
              <Ionicons name="pencil-outline" size={22} color="#000" />
              <Text style={styles.bottomBtnText}>Write</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.bottomBtn}
              onPress={() => setShowSymptomInput(true)}
              accessibilityLabel="Write symptoms"
            >
              <Ionicons name="pencil-outline" size={22} color="#000" />
              <Text style={styles.bottomBtnText}>Write</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Modals ────────────────────────────────────────────────── */}

      <VoiceAgentModal
        visible={showVoiceAgent}
        diseaseLabel={currentDiseaseLabel || 'Unknown Disease'}
        diseaseId={currentDiseaseId || 'unknown'}
        confidence={latestResult?.confidence ?? 0}
        symptomDescription={symptomDescription || undefined}
        initialAudioPcmBase64={initialAudioPcmBase64}
        onClose={() => {
          setShowVoiceAgent(false);
          setSymptomDescription('');
          setInitialAudioPcmBase64(undefined);
        }}
      />

      <SymptomInputModal
        visible={showSymptomInput}
        isOnline={networkOnline}
        onClose={() => setShowSymptomInput(false)}
        onOfflineDiagnosis={handleOfflineDiagnosis}
        onOpenAgentWithSymptoms={handleOpenAgentWithSymptoms}
      />

      <DosageCalculatorModal
        visible={showDosageCalc}
        diseaseId={currentDiseaseId}
        onClose={() => setShowDosageCalc(false)}
      />

      <LLMChatModal
        visible={showLLMChat}
        diseaseLabel={currentDiseaseLabel || 'Unknown Disease'}
        diseaseId={currentDiseaseId || 'unknown'}
        confidence={latestResult?.confidence ?? 0}
        onClose={() => setShowLLMChat(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f2ee',
    paddingHorizontal: 20,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pill: {
    width: 107,
    height: 43,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillOnline: {
    backgroundColor: '#eaf3de',
    borderColor: '#97c459',
  },
  pillOffline: {
    backgroundColor: '#fde8e8',
    borderColor: '#cc2222',
  },
  wifiIconWrap: {
    position: 'relative',
  },
  offlineBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#cc2222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 13,
  },
  pillMapOffline: {
    backgroundColor: '#fff',
    borderColor: 'rgba(44, 42, 36, 0.2)',
  },
  pillMapOnline: {
    backgroundColor: '#e8e3da',
    borderColor: 'rgba(44, 42, 36, 0.2)',
  },

  // ── Progress ──
  progressContainer: {
    marginBottom: 12,
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(92, 138, 46, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5c8a2e',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },

  // ── Alert card ──
  alertCard: {
    backgroundColor: '#fcebeb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 81, 81, 0.28)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  alertRedBar: {
    height: 12,
    backgroundColor: '#dd5151',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  alertIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    gap: 2,
  },
  alertTitle: {
    fontSize: 22,
    color: '#2c2a24',
    fontWeight: '400',
  },
  alertDistance: {
    fontSize: 22,
    color: '#2c2a24',
    fontWeight: '600',
  },

  // ── Center button ──
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRing: {
    width: CENTER_RING_SIZE,
    height: CENTER_RING_SIZE,
    borderRadius: CENTER_RING_SIZE / 2,
    backgroundColor: 'rgba(92, 138, 46, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(92, 138, 46, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: '#2d5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonPressed: {
    backgroundColor: '#1e3a0f',
    transform: [{ scale: 0.96 }],
  },

  // ── Bottom actions ──
  bottomActions: {
    paddingTop: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(45, 80, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 80, 22, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomBtnText: {
    fontSize: 28,
    color: '#000',
    fontWeight: '400',
  },

});
