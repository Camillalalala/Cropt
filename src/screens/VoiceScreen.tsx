import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import type { AgentStatus } from '../services/ElevenLabsConvAI';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Voice'>;

type Turn = { role: 'user' | 'agent'; text: string };

const MIC_SIZE = 200;
const RING_SIZE = 280;

export function VoiceScreen({ navigation }: Props) {
  const { status, agentText, userText, connect, startRecording, stopAndSend, disconnect } =
    useVoiceAgent();

  const [turns, setTurns] = useState<Turn[]>([]);
  const prevStatus = useRef<AgentStatus>('idle');
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Connect on mount
  useEffect(() => {
    void connect({
      diseaseLabel: 'Unknown',
      confidence: '0%',
      diseaseId: 'unknown',
      symptomDescription: undefined,
      pastScanSummary: undefined,
      initialAudioPcmBase64: undefined,
    });
    return () => {
      void disconnect();
    };
  }, []);

  // Commit turns on status transitions
  useEffect(() => {
    if (prevStatus.current === 'listening' && status !== 'listening' && userText) {
      setTurns(prev => [...prev, { role: 'user', text: userText }]);
    }
    if (prevStatus.current === 'speaking' && status === 'ready' && agentText) {
      setTurns(prev => [...prev, { role: 'agent', text: agentText }]);
    }
    prevStatus.current = status;
  }, [status]);

  // Pulse animation while listening
  useEffect(() => {
    if (status === 'listening') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [status]);

  // Auto-scroll transcript
  useEffect(() => {
    if (turns.length > 0 || status === 'listening' || status === 'speaking') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [turns, status, userText, agentText]);

  const handleMicPress = () => {
    if (status === 'ready') startRecording();
    else if (status === 'listening') stopAndSend();
  };

  const handleSpeak = async () => {
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) { await Speech.stop(); return; }
    const lastAgent = [...turns].reverse().find(t => t.role === 'agent');
    if (lastAgent) Speech.speak(lastAgent.text, { language: 'en-US', rate: 0.8 });
  };

  const hasAgentResponse = turns.some(t => t.role === 'agent');
  const lastAgentText = [...turns].reverse().find(t => t.role === 'agent')?.text ?? agentText;
  const hasContent = turns.length > 0 || status === 'listening' || status === 'speaking';

  const micDisabled = status === 'speaking' || status === 'connecting' || status === 'idle';
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';

  const statusLabel = () => {
    if (status === 'idle' || status === 'connecting') return 'Connecting…';
    if (status === 'ready' && turns.length === 0) return 'Ready to listen';
    if (status === 'ready') return 'Tap to answer';
    if (status === 'listening') return 'Listening…';
    if (status === 'speaking') return 'CropOpt Agent is speaking…';
    return '';
  };

  const micBorderStyle = status === 'ready' && turns.length > 0
    ? { borderStyle: 'dashed' as const, borderWidth: 2, borderColor: '#2d5016' }
    : {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c2a24" />
        </TouchableOpacity>
        {hasAgentResponse && (
          <TouchableOpacity style={styles.speakerPill} onPress={handleSpeak}>
            <Ionicons name="volume-medium-outline" size={18} color="#2d5016" />
            <Text style={styles.speakerText}>Listen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content area */}
      {!hasContent ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Describe your crop</Text>
          <Text style={styles.emptySubtitle}>Tap mic &amp; speak</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          showsVerticalScrollIndicator={false}
        >
          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            const opacity = isLast && turn.role === 'agent' ? 1 : (!isLast ? 0.55 : 1);
            if (turn.role === 'user') {
              return (
                <View key={i} style={[styles.bubbleWrap, { opacity }]}>
                  <Text style={styles.bubbleLabelUser}>YOU</Text>
                  <View style={styles.userBubble}>
                    <Text style={styles.bubbleText}>{turn.text}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={i} style={[styles.bubbleWrap, { opacity }]}>
                <Text style={styles.bubbleLabelAgent}>CropOpt Agent</Text>
                <View style={styles.agentBubble}>
                  <Text style={styles.bubbleText}>{turn.text}</Text>
                </View>
              </View>
            );
          })}

          {/* Live user bubble */}
          {isListening && userText ? (
            <View style={styles.bubbleWrap}>
              <Text style={styles.bubbleLabelUser}>YOU</Text>
              <View style={styles.userBubble}>
                <Text style={styles.bubbleText}>{userText}</Text>
              </View>
            </View>
          ) : null}

          {/* Live agent bubble */}
          {isSpeaking && agentText ? (
            <View style={styles.bubbleWrap}>
              <Text style={styles.bubbleLabelAgent}>CropOpt Agent</Text>
              <View style={styles.agentBubble}>
                <Text style={styles.bubbleText}>{agentText}</Text>
                <Ionicons name="radio-outline" size={16} color="#2d5016" style={styles.waveIcon} />
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* Mic button area */}
      <View style={styles.micArea}>
        {!hasContent && (
          <View style={styles.outerRing} />
        )}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={[
              styles.micBtn,
              micBorderStyle,
              micDisabled && styles.micBtnDisabled,
            ]}
            onPress={handleMicPress}
            disabled={micDisabled}
          >
            <Ionicons
              name={isListening ? 'stop' : 'mic'}
              size={60}
              color="#fff"
            />
          </Pressable>
        </Animated.View>

        {/* "E" badge */}
        {status !== 'idle' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>E</Text>
          </View>
        )}

        <Text style={styles.statusText}>{statusLabel()}</Text>
      </View>

      {/* Diagnose now CTA */}
      {hasAgentResponse && (
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() =>
            navigation.navigate('VoiceAnalyzing', { agentSummary: lastAgentText })
          }
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.ctaText}>Diagnose now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f2ee',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef4e8',
    borderWidth: 1,
    borderColor: '#97c459',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speakerText: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },

  // Transcript
  transcript: {
    flex: 1,
  },
  transcriptContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  bubbleWrap: {
    gap: 4,
  },
  bubbleLabelUser: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  bubbleLabelAgent: {
    fontSize: 13,
    color: '#2d5016',
    fontWeight: '700',
    paddingLeft: 4,
  },
  userBubble: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  agentBubble: {
    backgroundColor: '#eef4e8',
    borderRadius: 14,
    padding: 14,
  },
  bubbleText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  waveIcon: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },

  // Mic area
  micArea: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(92,138,46,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(92,138,46,0.6)',
    top: '50%',
    marginTop: -(RING_SIZE / 2) + 24,
    alignSelf: 'center',
  },
  micBtn: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: '#2d5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    right: '50%',
    marginRight: -(MIC_SIZE / 2) - 2,
    bottom: 24 + MIC_SIZE - 28,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  statusText: {
    marginTop: 14,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2d5016',
    borderRadius: 50,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 18,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
