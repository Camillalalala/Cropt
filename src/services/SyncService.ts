import * as Network from 'expo-network';
import { createClient } from '@supabase/supabase-js';
import { getUnsyncedReports, markReportSynced } from '../db/database';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  validateSupabaseConfig,
} from '../config/supabase';
import type { LocalReport } from '../types/report';

type SyncResult = {
  isOnline: boolean;
  totalPending: number;
  syncedCount: number;
  failedCount: number;
  message: string;
  lastError?: string;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function mapReportToSupabasePayload(report: LocalReport) {
  return {
    local_id: report.id,
    disease_id: report.disease_id,
    timestamp: report.timestamp,
    latitude: report.lat,
    longitude: report.long,
    is_synced: true,
  };
}

export async function syncPendingReports(): Promise<SyncResult> {
  const networkState = await Network.getNetworkStateAsync();
  const isOnline = Boolean(networkState.isConnected && networkState.isInternetReachable);

  if (!isOnline) {
    return {
      isOnline: false,
      totalPending: 0,
      syncedCount: 0,
      failedCount: 0,
      message: 'Device is offline. Sync postponed.',
    };
  }

  const configStatus = validateSupabaseConfig();
  if (!configStatus.ok) {
    return {
      isOnline: true,
      totalPending: 0,
      syncedCount: 0,
      failedCount: 0,
      message: `Supabase config missing: ${configStatus.reason}`,
    };
  }

  const pendingReports = await getUnsyncedReports();
  if (pendingReports.length === 0) {
    return {
      isOnline: true,
      totalPending: 0,
      syncedCount: 0,
      failedCount: 0,
      message: 'No pending local reports to sync.',
    };
  }

  let syncedCount = 0;
  let failedCount = 0;
  let lastError: string | undefined;

  for (const report of pendingReports) {
    const payload = mapReportToSupabasePayload(report);
    const { error } = await supabase.from('scan_reports').insert(payload);

    if (error) {
      failedCount += 1;
      lastError = error.message;
      console.error(`Failed to sync report ${report.id}:`, error.message);
      continue;
    }

    await markReportSynced(report.id);
    syncedCount += 1;
  }

  return {
    isOnline: true,
    totalPending: pendingReports.length,
    syncedCount,
    failedCount,
    message: `Synced ${syncedCount}/${pendingReports.length} reports.`,
    lastError,
  };
}
