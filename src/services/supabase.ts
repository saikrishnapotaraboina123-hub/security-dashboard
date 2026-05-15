import { createClient } from '@supabase/supabase-js';
import type { SecurityGuard } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export async function fetchGuards(): Promise<SecurityGuard[]> {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addGuard(guard: SecurityGuard) {
  const { error } = await supabase.from('guards').insert([guard]);
  if (error) throw error;
}

export async function updateGuard(guard: SecurityGuard) {
  const { error } = await supabase
    .from('guards')
    .update({
      name: guard.name,
      mac_address: guard.mac_address,
      mobile_number: guard.mobile_number,
    })
    .eq('id', guard.id);
  if (error) throw error;
}

export async function deleteGuard(id: string) {
  const { error } = await supabase.from('guards').delete().eq('id', id);
  if (error) throw error;
}

export default supabase;
