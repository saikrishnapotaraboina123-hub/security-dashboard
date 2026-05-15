import { motion } from 'framer-motion';

interface PatrolEvent {
  id: string;
  created_at: string;
  mac_address: string;
  device_name: string;
  rssi: number;
  esp32_location: string;
}

interface Props {
  events: PatrolEvent[];
  loading: boolean;
  formatTime: (iso: string) => string;
  getRSSIColor: (rssi: number) => string;
}

export default function LiveEventsTable({
  events,
  loading,
  formatTime,
  getRSSIColor,
}: Props) {

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

      {/* HEADER */}
      <div className="px-5 py-4 border-b border-gray-800">

        <h2 className="text-white font-semibold">
          Live Patrol Logs
        </h2>

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-800">

            <tr>

              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Device
              </th>

              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                MAC Address
              </th>

              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Location
              </th>

              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                RSSI
              </th>

              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Time
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-800">

            {loading ? (

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >

                  Loading patrol logs...

                </td>

              </tr>

            ) : events.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >

                  No patrol logs found

                </td>

              </tr>

            ) : (

              events.map((event) => (

                <motion.tr
                  key={event.id}

                  initial={{
                    opacity: 0,
                    y: 10,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  className="hover:bg-gray-800/50 transition"
                >

                  {/* DEVICE */}
                  <td className="px-5 py-4">

                    <div>

                      <p className="text-white font-medium">

                        {event.device_name ||
                          'Unknown'}

                      </p>

                    </div>

                  </td>

                  {/* MAC */}
                  <td className="px-5 py-4">

                    <span className="text-gray-300 font-mono text-sm">

                      {event.mac_address}

                    </span>

                  </td>

                  {/* LOCATION */}
                  <td className="px-5 py-4">

                    <span className="text-gray-300">

                      {event.esp32_location ||
                        'Unknown'}

                    </span>

                  </td>

                  {/* RSSI */}
                  <td className="px-5 py-4">

                    <div className="flex items-center gap-2">

                      <span
                        className={`w-3 h-3 rounded-full ${getRSSIColor(
                          event.rssi
                        )}`}
                      />

                      <span className="text-white">

                        {event.rssi} dBm

                      </span>

                    </div>

                  </td>

                  {/* TIME */}
                  <td className="px-5 py-4">

                    <span className="text-gray-400 text-sm">

                      {formatTime(
                        event.created_at
                      )}

                    </span>

                  </td>

                </motion.tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
