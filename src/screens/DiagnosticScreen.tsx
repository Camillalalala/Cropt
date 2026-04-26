import React, { useEffect, useRef, useState } from 'react';
import {
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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as Network from 'expo-network';
import * as Speech from 'expo-speech';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { llmService } from '../services/LLMService';
import type { RootStackParamList } from '../navigation/AppNavigator';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnostic'>;

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;

// Pre-load leaf assets via expo-asset so they resolve even if native cache is stale
const LEAF_MODULES: Record<number, number> = {
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
  const { diseaseId, confidence, imageUri, sampleId, conversationTranscript } = route.params;
  const diseaseInfo = getDiseaseInfo(diseaseId);
  const [leafSources, setLeafSources] = useState<Record<number, { uri: string } | number>>({
    1: LEAF_MODULES[1],
    2: LEAF_MODULES[2],
    3: LEAF_MODULES[3],
    4: LEAF_MODULES[4],
  });
  const [generatedSteps, setGeneratedSteps] = useState<string[]>(diseaseInfo.steps);
  const [streamingText, setStreamingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const ttsSound = useRef<Audio.Sound | null>(null);
  const cancelLLM = useRef<(() => void) | null>(null);

  const targetPct = Math.round(confidence * 100);
  const severityColor = SEVERITY_COLORS[diseaseInfo.severity] ?? '#dd5151';

  // Animated progress bar (0 → confidence)
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Counting number display
  const [displayPct, setDisplayPct] = useState(0);

  // Try to resolve leaf assets via expo-asset for fresh URIs; keep require() as fallback
  useEffect(() => {
    (async () => {
      const srcs: Record<number, { uri: string } | number> = {};
      for (const key of [1, 2, 3, 4]) {
        try {
          const asset = Asset.fromModule(LEAF_MODULES[key]);
          await asset.downloadAsync();
          const localUri = asset.localUri ?? asset.uri;
          if (localUri) {
            srcs[key] = { uri: localUri };
          } else {
            srcs[key] = LEAF_MODULES[key];
          }
        } catch {
          // Offline or download failed — fall back to bundled require()
          srcs[key] = LEAF_MODULES[key];
        }
      }
      setLeafSources(srcs);
    })();
  }, []);

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
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayPct(Math.round(eased * targetPct));
      if (step >= STEPS) clearInterval(timer);
    }, stepMs);

    // Speak the 3 steps aloud after a short delay
    const stepsText = diseaseInfo.steps.join('. ');
    // Start native TTS immediately as a fallback — it will be stopped if ElevenLabs succeeds
    const speakTimer = setTimeout(() => {
      Speech.speak(stepsText, { rate: 0.9 });
    }, 400);

    // Try ElevenLabs in parallel — if it works, stop native TTS and play ElevenLabs instead
    const elevenLabsTimer = setTimeout(() => {
      const networkTimeout = new Promise<boolean>((resolve) => {
        const t = setTimeout(() => resolve(false), 2000);
        Network.getNetworkStateAsync()
          .then((net) => { clearTimeout(t); resolve(net.isInternetReachable === true); })
          .catch(() => { clearTimeout(t); resolve(false); });
      });
      networkTimeout.then((online) => {
        if (online) {
          // Stop native TTS before playing ElevenLabs
          Speech.stop();
          void elevenLabsSpeak(stepsText);
        }
        // If offline, native TTS is already playing — do nothing
      });
    }, 300);

    // Try LLM in background
    void generateAndSpeak();

    return () => {
      clearTimeout(speakTimer);
      clearTimeout(elevenLabsTimer);
      clearInterval(timer);
      cancelLLM.current?.();
    };
  }, []);

  /** ElevenLabs TTS (online only) */
  const elevenLabsSpeak = async (text: string) => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });
    const res = await fetch(`${BACKEND_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
    const { audio } = await res.json() as { audio: string };
    const path = `${FileSystem.cacheDirectory}diag_tts.mp3`;
    await FileSystem.writeAsStringAsync(path, audio, { encoding: FileSystem.EncodingType.Base64 });
    const { sound } = await Audio.Sound.createAsync({ uri: path });
    ttsSound.current = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        ttsSound.current = null;
        FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
      }
    });
  };

  /** Re-speak steps (speaker button / LLM replay) */
  const speakSteps = async (steps: string[]) => {
    const text = steps.join('. ');
    let online = false;
    try {
      const net = await Network.getNetworkStateAsync();
      online = net.isInternetReachable === true;
    } catch { online = false; }

    if (!online) {
      Speech.speak(text, { rate: 0.9 });
      return;
    }

    try {
      await elevenLabsSpeak(text);
    } catch {
      Speech.speak(text, { rate: 0.9 });
    }
  };

  const parseSteps = (raw: string): [string, string, string] => {
    const lines = raw.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    const s = (i: number) => lines[i] ?? diseaseInfo.steps[i];
    return [s(0), s(1), s(2)];
  };

  const generateAndSpeak = async () => {
    // Try LLM in background — if it finishes, update steps and replay
    if (!llmService.isReady()) return;

    setIsGenerating(true);
    const transcriptSection = conversationTranscript
      ? `\n\nConversation with farmer:\n${conversationTranscript}`
      : '';
    const prompt =
      `You are an agricultural expert. A farmer's crop has been diagnosed with ${diseaseInfo.label} (severity: ${diseaseInfo.severity}). ` +
      `Observed symptoms: ${diseaseInfo.symptoms.map(s => s.label).join(', ')}.` +
      transcriptSection +
      `\n\nBased on all the above, give exactly 3 short, practical next steps numbered 1, 2, 3. Each step is one sentence and tailored to what the farmer described.`;

    cancelLLM.current = llmService.generate(
      prompt,
      undefined,
      (token) => setStreamingText(prev => prev + token),
      async (full) => {
        const steps = parseSteps(full);
        setGeneratedSteps(steps);
        setStreamingText('');
        setIsGenerating(false);
        // Stop current TTS and replay with generated steps
        if (ttsSound.current) {
          await ttsSound.current.stopAsync().catch(() => {});
          await ttsSound.current.unloadAsync().catch(() => {});
          ttsSound.current = null;
        }
        void speakSteps(steps);
      },
      () => {
        setIsGenerating(false);
      },
    );
  };

  const handleSpeak = async () => {
    // Stop any current speech (ElevenLabs or device TTS)
    if (ttsSound.current) {
      await ttsSound.current.stopAsync().catch(() => {});
      await ttsSound.current.unloadAsync().catch(() => {});
      ttsSound.current = null;
      return;
    }
    if (await Speech.isSpeakingAsync()) {
      Speech.stop();
      return;
    }
    void speakSteps(generatedSteps);
  };

  const handleNotify = () => {
    navigation.navigate('Notify', { diseaseId, confidence, imageUri, sampleId });
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
          {diseaseInfo.symptoms.map((sym, i) => {
            const src = leafSources[sym.assetIndex] ?? LEAF_MODULES[1];
            return (
              <View key={i} style={styles.symptomCard}>
                <Image
                  source={src}
                  style={styles.leafImage}
                  resizeMode="contain"
                />
                <Text style={styles.symptomLabel}>{sym.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Next steps */}
        <Text style={styles.sectionTitle}>Next steps</Text>
        {isGenerating && streamingText ? (
          <View style={styles.stepCard}>
            <View style={styles.stepCircle}>
              <Ionicons name="flash-outline" size={14} color="#fff" />
            </View>
            <Text style={styles.stepText}>{streamingText}</Text>
          </View>
        ) : (
          generatedSteps.map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Notify CTA ── */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleNotify}
          activeOpacity={0.85}
        >
          <Ionicons name="megaphone-outline" size={20} color="#fff" style={styles.ctaIcon} />
          <Text style={styles.ctaText}>Notify nearby farms</Text>
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
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  leafImage: {
    width: CARD_WIDTH - 20,
    height: CARD_WIDTH - 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
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
