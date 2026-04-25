import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
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

const LA_DEFAULT = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

export function WebMapScreen() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pins, setPins] = useState<ScanPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

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

  const generateMapHTML = (pinsData: ScanPin[], userLoc?: { latitude: number; longitude: number }) => {
    const markers = pinsData.map(pin => ({
      lat: pin.latitude,
      lng: pin.longitude,
      disease: pin.disease_id,
      time: pin.timestamp,
      id: pin.id
    }));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .custom-marker {
            background: #ff4444;
            border: 2px solid white;
            border-radius: 50%;
            width: 12px;
            height: 12px;
          }
          .popup-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([34.0522, -118.2437], 10);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add user location if available
          ${userLoc ? `
            L.marker([${userLoc.latitude}, ${userLoc.longitude}], {
              icon: L.divIcon({
                className: 'user-location',
                html: '<div style="background: #4285F4; border: 2px solid white; border-radius: 50%; width: 16px; height: 16px;"></div>',
                iconSize: [16, 16]
              })
            }).addTo(map).bindPopup('Your Location');
          ` : ''}

          // Add disease markers
          const markers = ${JSON.stringify(markers)};
          markers.forEach(marker => {
            const color = marker.disease === 'healthy' ? '#15803d' : 
                         marker.disease.includes('rust') ? '#b45309' :
                         marker.disease.includes('blight') || marker.disease.includes('mildew') ? '#7c2d12' : '#1e40af';
            
            L.marker([marker.lat, marker.lng], {
              icon: L.divIcon({
                className: 'disease-marker',
                html: \`<div style="background: \${color}; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>\`,
                iconSize: [12, 12]
              })
            }).addTo(map)
            .bindPopup(\`
              <div class="popup-content">
                <strong>\${marker.disease}</strong><br>
                <small>\${new Date(marker.time).toLocaleString()}</small>
              </div>
            \`);
          });

          // Fit map to show all markers
          if (markers.length > 0) {
            const group = new L.featureGroup(markers.map(m => 
              L.marker([m.lat, m.lng])
            ));
            map.fitBounds(group.getBounds().pad(0.1));
          }

          // Send location updates to React Native
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'map_click',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Map message:', data);
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
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

  return (
    <View style={styles.container}>
      {alertCount > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {alertCount} disease report{alertCount !== 1 ? 's' : ''} in your region
          </Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML(pins, userLocation) }}
        style={styles.map}
        onLoad={() => setLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#166534" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      />
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
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  map: { flex: 1 },
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
});
