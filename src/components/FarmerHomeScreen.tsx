import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VoiceAgentModal } from '../components/VoiceAgentModal';
import { DosageCalculatorModal } from '../components/DosageCalculatorModal';
import { SymptomInputModal } from '../components/SymptomInputModal';
import { getDemoScanSample, demoScanLibrary, type DemoScanSample } from '../data/demoScanLibrary';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { createReport, getReports } from '../db/database';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { classifierService, type ClassificationResult } from '../services/ClassifierService';
import { syncPendingReports } from '../services/SyncService';
import { registerForPushNotifications, saveDeviceToken } from '../services/NotificationService';
import { LLMChatModal } from '../components/LLMChatModal';
import type { LocalReport } from '../types/report';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function SamplePreview({ sample }: { sample: DemoScanSample }) {
  return (
    <View style={[styles.samplePreview, { backgroundColor: sample.previewBackground }]}>
      <View style={styles.leafShape} />
      {sample.previewPattern === 'rust' ? (
        <>
          <View style={[styles.spot, { top: 20, left: 30, backgroundColor: '#c2410c' }]} />
          <View style={[styles.spot, { top: 38, right: 36, backgroundColor: '#ea580c' }]} />
          <View style={[styles.spot, { bottom: 22, left: 54, backgroundColor: '#b45309' }]} />
        </>
      ) : null}
      {sample.previewPattern === 'blight' ? (
        <>
          <View style={[styles.blightMark, { top: 18, left: 28, transform: [{ rotate: '-16deg' }] }]} />
          <View style={[styles.blightMark, { top: 42, right: 22, transform: [{ rotate: '18deg' }] }]} />
          <View style={[styles.blightMark, { bottom: 18, left: 48, transform: [{ rotate: '-8deg' }] }]} />
        </>
      ) : null}
      {sample.previewPattern === 'healthy' ? (
        <>
          <View style={[styles.vein, { top: 18, left: 54, height: 54 }]} />
          <View style={[styles.veinBranch, { top: 30, left: 38, transform: [{ rotate: '-24deg' }] }]} />
          <View style={[styles.veinBranch, { top: 40, left: 58, transform: [{ rotate: '22deg' }] }]} />
        </>
      ) : null}
    </View>
  );
}

export function FarmerHomeScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [selectedSampleId, setSelectedSampleId] = useState(demoScanLibrary[0]?.id ?? '');
  const [pickedImageUri, setPickedImageUri] = useState('');
  const [latestResult, setLatestResult] = useState<ClassificationResult | null>(null);
  const [mitigationText, setMitigationText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(false);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [showSymptomInput, setShowSymptomInput] = useState(false);
  const [showDosageCalc, setShowDosageCalc] = useState(false);
  const [symptomDescription, setSymptomDescription] = useState('');
  const [initialAudioPcmBase64, setInitialAudioPcmBase64] = useState<string | undefined>();
  const [modelDownloadProgress, setModelDownloadProgress] = useState<number | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [showLLMChat, setShowLLMChat] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Network check function
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const isOnline = Boolean(state.isConnected && state.isInternetReachable);
        setNetworkOnline(isOnline);
        console.log('Network state:', isOnline ? 'Online' : 'Offline');
      } catch (error) {
        console.error('Network check failed:', error);
        setNetworkOnline(false);
      }
    };

    // Initial check
    checkNetwork();

    // Set up periodic checks (every 3 seconds)
    intervalId = setInterval(checkNetwork, 3000);

    // Also try to set up network listener (may not work in Expo Go)
    let subscription: any;
    try {
      subscription = Network.addNetworkStateListener((state: any) => {
        const isOnline = Boolean(state.isConnected && state.isInternetReachable);
        setNetworkOnline(isOnline);
        console.log('Network listener update:', isOnline ? 'Online' : 'Offline');
      });
    } catch (error) {
      console.log('Network listener not available, using periodic checks');
    }

    // Initialize ML classifier model
    void (async () => {
      try {
        await classifierService.initialize((progress) => {
          setModelDownloadProgress(progress);
        });
        setIsModelReady(classifierService.isReady());
        setModelDownloadProgress(null);
      } catch (error) {
        console.error('Model init error:', error);
        setModelDownloadProgress(null);
      }
    })();

    // Initialize push notifications and location
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

    // Cleanup on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (subscription) subscription?.remove();
    };
  }, []);

  const selectedSample = getDemoScanSample(selectedSampleId) ?? demoScanLibrary[0];
  const latestImageUri = latestResult?.sourceUri ?? pickedImageUri;

  const speakMitigation = async (text: string) => {
    const alreadySpeaking = await Speech.isSpeakingAsync().catch(() => false);
    if (alreadySpeaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: 'en-US',
      pitch: 1,
      rate: 0.8, // Slower for farmers
      volume: 1,
      onError: () => {
        Alert.alert(
          'Voice Error',
          'Could not play voice. Check volume and silent mode.'
        );
      },
    });
  };

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Access',
          'Allow photo access to check crop photos.'
        );
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
        setIsCameraOpen(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Photo Error', 'Could not open photo library.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleOpenCamera = async () => {
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!permission.granted) {
      Alert.alert(
        'Camera Access',
        'Allow camera to take crop photos.'
      );
      return;
    }

    setIsCameraOpen(true);
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      if (photo.uri) {
        setPickedImageUri(photo.uri);
        setIsCameraOpen(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Camera Error', 'Could not take photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnalyzeSample = async () => {
    if (!selectedSample) {
      Alert.alert('No Crop Selected', 'Choose your crop type first.');
      return;
    }

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
      // Simulate processing delay so user sees the analysis is working
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
        Alert.alert(
          'Saved Locally',
          'Photo saved on phone. Will sync when online.'
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Analysis Error', 'Could not analyze photo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOfflineDiagnosis = (diseaseId: string, confidence: number) => {
    const diseaseInfo = getDiseaseInfo(diseaseId);
    const result: ClassificationResult = { diseaseId, confidence };
    setLatestResult(result);
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

  const currentDiseaseId = latestResult?.diseaseId ?? '';
  const currentDiseaseLabel = latestResult ? getDiseaseInfo(latestResult.diseaseId).label : '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* HERO SECTION WITH LARGE ICONS */}
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.eyebrow}>🌱 Crop Doctor</Text>
            <Text style={styles.title}>TerraSignal</Text>
          </View>
          <TouchableOpacity 
            style={[styles.networkBadge, networkOnline ? styles.networkOnline : styles.networkOffline]}
            onPress={async () => {
              try {
                const state = await Network.getNetworkStateAsync();
                const isOnline = Boolean(state.isConnected && state.isInternetReachable);
                setNetworkOnline(isOnline);
                console.log('Manual network check:', isOnline ? 'Online' : 'Offline');
              } catch (error) {
                console.error('Manual network check failed:', error);
                setNetworkOnline(false);
              }
            }}
          >
            <Ionicons name={networkOnline ? "wifi" : "wifi-outline"} size={16} color="#f8fafc" />
            <Text style={styles.networkText}>
              {networkOnline ? '📶 Connected' : '📵 No Internet'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* MODEL DOWNLOAD PROGRESS */}
        {modelDownloadProgress != null && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              Downloading AI model... {(modelDownloadProgress * 100).toFixed(0)}%
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${modelDownloadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* LARGE ICON NAVIGATION */}
        <View style={styles.iconNavGrid}>
          <TouchableOpacity
            style={styles.iconNavButton}
            onPress={handleOpenCamera}
            accessibilityLabel="Take Photo"
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="camera" size={48} color="#ffffff" />
            </View>
            <Text style={styles.iconNavLabel}>Take Photo</Text>
            <Text style={styles.iconNavSublabel}>📸 Scan crop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconNavButton}
            onPress={() => navigation.navigate('LocalReports')}
            accessibilityLabel="View Reports"
          >
            <View style={styles.iconCircle}>
              <FontAwesome name="file-text-o" size={44} color="#ffffff" />
            </View>
            <Text style={styles.iconNavLabel}>My Reports</Text>
            <Text style={styles.iconNavSublabel}>📋 View history</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconNavButton}
            onPress={() => setShowVoiceAgent(true)}
            accessibilityLabel="Voice Help"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="mic-circle" size={48} color="#ffffff" />
            </View>
            <Text style={styles.iconNavLabel}>Voice Help</Text>
            <Text style={styles.iconNavSublabel}>🎤 Talk to expert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconNavButton}
            onPress={() => navigation.navigate('Map')}
            accessibilityLabel="Disease Map"
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="map" size={48} color="#ffffff" />
            </View>
            <Text style={styles.iconNavLabel}>Disease Map</Text>
            <Text style={styles.iconNavSublabel}>🗺️ See outbreaks</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CAMERA SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📸 Crop Photo</Text>
        </View>

        {isCameraOpen ? (
          <View style={styles.cameraCard}>
            <CameraView ref={cameraRef} style={styles.cameraView} facing={facing} />
            <View style={styles.cameraActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsCameraOpen(false)}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.flipButton]}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              >
                <Ionicons name="camera-reverse" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.captureButton, isCapturing && styles.buttonDisabled]}
                onPress={handleCapturePhoto}
                disabled={isCapturing}
              >
                <Ionicons name="camera" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>
                  {isCapturing ? 'Taking...' : 'Take Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.imagePickerCard, pickedImageUri && styles.imageSelected]}
            onPress={pickedImageUri ? undefined : handleOpenCamera}
            disabled={Boolean(pickedImageUri) || isPickingImage || isCapturing}
          >
            {pickedImageUri ? (
              <>
                <Image source={{ uri: pickedImageUri }} style={styles.pickedImage} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => { setPickedImageUri(''); setIsCameraOpen(false); }}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyImageState}>
                <Ionicons name="camera" size={48} color="#9ca3af" />
                <Text style={styles.emptyImageTitle}>No Photo Yet</Text>
                <Text style={styles.emptyImageBody}>Tap camera to take crop photo</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {!pickedImageUri && (
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[styles.photoButton, styles.primaryPhotoButton]}
              onPress={handleOpenCamera}
            >
              <Ionicons name="camera" size={20} color="#ffffff" />
              <Text style={styles.photoButtonText}>📸 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.secondaryPhotoButton]}
              onPress={handlePickImage}
              disabled={isPickingImage}
            >
              <Ionicons name="image" size={20} color="#166534" />
              <Text style={styles.photoButtonText}>🖼️ Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CROP SELECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌾 Choose Your Crop</Text>
        </View>

        <View style={styles.cropGrid}>
          {demoScanLibrary.map((sample) => {
            const isSelected = sample.id === selectedSampleId;
            return (
              <TouchableOpacity
                key={sample.id}
                onPress={() => setSelectedSampleId(sample.id)}
                style={[
                  styles.cropCard,
                  isSelected && styles.cropCardSelected,
                ]}
              >
                <SamplePreview sample={sample} />
                <Text style={styles.cropLabel}>{sample.label}</Text>
                <Text style={styles.cropType}>{sample.crop}</Text>
                <View style={[styles.diseaseIndicator, { backgroundColor: sample.accentColor }]}>
                  <Text style={styles.diseaseText}>
                    {getDiseaseInfo(sample.diseaseId).label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ANALYZE BUTTON */}
      {pickedImageUri && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.analyzeButton, isSaving && styles.buttonDisabled]}
            onPress={handleAnalyzeSample}
            disabled={isSaving}
          >
            <Ionicons name="search" size={24} color="#ffffff" />
            <Text style={styles.analyzeButtonText}>
              {isSaving ? 'Analyzing...' : '🔍 Analyze Crop Health'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.symptomButton]}
            onPress={() => setShowSymptomInput(true)}
          >
            <Ionicons name="pencil" size={20} color="#166534" />
            <Text style={styles.symptomButtonText}>✍️ Describe Problems</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RESULTS */}
      {latestResult ? (
        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#166534" />
            <Text style={styles.resultTitle}>Analysis Result</Text>
          </View>
          
          {latestImageUri && <Image source={{ uri: latestImageUri }} style={styles.resultImage} />}
          
          <View style={styles.diseaseResult}>
            <Text style={styles.diseaseName}>{getDiseaseInfo(latestResult.diseaseId).label}</Text>
            <Text style={styles.confidenceText}>
              Confidence: {(latestResult.confidence * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.mitigationCard}>
            <Text style={styles.mitigationTitle}>💊 What to Do:</Text>
            <Text style={styles.mitigationText}>{mitigationText}</Text>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.listenButton]}
              onPress={() => void speakMitigation(mitigationText)}
            >
              <Ionicons name="volume-high" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>🔊 Listen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dosageButton]}
              onPress={() => setShowDosageCalc(true)}
            >
              <Ionicons name="calculator" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>💊 Dosage</Text>
            </TouchableOpacity>

            {networkOnline && (
              <TouchableOpacity
                style={[styles.actionButton, styles.voiceButton]}
                onPress={() => {
                  setSymptomDescription('');
                  setInitialAudioPcmBase64(undefined);
                  setShowVoiceAgent(true);
                }}
              >
                <Ionicons name="call" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>📞 Talk to Expert</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.askQuestionButton}
            onPress={() => setShowLLMChat(true)}
          >
            <Ionicons name="chatbubbles" size={20} color="#166534" />
            <Text style={styles.askQuestionText}>Ask a Question (Offline AI)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* QUICK HELP */}
      <View style={styles.section}>
        <View style={styles.helpHeader}>
          <Ionicons name="help-circle" size={20} color="#166534" />
          <Text style={styles.helpTitle}>Quick Help</Text>
        </View>
        <View style={styles.helpSteps}>
          <View style={styles.helpStep}>
            <Text style={styles.helpStepNumber}>1️⃣</Text>
            <Text style={styles.helpStepText}>Take photo of sick crop leaves</Text>
          </View>
          <View style={styles.helpStep}>
            <Text style={styles.helpStepNumber}>2️⃣</Text>
            <Text style={styles.helpStepText}>Choose your crop type</Text>
          </View>
          <View style={styles.helpStep}>
            <Text style={styles.helpStepNumber}>3️⃣</Text>
            <Text style={styles.helpStepText}>Tap "Analyze" to check health</Text>
          </View>
          <View style={styles.helpStep}>
            <Text style={styles.helpStepNumber}>4️⃣</Text>
            <Text style={styles.helpStepText}>Listen to treatment advice</Text>
          </View>
        </View>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  hero: {
    backgroundColor: '#166534',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroTitleBlock: {
    flex: 1,
  },
  eyebrow: {
    color: '#dcfce7',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkOnline: {
    backgroundColor: '#14532d',
  },
  networkOffline: {
    backgroundColor: '#7c2d12',
  },
  networkText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '700',
  },
  iconNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconNavButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconNavLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconNavSublabel: {
    color: '#dcfce7',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  cameraCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cameraView: {
    height: 240,
  },
  cameraActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#000000',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  flipButton: {
    backgroundColor: '#6b7280',
  },
  captureButton: {
    backgroundColor: '#166534',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  imagePickerCard: {
    minHeight: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    position: 'relative',
  },
  imageSelected: {
    borderColor: '#166534',
  },
  pickedImage: {
    width: '100%',
    height: 200,
  },
  retakeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00000080',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retakeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyImageState: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyImageTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyImageBody: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryPhotoButton: {
    backgroundColor: '#166534',
  },
  secondaryPhotoButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#166534',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cropGrid: {
    gap: 12,
  },
  cropCard: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  cropCardSelected: {
    borderColor: '#166534',
    backgroundColor: '#f0fdf4',
  },
  samplePreview: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafShape: {
    width: 70,
    height: 85,
    borderRadius: 40,
    backgroundColor: '#65a30d',
    transform: [{ rotate: '-12deg' }],
  },
  spot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    opacity: 0.95,
  },
  blightMark: {
    position: 'absolute',
    width: 24,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#3f3f46',
    borderWidth: 2,
    borderColor: '#7f1d1d',
  },
  vein: {
    position: 'absolute',
    width: 4,
    borderRadius: 999,
    backgroundColor: '#ecfccb',
  },
  veinBranch: {
    position: 'absolute',
    width: 3,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  cropLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  cropType: {
    marginTop: 2,
    color: '#4b5563',
    fontSize: 13,
  },
  diseaseIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  diseaseText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  analyzeButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  symptomButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#166534',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  symptomButtonText: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '700',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  resultImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  diseaseResult: {
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  mitigationCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  mitigationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  mitigationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listenButton: {
    backgroundColor: '#059669',
  },
  dosageButton: {
    backgroundColor: '#7c3aed',
  },
  voiceButton: {
    backgroundColor: '#0891b2',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  helpSteps: {
    gap: 8,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  helpStepNumber: {
    fontSize: 16,
    minWidth: 30,
  },
  helpStepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  progressContainer: {
    gap: 6,
  },
  progressLabel: {
    color: '#dcfce7',
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#ffffff30',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 4,
  },
  askQuestionButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#166534',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  askQuestionText: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '700',
  },
});
