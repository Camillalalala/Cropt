import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function sendWhatsAppAlert(to: string, message: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-whatsapp-alert', {
    body: { to, message },
  });
  if (error) throw error;
}
