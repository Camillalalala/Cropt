import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { createReport } from '../db/database';
import { syncPendingReports } from '../services/SyncService';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnostic'>;

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;

// Static requires evaluated at bundle time — stubs exist in assets/
const LEAF_ASSETS: Record<1 | 2 | 3 | 4, ReturnType<typeof require>> = {
  1: require('../../assets/leaf1.png'),
  2: require('../../assets/leaf2.png'),
  3: require('../../assets/leaf3.png'),
  4: require('../../assets/leaf4.png'),
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#dd5151',
  critical: '#b71c1c',
};

export function DiagnosticScreen({ route, navigation }: Props) {
  const { diseaseId, confidence, imageUri, sampleId } = route.params;
  const diseaseInfo = getDiseaseInfo(diseaseId);
  const [notifying, setNotifying] = useState(false);
  const [leafErrors, setLeafErrors] = useState<Record<number, boolean>>({});

  const targetPct = Math.round(confidence * 100);
  const severityColor = SEVERITY_COLORS[diseaseInfo.severity] ?? '#dd5151';

  // Animated progress bar (0 → confidence)
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Counting number display
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    // Progress bar fill
    Animated.timing(progressAnim, {
      toValue: confidence,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Number count-up
    const DURATION = 900;
    const STEPS = 40;
    const stepMs = DURATION / STEPS;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const progress = Math.min(step / STEPS, 1);
      // ease-out quad
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayPct(Math.round(eased * targetPct));
      if (step >= STEPS) clearInterval(timer);
    }, stepMs);

    return () => clearInterval(timer);
  }, []);

  const handleSpeak = async () => {
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) {
      await Speech.stop();
      return;
    }
    Speech.speak(diseaseInfo.mitigationSteps, { language: 'en-US', rate: 0.8 });
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => ({ coords: { latitude: 0, longitude: 0 } }));
      await createReport({
        diseaseId,
        lat: loc.coords.latitude,
        long: loc.coords.longitude,
        sampleId: sampleId ?? '',
        sampleLabel: diseaseInfo.label,
        confidence,
        imageUri,
        isSynced: 0,
      });
      await syncPendingReports();
      Alert.alert('Sent', 'Nearby farms have been notified.');
    } catch {
      Alert.alert('Error', 'Could not notify farms. Will retry when online.');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#2c2a24" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSpeak} style={styles.headerBtn}>
          <Ionicons name="volume-high-outline" size={26} color="#2c2a24" />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Disease card */}
        <View style={[styles.diseaseCard, { borderColor: severityColor }]}>
          <View style={styles.diseaseRow}>
            <View style={[styles.alertBadge, { backgroundColor: severityColor }]}>
              <Ionicons name="alert" size={14} color="#fff" />
            </View>
            <Text style={styles.diseaseName} numberOfLines={2}>
              {diseaseInfo.label}
            </Text>
            <View style={[styles.confidencePill, { backgroundColor: severityColor }]}>
              <Text style={styles.confidenceText}>{displayPct}%</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: severityColor,
                },
              ]}
            />
          </View>

          {/* Crop image */}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[styles.cropImage, { borderColor: severityColor }]}
              resizeMode="cover"
            />
          ) : null}
        </View>

        {/* Spotted symptoms */}
        <Text style={styles.sectionTitle}>Spotted symptoms</Text>
        <View style={styles.symptomGrid}>
          {diseaseInfo.symptoms.map((sym, i) => (
            <View key={i} style={styles.symptomCard}>
              {leafErrors[i] ? (
                <View style={styles.leafPlaceholder} />
              ) : (
                <Image
                  source={LEAF_ASSETS[sym.assetIndex]}
                  style={styles.leafImage}
                  resizeMode="contain"
                  onError={() => setLeafErrors((prev) => ({ ...prev, [i]: true }))}
                />
              )}
              <Text style={styles.symptomLabel}>{sym.label}</Text>
            </View>
          ))}
        </View>

        {/* Next steps */}
        <Text style={styles.sectionTitle}>Next steps</Text>
        {diseaseInfo.steps.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Notify CTA ── */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={[styles.ctaButton, notifying && styles.ctaDisabled]}
          onPress={handleNotify}
          disabled={notifying}
          activeOpacity={0.85}
        >
          <Ionicons name="megaphone-outline" size={20} color="#fff" style={styles.ctaIcon} />
          <Text style={styles.ctaText}>{notifying ? 'Sending…' : 'Notify nearby farms'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f2ee',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    padding: 6,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },

  // Disease card
  diseaseCard: {
    backgroundColor: '#fcebeb',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diseaseName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  confidencePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#f5c6c6',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cropImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
  },

  // Section header
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2a24',
    marginBottom: 12,
  },

  // Symptom grid
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  symptomCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leafImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  leafPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5c8a2e',
    marginBottom: 8,
  },
  symptomLabel: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Steps
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d5016',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2c2a24',
    lineHeight: 21,
  },

  // Bottom spacer + CTA
  bottomSpacer: {
    height: 80,
  },
  ctaWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: '#f6f2ee',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5016',
    borderRadius: 50,
    paddingVertical: 16,
    gap: 10,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaIcon: {
    marginRight: 2,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
