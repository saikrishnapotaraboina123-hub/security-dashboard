interface Props {
  events: any[];
  anchors: any[];
  tags: any[];
  loading: boolean;
  formatTime: (iso: string) => string;
  getRSSIColor: (rssi: number) => string;
}

export default function LiveEventsTable({
  events,
  anchors,
  tags,
  loading,
  formatTime,
  getRSSIColor,
}: Props) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-800">
        <h2 className="font-semibold text-white">
          Live Patrol Events
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-400">
                Time
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                Anchor
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                Tag
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                RSSI
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-10 text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-t border-gray-800"
                >
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatTime(
                      event.timestamp_utc
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm text-white">
                    {event.anchor_id}
                  </td>

                  <td className="px-6 py-4 text-sm text-white">
                    {event.tag_id}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${getRSSIColor(
                        event.rssi
                      )}`}
                    >
                      {event.rssi}
                    </span>
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
