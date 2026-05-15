import { createClient } from '@supabase/supabase-js';

import type {
  PatrolEvent,
  AttendanceRecord,
  SecurityGuard,
} from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

/* -------------------- PATROL EVENTS -------------------- */

export async function fetchLatestEvents(
  limit = 20
): Promise<PatrolEvent[]> {
  const { data, error } = await supabase
    .from('patrol_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/* -------------------- ATTENDANCE -------------------- */

export async function fetchTodayAttendance(): Promise<
  AttendanceRecord[]
> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('clock_in', today);

  if (error) throw error;
  return data ?? [];
}

/* -------------------- GUARDS (NEW 🔥) -------------------- */

// GET ALL GUARDS
export async function fetchGuards(): Promise<
  SecurityGuard[]
> {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ADD GUARD
export async function addGuard(
  guard: SecurityGuard
) {
  const { error } = await supabase
    .from('guards')
    .insert([guard]);

  if (error) throw error;
}

// UPDATE GUARD
export async function updateGuard(
  guard: SecurityGuard
) {
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

// DELETE GUARD
export async function deleteGuard(id: string) {
  const { error } = await supabase
    .from('guards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export default supabase;
