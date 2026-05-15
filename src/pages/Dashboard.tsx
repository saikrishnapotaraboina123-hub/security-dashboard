import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import {
  Shield, Activity, Radio, Tag, Clock,
  Download, MapPin, RefreshCw, Filter, ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatrolEvent {
  id: number;
  received_at: string;
  timestamp_utc: string;
  anchor_id: string;
  tag_id: string;
  rssi: number;
  battery: number | null;
  lat: number | null;
  lon: number | null;
}

interface Anchor {
  id: string;
  name: string;
  lat: number | null;
  lon: number | null;
  event_count?: number;
}

interface TagItem {
  id: string;
  name: string | null;
  event_count?: number;
}

type GuardStatus = 'active' | 'delayed' | 'offline';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatus(timestampUtc: string): GuardStatus {
  const mins = (Date.now() - new Date(timestampUtc).getTime()) / 60000;
  if (mins < 10) return 'active';
  if (mins < 30) return 'delayed';
  return 'offline';
}

function getRSSIColor(rssi: number) {
  if (rssi >= -50) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  if (rssi >= -65) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
  if (rssi >= -80) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
}

function formatTime(iso: string) {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Live shift + clock shown in page header */
function LiveShiftBadge() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const shift =
    h >= 6 && h < 14  ? 'Morning Patrol'    :
    h >= 14 && h < 22 ? 'Afternoon Patrol'   :
                        'Night Patrol';
  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        {shift}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono tabular-nums">
        {now.toLocaleTimeString()}
      </span>
    </div>
  );
}

/** 🟢 / 🟡 / 🔴 status pill */
function StatusBadge({ status }: { status: GuardStatus }) {
  const map: Record<GuardStatus, { label: string; cls: string }> = {
    active:  { label: '🟢 Active',  cls: 'bg-green-500/10 text-green-400 border-green-500/20'   },
    delayed: { label: '🟡 Delayed', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    offline: { label: '🔴 Offline', cls: 'bg-red-500/10 text-red-400 border-red-500/20'         },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

/** Animated skeleton row while loading */
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={cols} className="px-6 py-4">
            <div className="animate-pulse flex gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [events, setEvents]               = useState<PatrolEvent[]>([]);
  const [anchors, setAnchors]             = useState<Anchor[]>([]);
  const [tags, setTags]                   = useState<TagItem[]>([]);
  const [totalCount, setTotalCount]       = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filterTag, setFilterTag]         = useState('');
  const [filterAnchor, setFilterAnchor]   = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [lastRefresh, setLastRefresh]     = useState(new Date());

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterTag)    params.append('tag_id',    filterTag);
      if (filterAnchor) params.append('anchor_id', filterAnchor);

      const [eventsRes, anchorsRes, tagsRes, countRes] = await Promise.all([
        fetch(`/api/events?${params.toString()}`),
        fetch('/api/anchors'),
        fetch('/api/tags'),
        fetch('/api/events/count'),
      ]);

      const [eventsData, anchorsData, tagsData, countData] = await Promise.all([
        eventsRes.json(),
        anchorsRes.json(),
        tagsRes.json(),
        countRes.json(),
      ]);

      setEvents(eventsData   || []);
      setAnchors(anchorsData || []);
      setTags(tagsData       || []);
      setTotalCount(countData?.count || 0);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTag, filterAnchor]);

  // Initial load + filter changes
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let url = '/api/export/csv';
    const params = new URLSearchParams();
    if (filterTag)    params.append('tag_id',    filterTag);
    if (filterAnchor) params.append('anchor_id', filterAnchor);
    if (params.toString()) url += '?' + params.toString();
    window.open(url, '_blank');
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const avgRSSI = events.length > 0
    ? Math.round(events.reduce((sum, e) => sum + e.rssi, 0) / events.length)
    : 0;

  const activeCount  = events.filter(e => getStatus(e.timestamp_utc) === 'active').length;
  const delayedCount = events.filter(e => getStatus(e.timestamp_utc) === 'delayed').length;
  const offlineCount = events.filter(e => getStatus(e.timestamp_utc) === 'offline').length;

  const getLastSeenForAnchor = (anchorId: string) =>
    events
      .filter(e => e.anchor_id === anchorId)
      .sort((a, b) => new Date(b.timestamp_utc).getTime() - new Date(a.timestamp_utc).getTime())
      .slice(0, 5);

  const guardName = (tagId: string) =>
    tags.find(t => t.id === tagId)?.name ?? null;

  // ── Stats cards config ────────────────────────────────────────────────────
  const stats = [
    { icon: Activity, label: 'Total Patrol Events', value: totalCount.toLocaleString(), color: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20'     },
    { icon: Radio,    label: 'Active Checkpoints',  value: anchors.length.toString(),   color: 'from-green-500 to-green-600',   bg: 'bg-green-50 dark:bg-green-900/20'   },
    { icon: Tag,      label: 'Guards on Duty',      value: tags.length.toString(),      color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: Clock,    label: 'Avg Signal (RSSI)',   value: `${avgRSSI} dBm`,           color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          {/* Title + shift badge */}
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20 shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time patrol monitoring system</p>
              <LiveShiftBadge />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-xs text-gray-400 tabular-nums">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Status summary strip ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
          🟢 Active — {activeCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
          🟡 Delayed — {delayedCount}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
          🔴 Offline — {offlineCount}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Auto-refreshing every 5s
        </span>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${stat.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-800`}
          >
            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {events.length} of {totalCount.toLocaleString()} events
          </span>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex flex-wrap gap-4"
          >
            {/* Guard filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Guard / Tag</label>
              <select
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">All Guards</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name ? `${t.name} (${t.id})` : t.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkpoint filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Checkpoint / Anchor</label>
              <select
                value={filterAnchor}
                onChange={e => setFilterAnchor(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">All Checkpoints</option>
                {anchors.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setFilterTag(''); setFilterAnchor(''); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-orange-500 underline transition-colors"
              >
                Clear filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Events table ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Table header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Recent Patrol Events
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp (UTC)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkpoint</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <SkeletonRows cols={7} />
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Shield className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No patrol events found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {filterTag || filterAnchor
                        ? 'Try clearing your filters above'
                        : 'Connect ESP32 anchors or run the seed script'}
                    </p>
                  </td>
                </tr>
              ) : (
                events.map(event => {
                  const name   = guardName(event.tag_id);
                  const status = getStatus(event.timestamp_utc);
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatTime(event.timestamp_utc)}
                      </td>

                      {/* Checkpoint */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          {anchors.find(a => a.id === event.anchor_id)?.name
                            || event.anchor_id.substring(0, 12)}
                        </span>
                      </td>

                      {/* Guard name + tag ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {name || 'Unknown Guard'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{event.tag_id}</div>
                      </td>

                      {/* RSSI */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getRSSIColor(event.rssi)}`}>
                          {event.rssi} dBm
                        </span>
                      </td>

                      {/* Battery */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {event.battery !== null ? (
                          <span className={event.battery < 20 ? 'text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                            {event.battery}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {event.lat && event.lon
                          ? `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}`
                          : '--'}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Checkpoint activity grid ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Checkpoint Activity
          </h2>
        </div>

        <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anchors.filter(a => a.lat && a.lon).length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
              <p>No checkpoint locations configured yet</p>
            </div>
          ) : (
            anchors.filter(a => a.lat && a.lon).map(anchor => {
              const recentEvents = getLastSeenForAnchor(anchor.id);
              const lastStatus   = recentEvents.length > 0
                ? getStatus(recentEvents[0].timestamp_utc)
                : 'offline';
              const dotColor =
                lastStatus === 'active'  ? 'bg-green-400'  :
                lastStatus === 'delayed' ? 'bg-yellow-400' :
                                          'bg-red-400';

              return (
                <div
                  key={anchor.id}
                  className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-400/50 dark:hover:border-orange-500/40 transition-all duration-200"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 group-hover:from-orange-500/5 group-hover:to-blue-500/5 transition-colors duration-200" />

                  <div className="relative p-4">
                    {/* Anchor header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{anchor.name}</h3>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{anchor.id}</p>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* Anchor details */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Coordinates</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {anchor.lat?.toFixed(4) ?? '--'}, {anchor.lon?.toFixed(4) ?? '--'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Total Scans</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {(anchor.event_count || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Last Status</span>
                        <StatusBadge status={lastStatus} />
                      </div>
                    </div>

                    {/* Recent guard scans */}
                    {recentEvents.length > 0 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Recent guard scans:</p>
                        {recentEvents.slice(0, 3).map((e, i) => {
                          const name = guardName(e.tag_id);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs py-1 gap-2">
                              <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                                {name || e.tag_id}
                              </span>
                              <span className="text-gray-400 shrink-0">
                                {formatTime(e.timestamp_utc)} · {e.rssi} dBm
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

    </div>
  );
}
