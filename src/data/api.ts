import { supabase } from '../services/supabase';

import type {
  SecurityGuard,
  PatrolEvent,
} from '../types';

// =======================================
// FETCH GUARDS
// =======================================
export async function fetchGuards(): Promise<SecurityGuard[]> {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching guards:', error);
    return [];
  }

  return data || [];
}

// =======================================
// FETCH PATROL EVENTS (FIXED + SAFE)
// =======================================
export async function fetchPatrolEvents(): Promise<PatrolEvent[]> {
  const { data, error } = await supabase
    .from('patrol_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching patrol events:', error);
    return [];
  }

  // ✅ SAFE MAPPING (THIS FIXES YOUR ERRORS)
  return (data || []).map((item: any) => ({
    id: item.id,

    guardName: item.guard_name ?? item.guardName ?? 'Unknown',
    guardId: item.guard_id ?? item.guardId ?? 'N/A',

    checkpoint: item.checkpoint ?? 'Unknown',

    time: item.created_at ?? item.time ?? '',

    rssi: item.rssi ?? 0,

    status: item.status ?? 'offline',
  }));
}
