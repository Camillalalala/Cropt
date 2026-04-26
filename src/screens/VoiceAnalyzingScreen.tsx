import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { matchSymptoms } from '../data/symptomKeywords';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceAnalyzing'>;

const RING_SIZE = 260;

export function VoiceAnalyzingScreen({ navigation, route }: Props) {
  const { agentSummary, conversationTranscript } = route.params;

  const ringScale = useRef(new Animated.Value(1)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.08, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(ringScale, { toValue: 1.0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    ringAnim.start();

    const scanAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    scanAnim.start();

    const result = matchSymptoms(agentSummary);
    const timer = setTimeout(() => {
      navigation.replace('Diagnostic', {
        diseaseId: result.matched ? result.diseaseId : 'healthy',
        confidence: result.confidence,
        imageUri: '',
        sampleId: undefined,
        conversationTranscript,
      });
    }, 2500);

    return () => {
      ringAnim.stop();
      scanAnim.stop();
      clearTimeout(timer);
    };
  }, []);

  const scanTranslate = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RING_SIZE - 20],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.ringContainer, { transform: [{ scale: ringScale }] }]}>
        <Image
          source={require('../../assets/leaf1.png')}
          style={styles.leafImage}
          resizeMode="contain"
        />
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
        />
      </Animated.View>
      <Text style={styles.label}>Analyzing crop…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f2ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(92,138,46,0.10)',
    borderWidth: 2,
    borderColor: 'rgba(92,138,46,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leafImage: {
    width: 180,
    height: 180,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#d0ff92',
    shadowColor: '#d0ff92',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
