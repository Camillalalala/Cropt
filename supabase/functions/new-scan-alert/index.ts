import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type ScanPayload = {
  id?: string | number;
  local_id?: number;
  disease_id?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
};

serve(async (req) => {
  try {
    const body = (await req.json()) as { record?: ScanPayload };
    const record = body.record ?? {};

    const whatsappMessage = [
      '[Mock WhatsApp Alert]',
      `New scan received`,
      `disease_id=${record.disease_id ?? 'unknown'}`,
      `timestamp=${record.timestamp ?? 'unknown'}`,
      `lat=${record.latitude ?? 0}, long=${record.longitude ?? 0}`,
    ].join(' | ');

    console.log(whatsappMessage);

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Mock WhatsApp notification logged.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('new-scan-alert function error', error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
