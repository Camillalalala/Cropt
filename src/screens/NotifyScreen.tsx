import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { ZeticBridge } from '../services/ZeticBridge';
import { sendWhatsAppAlert } from '../services/WhatsAppService';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Notify'>;

type Channel = 'inapp' | 'whatsapp';

function OptionCard({
  selected,
  onToggle,
  title,
  subtitle,
  icon,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        {icon && <View style={styles.cardIcon}>{icon}</View>}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );
}

export function NotifyScreen({ route, navigation }: Props) {
  const { diseaseId, confidence, imageUri, sampleId } = route.params;
  const diseaseInfo = getDiseaseInfo(diseaseId);

  const [selected, setSelected] = useState<Set<Channel>>(
    new Set(['inapp', 'whatsapp'])
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agentMessage, setAgentMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const agentMessageRef = useRef('');

  useEffect(() => {
    const sym0 = diseaseInfo.symptoms[0]?.label ?? '';
    const sym1 = diseaseInfo.symptoms[1]?.label ?? '';
    const step0 = diseaseInfo.steps[0] ?? '';

    const fallback = `⚠️ ${diseaseInfo.label} detected on my farm! Check your crops for ${sym0.toLowerCase()} and ${sym1.toLowerCase()}. ${step0}`;

    // Always show fallback immediately so the bubble is never empty
    setAgentMessage(fallback);

    const bridge = ZeticBridge;
    if (!bridge) return;

    const prompt = `You are CropOpt, a farm disease alert assistant. Write a WhatsApp warning in 2 sentences max. Start with ⚠️. Be direct and actionable.\nDisease: ${diseaseInfo.label}\nSymptoms: ${sym0}, ${sym1}\nAction: ${step0}`;

    setIsGenerating(true);
    agentMessageRef.current = '';

    const tokenSub = bridge.onLLMToken(({ token }) => {
      agentMessageRef.current += token;
      setAgentMessage(agentMessageRef.current);
    });

    const completeSub = bridge.onLLMComplete(({ fullResponse }) => {
      setAgentMessage(fullResponse || agentMessageRef.current);
      setIsGenerating(false);
    });

    const errorSub = bridge.onLLMError(() => {
      setAgentMessage(fallback);
      setIsGenerating(false);
    });

    bridge.initLLM()
      .then(() => bridge.generateResponse(prompt))
      .catch(() => {
        setAgentMessage(fallback);
        setIsGenerating(false);
      });

    return () => {
      tokenSub.remove();
      completeSub.remove();
      errorSub.remove();
    };
  }, []);

  const toggleChannel = (ch: Channel) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        next.delete(ch);
      } else {
        next.add(ch);
      }
      return next;
    });
  };

  const handleSpeak = async () => {
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) {
      await Speech.stop();
      return;
    }
    if (agentMessage) {
      Speech.speak(agentMessage, { language: 'en-US', rate: 0.8 });
    }
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      Alert.alert('No channel selected', 'Please select at least one notification channel.');
      return;
    }
    setSending(true);
    try {
      if (selected.has('inapp')) {
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
      }
      if (selected.has('whatsapp')) {
        await sendWhatsAppAlert(phoneNumber.trim(), agentMessage);
      }
      navigation.replace('Completion');
    } catch {
      Alert.alert('Error', 'Could not send warnings. Try again.');
    } finally {
      setSending(false);
    }
  };

  const inappSelected = selected.has('inapp');
  const whatsappSelected = selected.has('whatsapp');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#2c2a24" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSpeak} style={styles.speakerPill}>
          <Ionicons name="volume-high-outline" size={18} color="#2c2a24" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Alert your{'\n'}neighbors</Text>

        <OptionCard
          selected={inappSelected}
          onToggle={() => toggleChannel('inapp')}
          title="In-app users"
          subtitle="3 farmers within 15 km"
        />

        <OptionCard
          selected={whatsappSelected}
          onToggle={() => toggleChannel('whatsapp')}
          title="Whatsapp contacts"
          subtitle="Auto-send messages"
          icon={
            <View style={styles.waIconBg}>
              <Ionicons name="logo-whatsapp" size={18} color="#25d366" />
            </View>
          }
        >
          {whatsappSelected && (
            <>
              <TextInput
                placeholder="+254 712 345 678"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.phoneInput}
              />
              <View style={styles.bubble}>
                <Text style={styles.bubbleAgent}>CropOpt Agent</Text>
                <Text style={styles.bubbleText}>
                  {agentMessage}
                </Text>
                <Text style={styles.bubbleTime}>Just now ✓✓</Text>
              </View>
            </>
          )}
        </OptionCard>

        <View style={styles.spacer} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={[styles.ctaButton, sending && styles.ctaDisabled]}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          <Ionicons name="megaphone-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>{sending ? 'Sending…' : 'Send warnings'}</Text>
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
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e4df',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 38,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#2d5016',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  waIconBg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  bubble: {
    marginTop: 14,
    backgroundColor: '#d9fdd3',
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
  },
  bubbleAgent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  spacer: {
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
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
