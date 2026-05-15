import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

import StatCard from '../components/StatCard';
import LiveEventsTable from '../components/LiveEventsTable';

import {
  Shield,
  Activity,
  Radio,
  Tag,
  Clock,
  Download,
  MapPin,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';

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
      const params = new URLSearchParams({
        limit: '100',
      });

      if (filterTag) {
        params.append('tag_id', filterTag);
      }

      if (filterAnchor) {
        params.append('anchor_id', filterAnchor);
      }

      const [
        eventsRes,
        anchorsRes,
        tagsRes,
        countRes,
      ] = await Promise.all([
        fetch(`/api/events?${params.toString()}`),
        fetch('/api/anchors'),
        fetch('/api/tags'),
        fetch('/api/events/count'),
      ]);

      const [
        eventsData,
        anchorsData,
        tagsData,
        countData,
      ] = await Promise.all([
        eventsRes.json(),
        anchorsRes.json(),
        tagsRes.json(),
        countRes.json(),
      ]);

      setEvents(eventsData || []);
      setAnchors(anchorsData || []);
      setTags(tagsData || []);
      setTotalCount(countData?.count || 0);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [filterTag, filterAnchor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    let url = '/api/export/csv';

    const params = new URLSearchParams();

    if (filterTag) {
      params.append('tag_id', filterTag);
    }

    if (filterAnchor) {
      params.append('anchor_id', filterAnchor);
    }

    if (params.toString()) {
      url += '?' + params.toString();
    }

    window.open(url, '_blank');
  };

  const getRSSIColor = (rssi: number) => {
    if (rssi >= -50) {
      return 'bg-green-500';
    }

    if (rssi >= -65) {
      return 'bg-yellow-500';
    }

    return 'bg-red-500';
  };

  const formatTime = (iso: string) => {
    if (!iso) {
      return '--';
    }

    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const avgRSSI =
    events.length > 0
      ? Math.round(
          events.reduce(
            (sum, event) => sum + event.rssi,
            0
          ) / events.length
        )
      : 0;

  const getLastSeenForAnchor = (
    anchorId: string
  ) => {
    return events
      .filter(
        (event) =>
          event.anchor_id === anchorId
      )
      .sort(
        (a, b) =>
          new Date(
            b.timestamp_utc
          ).getTime() -
          new Date(
            a.timestamp_utc
          ).getTime()
      )
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Dashboard
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Real-time security operations
              overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
            >
              <Download className="w-4 h-4" />

              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={totalCount}
          icon="📡"
          color="blue"
        />

        <StatCard
          title="Active Anchors"
          value={anchors.length}
          icon="📍"
          color="green"
        />

        <StatCard
          title="Registered Tags"
          value={tags.length}
          icon="🏷️"
          color="purple"
        />

        <StatCard
          title="Average Signal"
          value={`${avgRSSI} dBm`}
          icon="📶"
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setShowFilters(!showFilters)
            }
            className="flex items-center gap-2 text-sm text-white"
          >
            <Filter className="w-4 h-4" />

            Filters

            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>

          <span className="text-xs text-gray-500">
            Showing {events.length} of{' '}
            {totalCount} events
          </span>
        </div>

        {showFilters && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            className="mt-4 flex flex-wrap gap-4"
          >
            <select
              value={filterTag}
              onChange={(e) =>
                setFilterTag(
                  e.target.value
                )
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
            >
              <option value="">
                All Tags
              </option>

              {tags.map((tag) => (
                <option
                  key={tag.id}
                  value={tag.id}
                >
                  {tag.id}
                  {tag.name
                    ? ` (${tag.name})`
                    : ''}
                </option>
              ))}
            </select>

            <select
              value={filterAnchor}
              onChange={(e) =>
                setFilterAnchor(
                  e.target.value
                )
              }
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
            >
              <option value="">
                All Anchors
              </option>

              {anchors.map((anchor) => (
                <option
                  key={anchor.id}
                  value={anchor.id}
                >
                  {anchor.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setFilterTag('');
                setFilterAnchor('');
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Live Events Table */}
      <LiveEventsTable
        events={events}
        anchors={anchors}
        tags={tags}
        loading={loading}
        formatTime={formatTime}
        getRSSIColor={getRSSIColor}
      />

      {/* Anchor Activity */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-5 h-5 text-green-400" />

          <h2 className="font-semibold text-white">
            Anchor Locations & Recent
            Activity
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {anchors
            .filter(
              (anchor) =>
                anchor.lat &&
                anchor.lon
            )
            .map((anchor) => {
              const recentEvents =
                getLastSeenForAnchor(
                  anchor.id
                );

              return (
                <motion.div
                  key={anchor.id}
                  whileHover={{
                    scale: 1.02,
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">
                        {anchor.name}
                      </h3>

                      <p className="text-xs text-gray-500 font-mono">
                        {anchor.id}
                      </p>
                    </div>

                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Coordinates
                      </span>

                      <span className="text-gray-200 font-mono text-xs">
                        {anchor.lat?.toFixed(
                          4
                        )}
                        ,{' '}
                        {anchor.lon?.toFixed(
                          4
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Total Events
                      </span>

                      <span className="text-white">
                        {(
                          anchor.event_count ||
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {recentEvents.length >
                    0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">
                        Recent detections
                      </p>

                      <div className="space-y-2">
                        {recentEvents
                          .slice(0, 3)
                          .map(
                            (
                              event,
                              index
                            ) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${getRSSIColor(
                                      event.rssi
                                    )}`}
                                  />

                                  <span className="text-white">
                                    {
                                      event.tag_id
                                    }
                                  </span>
                                </div>

                                <span className="text-gray-500">
                                  {
                                    event.rssi
                                  }
                                  dBm
                                </span>
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

          {anchors.filter(
            (anchor) =>
              anchor.lat &&
              anchor.lon
          ).length === 0 && (
            <div className="col-span-full text-center py-10">
              <MapPin className="w-10 h-10 mx-auto text-gray-600 mb-3" />

              <p className="text-gray-500">
                No anchor locations found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
