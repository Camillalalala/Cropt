import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';
import { getDiseaseInfo } from '../data/diseaseLookup';

type ScanPin = {
  id: number;
  disease_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function markerColor(diseaseId: string): string {
  if (diseaseId === 'healthy') return '#15803d';
  if (diseaseId.includes('rust')) return '#b45309';
  if (diseaseId.includes('blight') || diseaseId.includes('mildew')) return '#7c2d12';
  return '#1e40af';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function ExpoGoMapScreen() {
  const [pins, setPins] = useState<ScanPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Get device location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {
      // fallback to LA default
      setUserLocation({ latitude: 34.0522, longitude: -118.2437 });
    }

    // Fetch scan reports
    const { data, error: fetchError } = await supabase
      .from('scan_reports')
      .select('id, disease_id, latitude, longitude, timestamp')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (fetchError) {
      setError('Could not load map data. Check your connection.');
    } else {
      setPins((data ?? []) as ScanPin[]);
    }

    setLoading(false);
  };

  const handleLocationPress = (pin: ScanPin) => {
    const diseaseInfo = getDiseaseInfo(pin.disease_id);
    Alert.alert(
      diseaseInfo.label,
      `Reported: ${timeAgo(pin.timestamp)}\n\nTap to view details on map website`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open in Maps', 
          onPress: () => {
            // This would open in external map app if available
            console.log('Open maps for:', pin.latitude, pin.longitude);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.loadingText}>Loading community reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diseaseCounts: Record<string, number> = {};
  for (const p of pins) {
    if (p.disease_id !== 'healthy') {
      diseaseCounts[p.disease_id] = (diseaseCounts[p.disease_id] ?? 0) + 1;
    }
  }
  const alertCount = pins.filter((p) => p.disease_id !== 'healthy').length;

  // Sort pins by distance from user if location is available
  const sortedPins = userLocation 
    ? [...pins].sort((a, b) => {
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      })
    : pins;

  return (
    <View style={styles.container}>
      {alertCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {alertCount} disease report{alertCount !== 1 ? 's' : ''} in your region
          </Text>
        </View>
      )}

      <ScrollView style={styles.listContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Disease Reports</Text>
          {userLocation && (
            <Text style={styles.locationText}>
              📍 Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#15803d' }]} />
            <Text style={styles.legendText}>Healthy</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#b45309' }]} />
            <Text style={styles.legendText}>Rust</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#7c2d12' }]} />
            <Text style={styles.legendText}>Blight/Mildew</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#1e40af' }]} />
            <Text style={styles.legendText}>Other disease</Text>
          </View>
        </View>

        {/* Report List */}
        {sortedPins.map((pin) => {
          const diseaseInfo = getDiseaseInfo(pin.disease_id);
          const distance = userLocation 
            ? calculateDistance(userLocation.latitude, userLocation.longitude, pin.latitude, pin.longitude)
            : null;
          
          return (
            <TouchableOpacity 
              key={pin.id} 
              style={styles.reportItem}
              onPress={() => handleLocationPress(pin)}
            >
              <View style={styles.reportHeader}>
                <View style={[styles.statusDot, { backgroundColor: markerColor(pin.disease_id) }]} />
                <Text style={styles.diseaseName}>{diseaseInfo.label}</Text>
                <Text style={styles.timeText}>{timeAgo(pin.timestamp)}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.coordsText}>
                  📍 {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                </Text>
                {distance && (
                  <Text style={styles.distanceText}>
                    {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {pins.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No community reports yet</Text>
            <Text style={styles.emptySubtext}>Be the first to report crop conditions!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { color: '#6b7280', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: 'white', fontSize: 14, fontWeight: '600' },
  banner: {
    backgroundColor: '#7c2d12',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContainer: { flex: 1 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  reportItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  diseaseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationInfo: {
    gap: 4,
  },
  coordsText: {
    fontSize: 13,
    color: '#374151',
  },
  distanceText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
