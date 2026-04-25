import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDiseaseInfo } from '../data/diseaseLookup';
import { getReports } from '../db/database';
import type { LocalReport } from '../types/report';

export function FarmerReportsScreen() {
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

  const getDiseaseColor = (diseaseId: string) => {
    if (diseaseId === 'healthy') return '#15803d';
    if (diseaseId.includes('rust')) return '#b45309';
    if (diseaseId.includes('blight') || diseaseId.includes('mildew')) return '#7c2d12';
    return '#1e40af';
  };

  const getDiseaseIcon = (diseaseId: string) => {
    if (diseaseId === 'healthy') return 'check-circle';
    if (diseaseId.includes('rust')) return 'alert';
    if (diseaseId.includes('blight') || diseaseId.includes('mildew')) return 'warning';
    return 'help-circle';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📋 My Reports</Text>
          <Text style={styles.subtitle}>Your crop health history</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadReports}>
          <Ionicons name="refresh" size={24} color="#166534" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <Ionicons name="hourglass" size={48} color="#9ca3af" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptySubtitle}>Take your first crop photo to see results here</Text>
          <View style={styles.helpSteps}>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>1️⃣</Text>
              <Text style={styles.stepText}>📸 Take crop photo</Text>
            </View>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>2️⃣</Text>
              <Text style={styles.stepText}>🔍 Analyze health</Text>
            </View>
            <View style={styles.helpStep}>
              <Text style={styles.stepNumber}>3️⃣</Text>
              <Text style={styles.stepText}>💊 Get treatment</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const disease = getDiseaseInfo(item.disease_id);
            const diseaseColor = getDiseaseColor(item.disease_id);
            const diseaseIcon = getDiseaseIcon(item.disease_id);
            
            return (
              <View style={styles.reportCard}>
                {item.image_uri ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image_uri }} style={styles.reportImage} />
                    <View style={[styles.diseaseBadge, { backgroundColor: diseaseColor }]}>
                      <Ionicons name={diseaseIcon as any} size={16} color="#ffffff" />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.noImagePlaceholder, { backgroundColor: diseaseColor + '20' }]}>
                    <Ionicons name={diseaseIcon as any} size={48} color={diseaseColor} />
                    <Text style={styles.noImageText}>No Photo</Text>
                  </View>
                )}
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleSection}>
                      <Text style={styles.diseaseName}>{disease.label}</Text>
                      <Text style={styles.cropType}>
                        {item.sample_label || 'Manual entry'}
                      </Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {(item.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <View style={[styles.syncStatus, item.is_synced === 1 ? styles.synced : styles.pending]}>
                      <Ionicons 
                        name={item.is_synced === 1 ? "checkmark-circle" : "time"} 
                        size={14} 
                        color={item.is_synced === 1 ? "#166534" : "#92400e"} 
                      />
                      <Text style={[styles.statusText, item.is_synced === 1 ? styles.syncedText : styles.pendingText]}>
                        {item.is_synced === 1 ? 'Synced' : 'Saved on Phone'}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#6b7280" />
                    <Text style={styles.locationText}>
                      {item.lat.toFixed(4)}, {item.long.toFixed(4)}
                    </Text>
                  </View>
                  
                  {item.user_text.trim() ? (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>📝 Notes:</Text>
                      <Text style={styles.notesText}>{item.user_text}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noNotes}>No additional notes</Text>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#166534',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#dcfce7',
  },
  refreshButton: {
    backgroundColor: '#ffffff20',
    padding: 8,
    borderRadius: 20,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpSteps: {
    gap: 12,
    marginTop: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 18,
    minWidth: 30,
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  reportImage: {
    width: '100%',
    height: 180,
  },
  diseaseBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  noImagePlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cropType: {
    fontSize: 14,
    color: '#6b7280',
  },
  confidenceBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#166534',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  synced: {
    backgroundColor: '#dcfce7',
  },
  pending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  syncedText: {
    color: '#166534',
  },
  pendingText: {
    color: '#92400e',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6b7280',
  },
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  notesText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  noNotes: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
