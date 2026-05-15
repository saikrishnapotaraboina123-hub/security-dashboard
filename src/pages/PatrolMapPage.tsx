import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { fetchPatrolEvents } from '../data/api';
import PatrolMap from '../components/PatrolMap';
import type { PatrolEvent } from '../types';

export default function PatrolMapPage() {
  const [events, setEvents] = useState<PatrolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await fetchPatrolEvents();
      if (mounted) {
        setEvents(data);
        setLoading(false);
      }
    }

    load();

    // =========================
    // REALTIME SUBSCRIPTION
    // =========================
    const channel = supabase
      .channel('patrol_map_live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patrol_logs',
        },
        async () => {
          const updated = await fetchPatrolEvents();
          if (mounted) setEvents(updated);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <div className="text-white p-6">
        Loading live patrol map...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">

      <h1 className="text-xl font-bold text-white">
        🗺️ Live Patrol Map (Real-Time)
      </h1>

      {/* =========================
          STATS BAR
      ========================= */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Total Devices</p>
          <p className="text-white text-2xl font-bold">
            {events.length}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Active Now</p>
          <p className="text-green-400 text-2xl font-bold">
            {events.filter(e => e.status === 'active').length}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Offline</p>
          <p className="text-red-400 text-2xl font-bold">
            {events.filter(e => e.status === 'offline').length}
          </p>
        </div>

      </div>

      {/* =========================
          MAP
      ========================= */}
      <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">

        <PatrolMap events={events} />

      </div>

      {/* =========================
          LIVE FEED TABLE
      ========================= */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

        <table className="w-full text-sm">

          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="p-3 text-left">Device</th>
              <th className="p-3 text-left">MAC</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">RSSI</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>

          <tbody>

            {events.map((e) => (
              <tr key={e.id} className="border-b border-gray-800">

                <td className="p-3 text-white">
                  {e.device_name}
                </td>

                <td className="p-3 text-gray-400 font-mono">
                  {e.mac_address}
                </td>

                <td className="p-3 text-gray-300">
                  {e.esp32_location}
                </td>

                <td className="p-3 text-gray-400">
                  {e.rssi}
                </td>

                <td className="p-3 text-gray-500">
                  {new Date(e.created_at).toLocaleTimeString()}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
