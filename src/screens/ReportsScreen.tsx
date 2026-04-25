import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getReports } from '../db/database';
import type { LocalReport } from '../types/report';

export function ReportsScreen() {
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const localReports = await getReports();
      setReports(localReports);
    } catch (error) {
      console.error('Failed to load local reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Local Reports</Text>
      {isLoading ? (
        <Text style={styles.stateText}>Loading...</Text>
      ) : reports.length === 0 ? (
        <Text style={styles.stateText}>No local reports yet. Run a mock scan first.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.reportCard}>
              <Text style={styles.reportTitle}>Disease: {item.disease_id}</Text>
              <Text style={styles.reportDate}>
                Time: {new Date(item.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.reportMeta}>
                Lat/Lon: {item.lat.toFixed(4)}, {item.long.toFixed(4)}
              </Text>
              <Text style={styles.reportMeta}>
                Synced: {item.is_synced === 1 ? 'Yes' : 'No'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f7fb',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  stateText: {
    color: '#4b5563',
    fontSize: 16,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 12,
    gap: 10,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reportDate: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  reportMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
});
