import { supabase } from '../services/supabase';
import type { Guard, PatrolEvent } from '../types';

// =======================================
// FETCH GUARDS
// =======================================
export async function fetchGuards(): Promise<Guard[]> {

  const { data, error } = await supabase
    .from('guards')
    .select('*');

  if (error) {

    console.error('Error fetching guards:', error);

    return [];
  }

  return data.map((guard: any) => ({
    id: guard.id,
    name: guard.name,
    status: 'active',
    checkpoint: 'Unknown',
    lastSeen: 'Just now'
  }));
}

// =======================================
// FETCH PATROL EVENTS
// =======================================
export async function fetchPatrolEvents(): Promise<PatrolEvent[]> {

  const { data, error } = await supabase
    .from('patrol_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {

    console.error(
      'Error fetching patrol events:',
      error
    );

    return [];
  }

  return data.map((event: any, index: number) => ({
    id: event.id || `event-${index}`,
    guardId: event.mac_address,
    guardName: event.device_name || 'Unknown',
    checkpoint: event.esp32_location || 'Unknown',
    time: new Date(
      event.created_at
    ).toLocaleTimeString(),

    rssi: event.rssi,

    status:
      event.rssi > -70
        ? 'active'
        : event.rssi > -85
        ? 'delayed'
        : 'offline'
  }));
}
