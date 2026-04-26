import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ScanRecord = {
  id?: number;
  disease_id?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
};

type NearbyDevice = {
  push_token: string;
  distance_m: number;
};

type Severity = 'low' | 'moderate' | 'high' | 'critical';

const SEVERITY: Record<string, Severity> = {
  healthy: 'low',
  leaf_rust: 'moderate', stripe_rust: 'moderate',
  powdery_mildew_wheat: 'moderate', coffee_rust: 'moderate', downy_mildew: 'moderate',
  gray_leaf_spot_corn: 'high', blight: 'high', early_blight: 'high',
  anthracnose: 'high', fire_blight: 'high',
  stem_rust: 'critical', late_blight: 'critical',
  fusarium_wilt: 'critical', rice_blast: 'critical',
};

const SEVERITY_EMOJI: Record<Severity, string> = {
  low: '🟢', moderate: '🟡', high: '🟠', critical: '🔴',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function diseaseLabel(id: string): string {
  const MAP: Record<string, string> = {
    leaf_rust: 'Leaf Rust', stem_rust: 'Stem Rust', stripe_rust: 'Stripe Rust',
    blight: 'Blight', late_blight: 'Late Blight', early_blight: 'Early Blight',
    powdery_mildew_wheat: 'Powdery Mildew', rice_blast: 'Rice Blast',
    gray_leaf_spot_corn: 'Gray Leaf Spot', anthracnose: 'Anthracnose',
    fire_blight: 'Fire Blight', fusarium_wilt: 'Fusarium Wilt',
    coffee_rust: 'Coffee Rust', downy_mildew: 'Downy Mildew',
    healthy: 'Healthy Leaf',
  };
  return MAP[id] ?? id.replace(/_/g, ' ');
}

Deno.serve(async (req: Request) => {
  try {
    const body = (await req.json()) as { record?: ScanRecord };
    const record = body.record ?? {};

    const diseaseId = record.disease_id ?? 'unknown';
    const severity = SEVERITY[diseaseId] ?? 'moderate';

    // Only notify for high or critical severity diseases
    if (severity === 'low' || severity === 'moderate') {
      return new Response(JSON.stringify({ ok: true, skipped: true, severity }), { status: 200 });
    }

    const lat = record.latitude ?? 0;
    const lng = record.longitude ?? 0;

    // Find devices within 50 km of the new scan
    const { data: devices, error } = await supabase.rpc('get_devices_near', {
      scan_lat: lat,
      scan_lng: lng,
      radius_m: 50000,
    });

    if (error) {
      console.error('get_devices_near error:', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    const nearby = (devices ?? []) as NearbyDevice[];
    if (nearby.length === 0) {
      return new Response(JSON.stringify({ ok: true, notified: 0 }), { status: 200 });
    }

    const label = diseaseLabel(diseaseId);
    const emoji = SEVERITY_EMOJI[severity];
    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);

    const messages = nearby.map((d) => ({
      to: d.push_token,
      title: `${emoji} ${severityLabel} Disease Alert Nearby`,
      body: `${label} detected ${Math.round(d.distance_m / 1000 * 10) / 10} km away. Inspect your crops immediately.`,
      data: { diseaseId, severity, lat, lng },
      sound: 'default',
      priority: severity === 'critical' ? 'high' : 'normal',
    }));

    // Expo Push Service (works in Expo Go without APNs/FCM creds)
    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    const pushData = await pushRes.json();
    console.log('Push result:', JSON.stringify(pushData));

    return new Response(
      JSON.stringify({ ok: true, notified: messages.length, push: pushData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('new-scan-alert error:', err);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
