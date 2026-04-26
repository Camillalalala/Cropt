const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const FROM        = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

// Demo subscribers — always receive the alert
const DEMO_SUBSCRIBERS = ['+16264921340'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

async function sendToNumber(creds: string, url: string, to: string, message: string) {
  const body = new URLSearchParams({
    From: `whatsapp:${FROM}`,
    To:   `whatsapp:${to}`,
    Body: message,
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return { ok: res.ok, data: await res.json() };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { to, message } = await req.json();

    const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
    const creds = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

    // Build recipient list: always include demo subscribers, add user-entered number if provided
    const recipients = new Set<string>(DEMO_SUBSCRIBERS);
    if (to && to.trim()) recipients.add(to.trim());

    const results = await Promise.all(
      [...recipients].map((num) => sendToNumber(creds, url, num, message))
    );

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      return new Response(JSON.stringify({ ok: false, errors: failed.map((r) => r.data) }), {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ ok: true, sent: recipients.size }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('send-whatsapp-alert error:', err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
