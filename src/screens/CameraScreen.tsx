import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { classifierService } from '../services/ClassifierService';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;
type CameraState = 'finding' | 'locked' | 'analyzing';

const FRAME_W = 343;
const FRAME_H = 385;
const CORNER_W = 90;
const CORNER_H = 85;
const CORNER_RADIUS = 40;
const BORDER_W = 4;
const SHUTTER_SIZE = 153;

export function CameraScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const isMountedRef = useRef(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraState, setCameraState] = useState<CameraState>('finding');
  const [frozenUri, setFrozenUri] = useState<string | null>(null);

  const greenProgress = useRef(new Animated.Value(0)).current;
  const viewfinderScale = useRef(new Animated.Value(1)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission().then((r) => {
        if (!r.granted && isMountedRef.current) {
          Alert.alert('Camera Access', 'Camera permission is required.');
          navigation.goBack();
        }
      });
    }
  }, []);

  // Finding → Locked
  useEffect(() => {
    const t = setTimeout(() => {
      if (isMountedRef.current) setCameraState('locked');
    }, 1500 + Math.random() * 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cameraState === 'locked') {
      Animated.parallel([
        Animated.timing(viewfinderScale, { toValue: 0.936, duration: 400, useNativeDriver: true }),
        Animated.timing(greenProgress, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    if (cameraState === 'analyzing') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(scanLineY, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [cameraState]);

  const handleShutterPress = async () => {
    if (cameraState !== 'locked') return;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8, shutterSound: false });
      if (!photo?.uri) return;
      setFrozenUri(photo.uri);
      setCameraState('analyzing');
      if (!classifierService.isReady()) await classifierService.initialize();
      // Run classification and minimum 3.5 s display in parallel
      const [result] = await Promise.all([
        classifierService.classifyLeafImage(photo.uri),
        new Promise<void>((resolve) => setTimeout(resolve, 3500)),
      ]);
      if (isMountedRef.current) {
        navigation.replace('Diagnostic', {
          diseaseId: result.diseaseId,
          confidence: result.confidence,
          imageUri: photo.uri,
          sampleId: result.sampleId,
        });
      }
    } catch {
      if (isMountedRef.current) {
        setFrozenUri(null);
        setCameraState('finding');
        viewfinderScale.setValue(1);
        greenProgress.setValue(0);
        scanLineY.setValue(0);
        setTimeout(() => { if (isMountedRef.current) setCameraState('locked'); }, 1500 + Math.random() * 500);
      }
    }
  };

  const isLocked = cameraState === 'locked' || cameraState === 'analyzing';
  const whiteOpacity = greenProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const scanTranslate = scanLineY.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_H - 20] });

  const statusText = cameraState === 'finding' ? 'Finding' : cameraState === 'locked' ? 'Photo locked' : 'Analyzing';
  const shutterDisabled = cameraState !== 'locked';

  const cornerColor = (whiteVal: Animated.AnimatedInterpolation<string | number>, greenVal: Animated.Value) => ({
    white: whiteVal,
    green: greenVal,
  });
  const cc = cornerColor(whiteOpacity, greenProgress);

  return (
    <View style={styles.screen}>
      {/* Camera feed */}
      {frozenUri
        ? <Image source={{ uri: frozenUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      }

      {/* ── Overlay (sits above camera via elevation/zIndex) ── */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Top strip */}
        <View style={styles.stripTop} />
        {/* Left strip */}
        <View style={styles.stripLeft} />
        {/* Right strip */}
        <View style={styles.stripRight} />
        {/* Bottom strip */}
        <View style={styles.stripBottom} />

        {/* Green tint inside frame when locked */}
        <Animated.View
          style={[styles.frameTint, { opacity: greenProgress }]}
        />

        {/* Scan line */}
        {cameraState === 'analyzing' && (
          <Animated.View
            style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
          />
        )}

        {/* ── Corner brackets ── */}
        {/* Top-left */}
        <View style={styles.cornerTL}>
          <Animated.View style={[styles.cornerBase, { borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W, borderTopLeftRadius: CORNER_RADIUS, borderColor: '#f6f2ee', opacity: cc.white }]} />
          <Animated.View style={[styles.cornerBase, StyleSheet.absoluteFill, { borderTopWidth: BORDER_W, borderLeftWidth: BORDER_W, borderTopLeftRadius: CORNER_RADIUS, borderColor: '#d0ff92', opacity: cc.green }]} />
        </View>
        {/* Top-right */}
        <View style={styles.cornerTR}>
          <Animated.View style={[styles.cornerBase, { borderTopWidth: BORDER_W, borderRightWidth: BORDER_W, borderTopRightRadius: CORNER_RADIUS, borderColor: '#f6f2ee', opacity: cc.white }]} />
          <Animated.View style={[styles.cornerBase, StyleSheet.absoluteFill, { borderTopWidth: BORDER_W, borderRightWidth: BORDER_W, borderTopRightRadius: CORNER_RADIUS, borderColor: '#d0ff92', opacity: cc.green }]} />
        </View>
        {/* Bottom-left */}
        <View style={styles.cornerBL}>
          <Animated.View style={[styles.cornerBase, { borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W, borderBottomLeftRadius: CORNER_RADIUS, borderColor: '#f6f2ee', opacity: cc.white }]} />
          <Animated.View style={[styles.cornerBase, StyleSheet.absoluteFill, { borderBottomWidth: BORDER_W, borderLeftWidth: BORDER_W, borderBottomLeftRadius: CORNER_RADIUS, borderColor: '#d0ff92', opacity: cc.green }]} />
        </View>
        {/* Bottom-right */}
        <View style={styles.cornerBR}>
          <Animated.View style={[styles.cornerBase, { borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W, borderBottomRightRadius: CORNER_RADIUS, borderColor: '#f6f2ee', opacity: cc.white }]} />
          <Animated.View style={[styles.cornerBase, StyleSheet.absoluteFill, { borderBottomWidth: BORDER_W, borderRightWidth: BORDER_W, borderBottomRightRadius: CORNER_RADIUS, borderColor: '#d0ff92', opacity: cc.green }]} />
        </View>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#2c2a24" />
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.statusText}>{statusText}</Text>
        <TouchableOpacity
          style={[styles.shutterBtn, shutterDisabled && styles.shutterDisabled]}
          onPress={handleShutterPress}
          disabled={shutterDisabled}
          activeOpacity={0.7}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Frame position constants (screen-relative, bottom panel is ~220px)
const PANEL_H = 220;
// Frame is horizontally centred, vertically centred in camera area
// We approximate frameTop so it sits nicely above the panel
const FRAME_LEFT = (393 - FRAME_W) / 2; // ~25
const FRAME_TOP_APPROX = 148; // matches Figma

const DARK = 'rgba(44,42,36,0.6)';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  // Strips around the frame hole
  stripTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: FRAME_TOP_APPROX,
    backgroundColor: DARK,
  },
  stripLeft: {
    position: 'absolute',
    left: 0,
    top: FRAME_TOP_APPROX,
    width: FRAME_LEFT,
    height: FRAME_H,
    backgroundColor: DARK,
  },
  stripRight: {
    position: 'absolute',
    right: 0,
    top: FRAME_TOP_APPROX,
    width: FRAME_LEFT,
    height: FRAME_H,
    backgroundColor: DARK,
  },
  stripBottom: {
    position: 'absolute',
    left: 0, right: 0,
    top: FRAME_TOP_APPROX + FRAME_H,
    bottom: PANEL_H,
    backgroundColor: DARK,
  },
  // Green tint inside frame
  frameTint: {
    position: 'absolute',
    left: FRAME_LEFT,
    top: FRAME_TOP_APPROX,
    width: FRAME_W,
    height: FRAME_H,
    backgroundColor: 'rgba(92,135,49,0.32)',
  },
  // Scan line
  scanLine: {
    position: 'absolute',
    left: FRAME_LEFT,
    top: FRAME_TOP_APPROX,
    width: FRAME_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#d0ff92',
    shadowColor: '#d0ff92',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  // Corner brackets
  cornerBase: {
    width: CORNER_W,
    height: CORNER_H,
  },
  cornerTL: {
    position: 'absolute',
    left: FRAME_LEFT,
    top: FRAME_TOP_APPROX,
  },
  cornerTR: {
    position: 'absolute',
    right: FRAME_LEFT,
    top: FRAME_TOP_APPROX,
  },
  cornerBL: {
    position: 'absolute',
    left: FRAME_LEFT,
    top: FRAME_TOP_APPROX + FRAME_H - CORNER_H,
  },
  cornerBR: {
    position: 'absolute',
    right: FRAME_LEFT,
    top: FRAME_TOP_APPROX + FRAME_H - CORNER_H,
  },
  // ── Back button ──
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  // ── Bottom panel ──
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c2a24',
    borderTopWidth: 2,
    borderTopColor: '#5c8a2e',
    alignItems: 'center',
    paddingTop: 16,
    gap: 16,
    zIndex: 20,
    elevation: 20,
  },
  statusText: {
    fontSize: 22,
    color: '#f6f2ee',
    fontWeight: '400',
  },
  shutterBtn: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 8,
    borderColor: '#c4b8a3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shutterDisabled: { opacity: 0.4 },
  shutterInner: {
    width: SHUTTER_SIZE - 20,
    height: SHUTTER_SIZE - 20,
    borderRadius: (SHUTTER_SIZE - 20) / 2,
    backgroundColor: '#f6f2ee',
  },
});
