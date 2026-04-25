import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createReport } from '../db/database';
import { getDiseaseInfo } from '../data/diseaseLookup';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { classifierService, type ClassificationResult } from '../services/ClassifierService';
import { syncPendingReports } from '../services/SyncService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [latestResult, setLatestResult] = useState<ClassificationResult | null>(null);
  const [mitigationText, setMitigationText] = useState<string>('');

  const speakMitigation = async (text: string) => {
    const available = await Speech.isSpeakingAsync().catch(() => false);
    if (available) {
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

  const handleMockScan = async () => {
    try {
      setIsSaving(true);
      await classifierService.initialize();
      const result = await classifierService.classifyLeafImage();
      const diseaseInfo = getDiseaseInfo(result.diseaseId);

      await createReport({
        diseaseId: result.diseaseId,
        lat: 34.0522,
        long: -118.2437,
        isSynced: 0,
      });

      setLatestResult(result);
      setMitigationText(diseaseInfo.mitigationSteps);
      await speakMitigation(diseaseInfo.mitigationSteps);

      // Background autosync: keep scan flow fast, only alert if cloud sync fails.
      const syncResult = await syncPendingReports();
      if (syncResult.failedCount > 0) {
        Alert.alert(
          'Auto-sync issue',
          syncResult.lastError
            ? `Scan saved locally, but cloud sync failed: ${syncResult.lastError}`
            : 'Scan saved locally, but cloud sync failed.'
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save mock report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const result = await syncPendingReports();
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
    <View style={styles.container}>
      <Text style={styles.title}>Shared App Entry</Text>
      <Text style={styles.subtitle}>
        Use this as the central shell while teammates plug in features.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
          isSaving && styles.buttonDisabled,
        ]}
        onPress={handleMockScan}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>
          {isSaving ? 'Saving...' : 'Mock a Scan'}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('LocalReports')}
      >
        <Text style={styles.secondaryButtonText}>View Local Reports</Text>
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
        <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync to Cloud'}</Text>
      </Pressable>

      {latestResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultHeading}>Scan Result</Text>
          <Text style={styles.resultDisease}>
            {getDiseaseInfo(latestResult.diseaseId).label}
          </Text>
          <Text style={styles.resultConfidence}>
            Confidence: {(latestResult.confidence * 100).toFixed(0)}%
          </Text>
          <Text style={styles.resultMitigation}>{mitigationText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0b6cff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    width: '100%',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultCard: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#facc15',
    borderRadius: 12,
    padding: 14,
  },
  resultHeading: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  resultDisease: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  resultConfidence: {
    color: '#e5e7eb',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '600',
  },
  resultMitigation: {
    color: '#f9fafb',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
});
