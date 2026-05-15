import { createClient } from '@supabase/supabase-js';

import type {
  SecurityGuard,
} from '../types';

// ========================================
// ENV VARIABLES
// ========================================
const supabaseUrl =
  import.meta.env
    .VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env
    .VITE_SUPABASE_ANON_KEY;

// ========================================
// VALIDATION
// ========================================
if (!supabaseUrl) {

  throw new Error(
    'Missing VITE_SUPABASE_URL'
  );
}

if (!supabaseAnonKey) {

  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY'
  );
}

// ========================================
// CREATE CLIENT
// ========================================
export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey,

    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },

      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

// ========================================
// FETCH ALL GUARDS
// ========================================
export async function fetchGuards():
Promise<SecurityGuard[]> {

  const {
    data,
    error
  } = await supabase

    .from('guards')

    .select('*')

    .order('id', {
      ascending: true
    });

  if (error) {

    console.error(
      'Fetch Guards Error:',
      error
    );

    throw error;
  }

  return data ?? [];
}

// ========================================
// ADD NEW GUARD
// ========================================
export async function addGuard(
  guard: SecurityGuard
) {

  const {
    error
  } = await supabase

    .from('guards')

    .insert([
      {
        id: guard.id,
        name: guard.name,
        mac_address:
          guard.mac_address,
        mobile_number:
          guard.mobile_number,
      }
    ]);

  if (error) {

    console.error(
      'Add Guard Error:',
      error
    );

    throw error;
  }
}

// ========================================
// UPDATE GUARD
// ========================================
export async function updateGuard(
  guard: SecurityGuard
) {

  const {
    error
  } = await supabase

    .from('guards')

    .update({

      name: guard.name,

      mac_address:
        guard.mac_address,

      mobile_number:
        guard.mobile_number,
    })

    .eq('id', guard.id);

  if (error) {

    console.error(
      'Update Guard Error:',
      error
    );

    throw error;
  }
}

// ========================================
// DELETE GUARD
// ========================================
export async function deleteGuard(
  id: string
) {

  const {
    error
  } = await supabase

    .from('guards')

    .delete()

    .eq('id', id);

  if (error) {

    console.error(
      'Delete Guard Error:',
      error
    );

    throw error;
  }
}

// ========================================
// FETCH PATROL LOGS
// ========================================
export async function fetchPatrolLogs() {

  const {
    data,
    error
  } = await supabase

    .from('patrol_logs')

    .select('*')

    .order('created_at', {
      ascending: false
    });

  if (error) {

    console.error(
      'Fetch Patrol Logs Error:',
      error
    );

    throw error;
  }

  return data ?? [];
}

// ========================================
// REALTIME SUBSCRIPTION
// ========================================
export function subscribeToPatrolLogs(
  callback: (payload: any) => void
) {

  const channel = supabase

    .channel('patrol-realtime')

    .on(
      'postgres_changes',

      {
        event: 'INSERT',
        schema: 'public',
        table: 'patrol_logs',
      },

      (payload) => {

        console.log(
          'Realtime Patrol Log:',
          payload
        );

        callback(payload);
      }
    )

    .subscribe();

  return channel;
}

// ========================================
// REMOVE SUBSCRIPTION
// ========================================
export function unsubscribeChannel(
  channel: any
) {

  supabase.removeChannel(channel);
}

// ========================================
// EXPORT CLIENT
// ========================================
export default supabase;
