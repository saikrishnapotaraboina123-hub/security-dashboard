import { useEffect, useState } from 'react';
import { mockEvents } from '../data/mockData';
import StatusBadge from './StatusBadge';
import type { PatrolEvent } from '../types';

export default function LiveEventsTable() {
  const [events, setEvents] = useState<PatrolEvent[]>(mockEvents);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => {
        setEvents(prev => [...prev].reverse()); // simulate update
        setPulse(false);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="font-semibold text-white">Live Patrol Events</h2>
          <p className="text-xs text-gray-500 mt-0.5">Auto-refreshes every 5s</p>
        </div>
        <div className="flex items-center gap-2">
          {pulse && <span className="text-xs text-orange-400 animate-pulse">Updating…</span>}
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800 bg-gray-900/80">
              <th className="px-5 py-3 text-left">Guard ID</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Checkpoint</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">RSSI</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-400">{e.guardId}</td>
                <td className="px-5 py-3 text-white font-medium">{e.guardName}</td>
                <td className="px-5 py-3 text-gray-300">{e.checkpoint}</td>
                <td className="px-5 py-3 font-mono text-gray-400">{e.time}</td>
                <td className={`px-5 py-3 font-mono text-xs ${
                  e.rssi > -70 ? 'text-green-400' : e.rssi > -80 ? 'text-yellow-400' : 'text-red-400'
                }`}>{e.rssi} dBm</td>
                <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
