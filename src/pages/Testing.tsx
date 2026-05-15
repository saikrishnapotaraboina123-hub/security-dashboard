import { motion } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import { TestTube, Terminal, Bluetooth, Server, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { useState } from 'react';

export default function Testing() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const testCommands = [
    {
      title: '1. Health Check',
      description: 'Verify the API server is running and healthy.',
      command: 'curl -s http://localhost:8000/health | python -m json.tool',
      expected: '{\n  "status": "healthy",\n  "service": "security-patrol-api",\n  "version": "1.0.0"\n}',
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: '2. List Anchors',
      description: 'Check that seed data created anchors correctly.',
      command: 'curl -s http://localhost:8000/api/anchors | python -m json.tool',
      expected: '[\n  {\n    "id": "aabbccddeeff01",\n    "name": "Main Entrance",\n    ...\n  }\n]',
      icon: Server,
      color: 'blue',
    },
    {
      title: '3. Query Events',
      description: 'Retrieve patrol events with pagination.',
      command: 'curl -s "http://localhost:8000/api/events?limit=5&offset=0" | python -m json.tool',
      expected: '[\n  {\n    "id": 1,\n    "timestamp_utc": "...",\n    "anchor_id": "...",\n    "tag_id": "...",\n    "rssi": -65\n  }\n]',
      icon: TestTube,
      color: 'purple',
    },
    {
      title: '4. Filter by Tag',
      description: 'Query events for a specific guard tag.',
      command: 'curl -s "http://localhost:8000/api/events?tag_id=PT-GUARD001&limit=3" | python -m json.tool',
      expected: '[/* Only PT-GUARD001 events */]',
      icon: TestTube,
      color: 'purple',
    },
    {
      title: '5. Ingest Event (with Auth)',
      description: 'Submit a test patrol event via the ingest endpoint.',
      command: `curl -X POST http://localhost:8000/api/ingest/patrl \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-secret-api-key-change-me" \\
  -d '[{"tag_id":"PT-TEST","rssi":-67,"timestamp_utc":"2025-01-15T14:30:00Z","anchor_id":"aabbccddeeff01"}]'`,
      expected: 'HTTP 201 Created + JSON array of created events',
      icon: Server,
      color: 'green',
    },
    {
      title: '6. Export CSV',
      description: 'Download events as a CSV file.',
      command: 'curl -s -o patrol_events.csv "http://localhost:8000/api/export/csv" && head -5 patrol_events.csv',
      expected: 'timestamp_utc,anchor_id,tag_id,rssi,battery,lat,lon\n2025-...',
      icon: Terminal,
      color: 'orange',
    },
    {
      title: '7. Missing API Key (Error Case)',
      description: 'Verify that requests without API key are rejected.',
      command: 'curl -s -X POST http://localhost:8000/api/ingest/patrol -H "Content-Type: application/json" -d "[{\"tag_id\":\"TEST\"}]" | python -m json.tool',
      expected: '{\n  "detail": "Invalid API key"\n}',
      status: 401,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      title: '8. Invalid RSSI (Validation)',
      description: 'Test input validation with out-of-range values.',
      command: `curl -s -X POST http://localhost:8000/api/ingest/patrol \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-secret-api-key-change-me" \\
  -d '[{"tag_id":"TEST","rssi":999,"timestamp_utc":"2025-01-15T10:00:00Z"}]'`,
      expected: 'HTTP 422 Validation Error (rssi must be -127 to 30)',
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  const esp32Tests = [
    { step: '1', title: 'Power On & Serial', desc: 'Flash firmware, open serial monitor at 115200 baud. Verify startup banner appears.' },
    { step: '2', title: 'WiFi Connection', desc: 'Confirm "WiFi Connected! IP: x.x.x.x" message appears within 15 seconds.' },
    { step: '3', title: 'NTP Sync', desc: 'Look for "NTP Time synced: YYYY-MM-DD HH:MM:SS UTC" message.' },
    { step: '4', title: 'BLE Scan', desc: 'After NTP sync, should see "Starting scan for X ms..." messages every ~5 seconds.' },
    { step: '5', title: 'Tag Detection', desc: 'Bring BLE beacon (name starts with "PT-") near ESP32. Should see "Detected: PT-XXXXX | RSSI: XX dBm".' },
    { step: '6', title: 'API Upload', desc: 'Should see "POST https://.../ingest/patrol" followed by "OK: HTTP 201".' },
    { step: '7', title: 'Offline Queue', desc: 'Turn off WiFi/router. Scan should still detect tags. Messages show "Queued event".' },
    { step: '8', title: 'Reconnect & Replay', desc: 'Restore WiFi. Watch queued events upload automatically with "Sent X events" messages.' },
    { step: '9', title: 'Status Output', desc: 'Every 30 seconds, status table prints: WiFi state, time, queue depth, free heap, uptime.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl">
            <TestTube className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testing Guide</h1>
            <p className="text-gray-600 dark:text-gray-400">curl commands for API testing + ESP32 verification checklist</p>
          </div>
        </div>
      </motion.div>

      {/* API Tests Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-500" />
          Backend API Tests (curl)
        </h2>
        
        <div className="space-y-4">
          {testCommands.map((test, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${test.color}-100 dark:bg-${test.color}-900/30`}>
                    <test.icon className={`w-5 h-5 text-${test.color}-500`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{test.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{test.description}</p>
                  </div>
                </div>
                {test.status && (
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    test.status >= 400 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>Expected: HTTP {test.status}</span>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div className="relative">
                  <pre className="bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
                    <code>{test.command}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(test.command, index)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 flex-shrink-0">Expected:</span>
                  <code className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs">
                    {test.expected}
                  </code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ESP32 Tests Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Bluetooth className="w-5 h-5 text-orange-500" />
          ESP32 Firmware Verification Checklist
        </h2>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {esp32Tests.map((test, index) => (
              <div key={index} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{test.step}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{test.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{test.desc}</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" />
              </div>
            ))}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Complete all checks to verify full functionality. Use a BLE simulator app (nRF Connect) if you don't have physical beacons.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Troubleshooting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Troubleshooting
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { problem: 'WiFi won\'t connect', solution: 'Check SSID/password in config.h. Ensure 2.4GHz network (ESP32 doesn\'t support 5GHz). Verify router isn\'t filtering MAC addresses.' },
            { problem: 'NTP sync fails', solution: 'Ensure WiFi is connected first. Check firewall allows UDP port 123. Try different NTP server (time.google.com).' },
            { problem: 'No BLE tags detected', solution: 'Verify TAG_PREFIX matches beacon name. Check BLE beacon is advertising. Move closer (<10m). Some beacons need manufacturer data parsing.' },
            { problem: 'HTTPS POST fails', solution: 'Check API_BASE_URL is correct. Verify API_KEY matches backend. For dev, ensure SSL cert is valid (or use http:// locally).' },
            { problem: 'LittleFS mount fails', solution: 'Upload LittleFS data first: pio run -t uploadfs. Check partition table includes spiffs/littlefs partition.' },
            { problem: 'Events not appearing in dashboard', solution: 'Run seed script first. Check browser console for errors. Verify API returns data via curl. Check CORS settings.' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">❓ {item.problem}</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">💡 {item.solution}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}