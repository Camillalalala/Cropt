import { Animated, StyleSheet, View } from 'react-native';

const FRAME_WIDTH = 343;
const FRAME_HEIGHT = 385;
const CORNER_SIZE = 40;
const CORNER_THICKNESS = 4;
const SCAN_LINE_WIDTH = 307;
const SCAN_LINE_HEIGHT = 6;

type Props = {
  containerWidth: number;
  containerHeight: number;
  viewfinderScale: Animated.Value;
  greenProgress: Animated.Value;
  scanLineY: Animated.Value;
  showScanLine: boolean;
};

export function ViewfinderOverlay({
  containerWidth,
  containerHeight,
  viewfinderScale,
  greenProgress,
  scanLineY,
  showScanLine,
}: Props) {
  const frameLeft = (containerWidth - FRAME_WIDTH) / 2;
  const frameTop = (containerHeight - FRAME_HEIGHT) / 2;

  const whiteOpacity = greenProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const overlayColor = 'rgba(44,42,36,0.6)';

  const corners = [
    { top: 0, left: 0, borderTop: true, borderLeft: true },
    { top: 0, right: 0, borderTop: true, borderRight: true },
    { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
    { bottom: 0, right: 0, borderBottom: true, borderRight: true },
  ];

  const scanTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_HEIGHT * 0.936 - SCAN_LINE_HEIGHT - 16],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Semi-transparent overlay strips around the viewfinder hole */}
      <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: frameTop, backgroundColor: overlayColor }]} />
      <View style={[styles.overlay, { bottom: 0, left: 0, right: 0, height: containerHeight - frameTop - FRAME_HEIGHT, backgroundColor: overlayColor }]} />
      <View style={[styles.overlay, { top: frameTop, left: 0, width: frameLeft, height: FRAME_HEIGHT, backgroundColor: overlayColor }]} />
      <View style={[styles.overlay, { top: frameTop, right: 0, width: containerWidth - frameLeft - FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: overlayColor }]} />

      {/* Viewfinder frame — centered, uses transform scale to shrink */}
      <Animated.View
        style={[
          styles.frame,
          {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            left: frameLeft,
            top: frameTop,
            transform: [{ scale: viewfinderScale }],
          },
        ]}
      >
        {/* Green tint overlay inside frame */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(92,135,49,0.32)', opacity: greenProgress },
          ]}
        />

        {/* Corner brackets */}
        {corners.map((corner, i) => (
          <View key={i} style={[styles.cornerWrap, getCornerPosition(corner)]}>
            {/* White corner (fades out) */}
            <Animated.View
              style={[
                styles.cornerBracket,
                getCornerBorders(corner, '#f6f2ee', CORNER_THICKNESS),
                { opacity: whiteOpacity },
              ]}
            />
            {/* Green corner (fades in) */}
            <Animated.View
              style={[
                styles.cornerBracket,
                styles.cornerAbsolute,
                getCornerBorders(corner, '#d0ff92', 3.7),
                {
                  opacity: greenProgress,
                  shadowColor: '#2c2a24',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 9,
                },
              ]}
            />
          </View>
        ))}

        {/* Scan line */}
        {showScanLine && (
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanTranslateY }] },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

function getCornerPosition(corner: Record<string, any>) {
  const pos: Record<string, number> = {};
  if ('top' in corner && typeof corner.top === 'number') pos.top = corner.top;
  if ('bottom' in corner && typeof corner.bottom === 'number') pos.bottom = corner.bottom;
  if ('left' in corner && typeof corner.left === 'number') pos.left = corner.left;
  if ('right' in corner && typeof corner.right === 'number') pos.right = corner.right;
  return pos;
}

function getCornerBorders(
  corner: Record<string, any>,
  color: string,
  width: number,
) {
  const borders: Record<string, any> = {};
  if (corner.borderTop) {
    borders.borderTopWidth = width;
    borders.borderTopColor = color;
  }
  if (corner.borderBottom) {
    borders.borderBottomWidth = width;
    borders.borderBottomColor = color;
  }
  if (corner.borderLeft) {
    borders.borderLeftWidth = width;
    borders.borderLeftColor = color;
  }
  if (corner.borderRight) {
    borders.borderRightWidth = width;
    borders.borderRightColor = color;
  }
  return borders;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
  },
  frame: {
    position: 'absolute',
  },
  cornerWrap: {
    position: 'absolute',
  },
  cornerBracket: {
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  scanLine: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: SCAN_LINE_WIDTH,
    height: SCAN_LINE_HEIGHT,
    borderRadius: SCAN_LINE_HEIGHT / 2,
    backgroundColor: '#d0ff92',
  },
});
