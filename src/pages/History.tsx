import { useEffect, useState } from 'react';

import { supabase } from '../services/supabase';
import { fetchPatrolEvents } from '../data/api';
import StatusBadge from '../components/StatusBadge';
import type { PatrolEvent } from '../types';

export default function History() {
  const [events, setEvents] = useState<PatrolEvent[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setStatus] = useState('all');
  const [filterCheckpoint, setCP] = useState('all');
  const [loading, setLoading] = useState(true);

  // =========================
  // SMART STATUS ENGINE
  // =========================
  function getSmartStatus(event: PatrolEvent): string {
    const now = new Date().getTime();
    const eventTime = new Date(event.created_at).getTime();

    const diffMinutes = (now - eventTime) / (1000 * 60);

    if (diffMinutes > 5) return 'offline';
    if (diffMinutes > 2) return 'delayed';
    return 'active';
  }

  // =========================
  // LOAD + REALTIME
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

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('patrol_logs_live')
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
  // CHECKPOINT LIST
  // =========================
  const checkpoints = Array.from(
    new Set(events.map((e) => e.esp32_location).filter(Boolean))
  );

  // =========================
  // FILTERING
  // =========================
  const filtered = events.filter((e) => {
    const matchSearch =
      search === '' ||
      e.device_name.toLowerCase().includes(search.toLowerCase()) ||
      e.mac_address.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === 'all' || getSmartStatus(e) === filterStatus;

    const matchCP =
      filterCheckpoint === 'all' || e.esp32_location === filterCheckpoint;

    return matchSearch && matchStatus && matchCP;
  });

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">

      <h1 className="text-xl font-bold text-white">
        Patrol History (Live Smart System)
      </h1>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">

        <input
          type="text"
          placeholder="Search device or MAC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2 w-64"
        />

        <select
          value={filterStatus}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="delayed">Delayed</option>
          <option value="offline">Offline</option>
        </select>

        <select
          value={filterCheckpoint}
          onChange={(e) => setCP(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="all">All Locations</option>
          {checkpoints.map((cp) => (
            <option key={cp} value={cp}>
              {cp}
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

        <table className="w-full text-sm">

          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="p-3 text-left">Device</th>
              <th className="p-3 text-left">MAC</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">RSSI</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
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
                    {e.created_at}
                  </td>

                  <td className="p-3 text-gray-400">
                    {e.rssi} dBm
                  </td>

                  <td className="p-3">
                    <StatusBadge status={getSmartStatus(e)} />
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
