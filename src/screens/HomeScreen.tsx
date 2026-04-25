import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VoiceAgentModal } from '../components/VoiceAgentModal';
import { getDemoScanSample, demoScanLibrary, type DemoScanSample } from '../data/demoScanLibrary';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { createReport } from '../db/database';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { classifierService, type ClassificationResult } from '../services/ClassifierService';
import { syncPendingReports } from '../services/SyncService';

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

export function HomeScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedSampleId, setSelectedSampleId] = useState(demoScanLibrary[0]?.id ?? '');
  const [pickedImageUri, setPickedImageUri] = useState('');
  const [latestResult, setLatestResult] = useState<ClassificationResult | null>(null);
  const [mitigationText, setMitigationText] = useState('');
  const [scanText, setScanText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Offline-first storage armed. New field scans save locally.');

  useEffect(() => {
    Network.getNetworkStateAsync().then((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });
  }, []);

  const selectedSample = getDemoScanSample(selectedSampleId) ?? demoScanLibrary[0];
  const latestSample = latestResult?.sampleId ? getDemoScanSample(latestResult.sampleId) : undefined;
  const latestImageUri = latestResult?.sourceUri ?? pickedImageUri;

  const speakMitigation = async (text: string) => {
    const alreadySpeaking = await Speech.isSpeakingAsync().catch(() => false);
    if (alreadySpeaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: 'en-US',
      pitch: 1,
      rate: 0.95,
      volume: 1,
      onError: () => {
        Alert.alert(
          'Speech unavailable',
          'Could not play voice output. Check device volume and silent mode.'
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
          'Photo access needed',
          'Allow photo library access so TerraSignal can attach a crop image to the scan.'
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
      Alert.alert('Image picker failed', 'Could not open the photo library right now.');
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
        'Camera access needed',
        'Allow camera access so TerraSignal can capture crop images in the field.'
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
      Alert.alert('Capture failed', 'Could not capture a photo from the camera.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnalyzeSample = async () => {
    if (!selectedSample) {
      Alert.alert('No sample selected', 'Choose a diagnosis profile before starting analysis.');
      return;
    }

    if (!pickedImageUri) {
      Alert.alert('Photo required', 'Capture or choose a crop image before running the local diagnosis.');
      return;
    }

    try {
      setIsSaving(true);
      await classifierService.initialize();
      const result = await classifierService.classifyLeafImage(pickedImageUri, selectedSample.id);
      const diseaseInfo = getDiseaseInfo(result.diseaseId);

      await createReport({
        diseaseId: result.diseaseId,
        lat: 34.0522,
        long: -118.2437,
        sampleId: selectedSample.id,
        sampleLabel: `${selectedSample.label} - ${selectedSample.crop}`,
        confidence: result.confidence,
        imageUri: pickedImageUri,
        userText: scanText.trim() || selectedSample.fieldNotes,
        isSynced: 0,
      });

      setLatestResult(result);
      setMitigationText(diseaseInfo.mitigationSteps);
      await speakMitigation(diseaseInfo.mitigationSteps);

      const syncResult = await syncPendingReports();
      setSyncMessage(syncResult.message);

      if (syncResult.failedCount > 0) {
        Alert.alert(
          'Auto-sync issue',
          syncResult.lastError
            ? `Scan saved locally, but cloud sync failed: ${syncResult.lastError}`
            : 'Scan saved locally, but cloud sync failed.'
        );
      }

      setScanText('');
    } catch (error) {
      console.error(error);
      Alert.alert('Scan failed', 'The crop image could not be analyzed right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const result = await syncPendingReports();
      setSyncMessage(result.message);
      Alert.alert(
        'Sync Status',
        result.failedCount > 0 && result.lastError
          ? `${result.message}\nLast error: ${result.lastError}`
          : result.message
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Sync Error', 'Could not sync local reports to Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.eyebrow}>Offline Reflex</Text>
            <Text style={styles.title}>TerraSignal Field Scanner</Text>
          </View>
          <View style={[styles.networkBadge, isOnline ? styles.networkOnline : styles.networkOffline]}>
            <Text style={styles.networkText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Capture or attach a crop image, pair it with a stable demo diagnosis profile, and keep the
          report ready for sync when connectivity returns.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Crop Image</Text>
          <Text style={styles.sectionHint}>Capture a live field photo or choose one from the gallery.</Text>
        </View>

        {isCameraOpen ? (
          <View style={styles.cameraCard}>
            <CameraView ref={cameraRef} style={styles.cameraView} facing="back" />
            <View style={styles.cameraActions}>
              <Pressable
                style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
                onPress={() => setIsCameraOpen(false)}
              >
                <Text style={styles.ghostButtonText}>Close Camera</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.captureButton,
                  pressed && styles.buttonPressed,
                  isCapturing && styles.buttonDisabled,
                ]}
                onPress={handleCapturePhoto}
                disabled={isCapturing}
              >
                <Text style={styles.primaryButtonText}>
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.imagePickerCard,
              pressed && styles.buttonPressed,
              (isPickingImage || isCapturing) && styles.buttonDisabled,
            ]}
            onPress={pickedImageUri ? undefined : handleOpenCamera}
            disabled={Boolean(pickedImageUri) || isPickingImage || isCapturing}
          >
            {pickedImageUri ? (
              <Image source={{ uri: pickedImageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.emptyImageState}>
                <Text style={styles.emptyImageTitle}>No crop image attached</Text>
                <Text style={styles.emptyImageBody}>
                  Open the camera for a live field photo or pull one from the gallery.
                </Text>
              </View>
            )}
          </Pressable>
        )}

        <View style={styles.imageActions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleOpenCamera}
          >
            <Text style={styles.secondaryButtonText}>Open Camera</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              isPickingImage && styles.buttonDisabled,
            ]}
            onPress={handlePickImage}
            disabled={isPickingImage}
          >
            <Text style={styles.secondaryButtonText}>
              {isPickingImage ? 'Opening Library...' : 'Choose Photo'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.ghostButton,
              pressed && styles.buttonPressed,
              !pickedImageUri && styles.buttonDisabled,
            ]}
            onPress={() => setPickedImageUri('')}
            disabled={!pickedImageUri}
          >
            <Text style={styles.ghostButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Diagnosis Profile</Text>
          <Text style={styles.sectionHint}>This keeps the live demo deterministic while using a real image.</Text>
        </View>

        <View style={styles.sampleGrid}>
          {demoScanLibrary.map((sample) => {
            const isSelected = sample.id === selectedSampleId;
            return (
              <Pressable
                key={sample.id}
                onPress={() => setSelectedSampleId(sample.id)}
                style={({ pressed }) => [
                  styles.sampleCard,
                  isSelected && styles.sampleCardSelected,
                  pressed && styles.sampleCardPressed,
                ]}
              >
                <SamplePreview sample={sample} />
                <Text style={styles.sampleLabel}>{sample.label}</Text>
                <Text style={styles.sampleCrop}>{sample.crop}</Text>
                <Text style={[styles.sampleDiseasePill, { color: sample.accentColor }]}>
                  {getDiseaseInfo(sample.diseaseId).label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedSample ? (
          <View style={styles.selectionPanel}>
            <Text style={styles.selectionHeading}>Active profile</Text>
            <Text style={styles.selectionTitle}>
              {selectedSample.label} - {selectedSample.crop}
            </Text>
            <Text style={styles.selectionBody}>{selectedSample.analystHint}</Text>
            <Text style={styles.selectionMeta}>Suggested field note: {selectedSample.fieldNotes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Field Notes</Text>
        <TextInput
          value={scanText}
          onChangeText={setScanText}
          placeholder="Add plot conditions, irrigation notes, or farmer observations."
          placeholderTextColor="#6b7280"
          style={styles.textInput}
          multiline
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isSaving && styles.buttonDisabled,
          ]}
          onPress={handleAnalyzeSample}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Analyzing Image...' : 'Analyze Attached Image'}
          </Text>
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate('LocalReports')}
          >
            <Text style={styles.secondaryButtonText}>Open Local Reports</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              pressed && styles.buttonPressed,
              isSyncing && styles.buttonDisabled,
            ]}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync Queue'}</Text>
          </Pressable>
        </View>

        <Text style={styles.syncStatus}>{syncMessage}</Text>
      </View>

      {latestResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultHeading}>Latest Diagnosis</Text>
          {latestImageUri ? <Image source={{ uri: latestImageUri }} style={styles.resultImage} /> : null}
          <Text style={styles.resultDisease}>{getDiseaseInfo(latestResult.diseaseId).label}</Text>
          <Text style={styles.resultConfidence}>
            Confidence {(latestResult.confidence * 100).toFixed(0)}% via local demo classifier
          </Text>
          {latestSample ? (
            <Text style={styles.resultSample}>
              Profile: {latestSample.label} - {latestSample.crop}
            </Text>
          ) : null}
          <Text style={styles.resultMitigation}>{mitigationText}</Text>
          {isOnline ? (
            <Pressable
              style={({ pressed }) => [styles.voiceButton, pressed && styles.buttonPressed]}
              onPress={() => setShowVoiceAgent(true)}
            >
              <Text style={styles.voiceButtonText}>Talk to Agronomist</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {latestResult ? (
        <VoiceAgentModal
          visible={showVoiceAgent}
          diseaseLabel={getDiseaseInfo(latestResult.diseaseId).label}
          diseaseId={latestResult.diseaseId}
          confidence={latestResult.confidence}
          onClose={() => setShowVoiceAgent(false)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef4ef',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  hero: {
    backgroundColor: '#163020',
    borderRadius: 16,
    padding: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 12,
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 21,
  },
  networkBadge: {
    minWidth: 76,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
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
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionHint: {
    color: '#6b7280',
    fontSize: 13,
  },
  imagePickerCard: {
    minHeight: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  cameraCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  cameraView: {
    height: 280,
  },
  cameraActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#0f172a',
  },
  captureButton: {
    flex: 1,
  },
  pickedImage: {
    width: '100%',
    height: 220,
  },
  emptyImageState: {
    minHeight: 220,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyImageTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyImageBody: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  ghostButton: {
    minWidth: 96,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },
  sampleGrid: {
    gap: 12,
  },
  sampleCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  sampleCardSelected: {
    borderColor: '#166534',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  sampleCardPressed: {
    opacity: 0.9,
  },
  samplePreview: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafShape: {
    width: 76,
    height: 92,
    borderRadius: 48,
    backgroundColor: '#65a30d',
    transform: [{ rotate: '-12deg' }],
  },
  spot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    opacity: 0.95,
  },
  blightMark: {
    position: 'absolute',
    width: 26,
    height: 18,
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
    height: 26,
    borderRadius: 999,
    backgroundColor: '#dcfce7',
  },
  sampleLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  sampleCrop: {
    marginTop: 2,
    color: '#4b5563',
    fontSize: 13,
  },
  sampleDiseasePill: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  selectionPanel: {
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    padding: 12,
    gap: 6,
  },
  selectionHeading: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  selectionBody: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  selectionMeta: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  textInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  syncButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  syncStatus: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
  },
  resultHeading: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  resultDisease: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  resultConfidence: {
    marginTop: 4,
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSample: {
    marginTop: 6,
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  resultMitigation: {
    marginTop: 12,
    color: '#f9fafb',
    fontSize: 14,
    lineHeight: 21,
  },
  voiceButton: {
    marginTop: 14,
    backgroundColor: '#facc15',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
});
