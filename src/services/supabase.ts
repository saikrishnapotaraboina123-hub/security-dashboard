import { createClient } from '@supabase/supabase-js';
import type { PatrolEvent, AttendanceRecord } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export async function fetchLatestEvents(limit = 20): Promise<PatrolEvent[]> {
  const { data, error } = await supabase
    .from('patrol_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .gte('clock_in', today);
  if (error) throw error;
  return data ?? [];
}

export default supabase;