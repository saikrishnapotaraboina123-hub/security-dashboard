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

  useEffect(() => {
    let mounted = true;

    // =========================
    // INITIAL LOAD
    // =========================
    async function loadEvents() {
      try {
        const data = await fetchPatrolEvents();
        if (mounted) setEvents(data);
      } catch (error) {
        console.error('Failed to load patrol events:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEvents();

    // =========================
    // REAL-TIME SUBSCRIPTION
    // =========================
    const channel = supabase
      .channel('patrol_logs_realtime')
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

    // cleanup
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // SAFE CHECKPOINT LIST
  // =========================
  const checkpoints = Array.from(
    new Set(events.map((e) => e.checkpoint).filter(Boolean))
  );

  // =========================
  // FILTERING
  // =========================
  const filtered = events.filter((e) => {
    const guardName = e.guardName ?? '';
    const guardId = e.guardId ?? '';
    const checkpoint = e.checkpoint ?? '';
    const status = e.status ?? '';

    const matchSearch =
      search === '' ||
      guardName.toLowerCase().includes(search.toLowerCase()) ||
      guardId.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === 'all' || status === filterStatus;

    const matchCP =
      filterCheckpoint === 'all' || checkpoint === filterCheckpoint;

    return matchSearch && matchStatus && matchCP;
  });

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">
        Patrol History (Live)
      </h1>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">

        <input
          type="text"
          placeholder="Search guard name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-4 py-2 w-64 focus:outline-none focus:border-orange-500 placeholder-gray-600"
        />

        <select
          value={filterStatus}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="delayed">Delayed</option>
          <option value="offline">Offline</option>
        </select>

        <select
          value={filterCheckpoint}
          onChange={(e) => setCP(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        >
          <option value="all">All checkpoints</option>
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
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
              <th className="px-5 py-3 text-left">Guard</th>
              <th className="px-5 py-3 text-left">Checkpoint</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">RSSI</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/60">

            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  Loading patrol history...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-600">
                  No events match your filters
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-800/50">

                  <td className="px-5 py-3">
                    <div className="text-white font-medium">
                      {e.guardName}
                    </div>
                    <div className="text-gray-600 text-xs font-mono">
                      {e.guardId}
                    </div>
                  </td>

                  <td className="px-5 py-3 text-gray-300">
                    {e.checkpoint}
                  </td>

                  <td className="px-5 py-3 text-gray-400 font-mono">
                    {e.time}
                  </td>

                  <td className="px-5 py-3 font-mono text-xs text-gray-400">
                    {e.rssi} dBm
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={e.status} />
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
