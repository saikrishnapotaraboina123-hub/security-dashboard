import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

import StatCard from '../components/StatCard';
import LiveEventsTable from '../components/LiveEventsTable';

import {
  Download,
  MapPin,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';

import { supabase } from '../services/supabase';

// =============================================
// INTERFACES
// =============================================
interface PatrolEvent {
  id: string;
  created_at: string;
  mac_address: string;
  device_name: string;
  rssi: number;
  esp32_location: string;
}

interface Guard {
  id: string;
  name: string;
  mac_address: string;
}

export default function Dashboard() {

  // =============================================
  // STATES
  // =============================================
  const [events, setEvents] = useState<PatrolEvent[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);

  const [loading, setLoading] = useState(true);

  const [filterGuard, setFilterGuard] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  // =============================================
  // FETCH DATA
  // =============================================
  const fetchData = useCallback(async () => {

    setLoading(true);

    try {

      // =============================================
      // FETCH GUARDS
      // =============================================
      const {
        data: guardsData,
        error: guardsError
      } = await supabase
        .from('guards')
        .select('*');

      if (guardsError) {
        console.error(
          'Guards fetch error:',
          guardsError
        );
      }

      // =============================================
      // FETCH PATROL LOGS
      // =============================================
      let query = supabase
        .from('patrol_logs')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      if (filterGuard) {
        query = query.eq(
          'mac_address',
          filterGuard
        );
      }

      if (filterLocation) {
        query = query.eq(
          'esp32_location',
          filterLocation
        );
      }

      const {
        data: eventsData,
        error: eventsError
      } = await query;

      if (eventsError) {

        console.error(
          'Events fetch error:',
          eventsError
        );
      }

      setGuards(guardsData || []);
      setEvents(eventsData || []);

    } catch (error) {

      console.error(
        'Dashboard fetch error:',
        error
      );

    } finally {

      setLoading(false);
    }

  }, [filterGuard, filterLocation]);

  // =============================================
  // INITIAL LOAD
  // =============================================
  useEffect(() => {

    fetchData();

  }, [fetchData]);

  // =============================================
  // REALTIME SUBSCRIPTION
  // =============================================
  useEffect(() => {

    const channel = supabase
      .channel('patrol-realtime')

      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patrol_logs'
        },

        (payload) => {

          console.log(
            'Realtime Event:',
            payload
          );

          setEvents((prev) => [
            payload.new as PatrolEvent,
            ...prev
          ]);
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  // =============================================
  // EXPORT CSV
  // =============================================
  const handleExportCSV = () => {

    if (events.length === 0) {
      return;
    }

    const headers = [
      'Time',
      'MAC Address',
      'Device Name',
      'RSSI',
      'Location'
    ];

    const rows = events.map((event) => [

      formatTime(event.created_at),

      event.mac_address,

      event.device_name,

      event.rssi,

      event.esp32_location
    ]);

    const csvContent = [

      headers.join(','),

      ...rows.map((row) =>
        row.join(',')
      )

    ].join('\n');

    const blob = new Blob(
      [csvContent],
      { type: 'text/csv' }
    );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download = 'patrol_logs.csv';

    a.click();

    window.URL.revokeObjectURL(url);
  };

  // =============================================
  // RSSI COLORS
  // =============================================
  const getRSSIColor = (
    rssi: number
  ) => {

    if (rssi >= -60) {
      return 'bg-green-500';
    }

    if (rssi >= -80) {
      return 'bg-yellow-500';
    }

    return 'bg-red-500';
  };

  // =============================================
  // TIME FORMAT
  // =============================================
  const formatTime = (
    iso: string
  ) => {

    if (!iso) {
      return '--';
    }

    return new Date(iso)
      .toLocaleString();
  };

  // =============================================
  // UNIQUE LOCATIONS
  // =============================================
  const uniqueLocations = [
    ...new Set(
      events.map(
        (event) =>
          event.esp32_location
      )
    )
  ];

  // =============================================
  // AVERAGE RSSI
  // =============================================
  const avgRSSI =
    events.length > 0

      ? Math.round(

          events.reduce(
            (sum, event) =>
              sum + event.rssi,
            0
          ) / events.length

        )

      : 0;

  return (

    <div className="space-y-6">

      {/* HEADER */}
      <motion.div
        initial={{
          opacity: 0,
          y: 15
        }}

        animate={{
          opacity: 1,
          y: 0
        }}
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-white">
              Security Patrol Dashboard
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Real-time guard monitoring
              system
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

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Patrol Logs"
          value={events.length}
          icon="📡"
          color="blue"
        />

        <StatCard
          title="Registered Guards"
          value={guards.length}
          icon="🛡️"
          color="green"
        />

        <StatCard
          title="Locations"
          value={uniqueLocations.length}
          icon="📍"
          color="purple"
        />

        <StatCard
          title="Average RSSI"
          value={`${avgRSSI} dBm`}
          icon="📶"
          color="orange"
        />

      </div>

      {/* FILTERS */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">

        <div className="flex items-center justify-between">

          <button
            onClick={() =>
              setShowFilters(
                !showFilters
              )
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

            Showing {events.length} logs

          </span>

        </div>

        {showFilters && (

          <motion.div

            initial={{
              opacity: 0,
              height: 0
            }}

            animate={{
              opacity: 1,
              height: 'auto'
            }}

            className="mt-4 flex flex-wrap gap-4"
          >

            {/* GUARD FILTER */}
            <select
              value={filterGuard}

              onChange={(e) =>
                setFilterGuard(
                  e.target.value
                )
              }

              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
            >

              <option value="">
                All Guards
              </option>

              {guards.map((guard) => (

                <option
                  key={guard.id}

                  value={
                    guard.mac_address
                  }
                >

                  {guard.name}

                </option>

              ))}

            </select>

            {/* LOCATION FILTER */}
            <select
              value={filterLocation}

              onChange={(e) =>
                setFilterLocation(
                  e.target.value
                )
              }

              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
            >

              <option value="">
                All Locations
              </option>

              {uniqueLocations.map(
                (location, index) => (

                  <option
                    key={index}
                    value={location}
                  >

                    {location}

                  </option>
                )
              )}

            </select>

            <button
              onClick={() => {

                setFilterGuard('');
                setFilterLocation('');

              }}

              className="text-sm text-blue-400 hover:text-blue-300"
            >

              Clear Filters

            </button>

          </motion.div>
        )}

      </div>

      {/* LIVE EVENTS TABLE */}
      <LiveEventsTable
        events={events}
        loading={loading}
        formatTime={formatTime}
        getRSSIColor={getRSSIColor}
      />

      {/* RECENT ACTIVITY */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">

        <div className="flex items-center gap-2 mb-5">

          <MapPin className="w-5 h-5 text-green-400" />

          <h2 className="font-semibold text-white">

            Recent Patrol Activity

          </h2>

        </div>

        <div className="space-y-3">

          {events.slice(0, 10).map(
            (event) => (

              <motion.div

                key={event.id}

                whileHover={{
                  scale: 1.01
                }}

                className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
              >

                <div>

                  <p className="text-white font-medium">

                    {event.device_name ||
                      'Unknown Guard'}

                  </p>

                  <p className="text-sm text-gray-400">

                    {event.mac_address}

                  </p>

                </div>

                <div className="text-right">

                  <p className="text-white">

                    {
                      event.esp32_location
                    }

                  </p>

                  <p className="text-sm text-gray-400">

                    {
                      event.rssi
                    } dBm

                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-gray-300">

                    {formatTime(
                      event.created_at
                    )}

                  </p>

                </div>

              </motion.div>
            )
          )}

          {events.length === 0 && (

            <div className="text-center py-10">

              <MapPin className="w-10 h-10 mx-auto text-gray-600 mb-3" />

              <p className="text-gray-500">

                No patrol logs found

              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
