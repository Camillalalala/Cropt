import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Completion'>;

export function CompletionScreen({ navigation }: Props) {
  const handleSpeak = async () => {
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) {
      await Speech.stop();
      return;
    }
    Speech.speak('Successfully sent alerts!', { language: 'en-US', rate: 0.8 });
  };

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

      {/* Centred content */}
      <View style={styles.body}>
        <Text style={styles.heading}>{'Successfully\nsent alerts!'}</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>Go back home</Text>
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
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 40,
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
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
