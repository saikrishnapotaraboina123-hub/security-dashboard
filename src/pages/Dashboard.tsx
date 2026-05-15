import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { Shield, Activity, Radio, Tag, Clock, Download, MapPin, RefreshCw, Filter, ChevronDown } from 'lucide-react';

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

export default function Dashboard() {
  const [events, setEvents] = useState<PatrolEvent[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('');
  const [filterAnchor, setFilterAnchor] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterTag) params.append('tag_id', filterTag);
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
      
      setEvents(eventsData || []);
      setAnchors(anchorsData || []);
      setTags(tagsData || []);
      setTotalCount(countData?.count || 0);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterTag, filterAnchor]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = () => {
    let url = '/api/export/csv';
    const params = new URLSearchParams();
    if (filterTag) params.append('tag_id', filterTag);
    if (filterAnchor) params.append('anchor_id', filterAnchor);
    if (params.toString()) url += '?' + params.toString();
    window.open(url, '_blank');
  };

  const getRSSIColor = (rssi: number) => {
    if (rssi >= -50) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    if (rssi >= -65) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    if (rssi >= -80) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const formatTime = (iso: string) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const avgRSSI = events.length > 0 ? Math.round(events.reduce((sum, e) => sum + e.rssi, 0) / events.length) : 0;

  // Get last seen position for each tag at each anchor
  const getLastSeenForAnchor = (anchorId: string) => {
    return events.filter(e => e.anchor_id === anchorId).sort(
      (a, b) => new Date(b.timestamp_utc).getTime() - new Date(a.timestamp_utc).getTime()
    ).slice(0, 5);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl pulse-glow">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Real-time patrol monitoring system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[{ icon: Activity, label: 'Total Events', value: totalCount.toLocaleString(), color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' }, { icon: Radio, label: 'Active Anchors', value: anchors.length.toString(), color: 'from-green-500 to-green-600', bg: 'bg-green-50 dark:bg-green-900/20' }, { icon: Tag, label: 'Registered Tags', value: tags.length.toString(), color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }, { icon: Clock, label: 'Avg Signal', value: `${avgRSSI} dBm`, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' }].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${stat.bg} rounded-2xl p-5 border border-gray-200 dark:border-gray-800`}>
            <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">
            <Filter className="w-4 h-4" /> Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">Showing {events.length} of {totalCount.toLocaleString()} events</span>
        </div>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-wrap gap-4">
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Tags</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.id} {t.name ? `(${t.name})` : ''}</option>)}
            </select>
            <select value={filterAnchor} onChange={(e) => setFilterAnchor(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">All Anchors</option>
              {anchors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button onClick={() => { setFilterTag(''); setFilterAnchor(''); }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>
          </motion.div>
        )}
      </div>

      {/* Events Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-5 h-5 text-primary-500" /> Recent Patrol Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp (UTC)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anchor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag / Guard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="animate-pulse flex gap-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></div></td></tr>
              )) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No patrol events found</p><p className="text-sm text-gray-400 mt-1">Run the seed script or connect ESP32 anchors</p></td></tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-900 dark:text-white">{formatTime(event.timestamp_utc)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <MapPin className="w-3 h-3 mr-1" />{anchors.find(a => a.id === event.anchor_id)?.name || event.anchor_id.substring(0, 12)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{event.tag_id}</span>
                    {tags.find(t => t.id === event.tag_id)?.name && <span className="ml-2 text-xs text-gray-500">({tags.find(t => t.id === event.tag_id)?.name})</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getRSSIColor(event.rssi)}`}>{event.rssi} dBm</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-600 dark:text-gray-400">{event.battery !== null ? `${event.battery}%` : <span className="text-gray-400">N/A</span>}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-xs text-gray-500 font-mono">{event.lat && event.lon ? `${event.lat.toFixed(4)}, ${event.lon.toFixed(4)}` : '--'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Anchor Locations Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-green-500" /> Anchor Locations & Recent Activity</h2>
        </div>
        <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anchors.filter(a => a.lat && a.lon).map(anchor => {
            const recentEvents = getLastSeenForAnchor(anchor.id);
            return (
              <div key={anchor.id} className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 group-hover:from-blue-500/10 group-hover:to-green-500/10 transition-colors" />
                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{anchor.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{anchor.id}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Coordinates</span><span className="font-mono text-gray-700 dark:text-gray-300">{anchor.lat?.toFixed(4) ?? '--'}, {anchor.lon?.toFixed(4) ?? '--'}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Total Events</span><span className="font-medium text-gray-900 dark:text-white">{(anchor.event_count || 0).toLocaleString()}</span></div>
                  </div>
                  {recentEvents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Recent detections:</p>
                    {recentEvents.slice(0, 3).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{e.tag_id}</span>
                        <span className="text-gray-500">{formatTime(e.timestamp_utc)} · {e.rssi}dBm</span>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {anchors.filter(a => a.lat && a.lon).length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No anchor locations configured yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}