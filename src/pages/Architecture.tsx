import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Radio, Server, Globe, Database, Clock, Wifi, Shield, Download } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-600 rounded-xl"><Database className="w-7 h-7 text-white"/></div>
          <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Architecture</h1><p className="text-gray-600 dark:text-gray-400">Understanding how BLE tags, ESP32 anchors, FastAPI backend, and web dashboard work together</p></div>
        </div>
      </motion.div>

      {/* Visual Data Flow */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 lg:p-8 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-primary-500"/>Data Flow Diagram</h2>
          <div className="min-w-[800px]">
            <div className="flex items-center justify-between gap-4 py-8">
              {/* BLE Tags */}
              <div className="flex flex-col items-center gap-3 w-36">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"><Radio className="w-10 h-10 text-white"/></div>
                <div className="text-center"><div className="font-semibold text-gray-900 dark:text-white text-sm">BLE Tags</div><div className="text-xs text-gray-500">Beaconing</div></div>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">TAG001</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">BEACON01</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Mfr Data</span>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0"/>
              {/* ESP32 Anchor */}
              <div className="flex flex-col items-center gap-3 w-48">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"><Cpu className="w-12 h-12 text-white"/></div>
                <div className="text-center"><div className="font-semibold text-gray-900 dark:text-white text-sm">ESP32 Anchor</div><div className="text-xs text-gray-500">BLE Scan + WiFi + NTP</div></div>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">BLE Scan</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">WiFi</span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">NTP</span>
                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">LittleFS</span>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0"/>
              {/* FastAPI Backend */}
              <div className="flex flex-col items-center gap-3 w-56">
                <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30"><Server className="w-14 h-14 text-white"/></div>
                <div className="text-center"><div className="font-semibold text-gray-900 dark:text-white text-sm">FastAPI Backend</div><div className="text-xs text-gray-500">REST API + Database</div></div>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">/ingest/patrol</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">/events</span>
                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full">/export/csv</span>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0"/>
              {/* Web Dashboard */}
              <div className="flex flex-col items-center gap-3 w-44">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30"><Globe className="w-10 h-10 text-white"/></div>
                <div className="text-center"><div className="font-semibold text-gray-900 dark:text-white text-sm">Web Dashboard</div><div className="text-xs text-gray-500">Jinja2 + Leaflet</div></div>
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">Table</span>
                  <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full">Map</span>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mermaid Diagram Text */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mermaid Diagram (for docs)</h2>
          <pre className="bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm leading-relaxed">{`graph TB
    subgraph Physical["Physical Layer"]
        TAG1[BLE Tag A<br/>tag_id: TAG001]
        TAG2[BLE Tag B<br/>tag_id: BEACON01]
        TAG3[BLE Tag C<br/>Manufacturer Data]
    end
    subgraph Edge["ESP32 Anchors"]
        ANCHOR1[Anchor-01<br/>MAC: AA:BB:CC:DD:EE:01]
        ANCHOR2[Anchor-02<br/>MAC: AA:BB:CC:DD:EE:02]
    end
    subgraph Cloud["Backend Infrastructure"]
        API[FastAPI Server<br/>Port 8000]
        DB[(SQLite / PostgreSQL)]
    end
    subgraph Presentation["Presentation Layer"]
        WEB[Web Dashboard<br/>Jinja2 + Leaflet]
        EXPORT[CSV Export]
    end
    TAG1 -->|BLE Adv| ANCHOR1
    TAG2 -->|BLE Adv| ANCHOR2
    TAG3 -->|BLE Adv| ANCHOR1
    TAG3 -->|BLE Adv| ANCHOR2
    ANCHOR1 -->|HTTPS POST<br/>/ingest/patrol| API
    ANCHOR2 -->|HTTPS POST<br/>/ingest/patrol| API
    API -->|SQLAlchemy| DB
    WEB -->|GET /events| API
    WEB -->|GET /export/csv| EXPORT
    EXPORT -->|Query DB| API`}</pre>
        </div>
      </motion.div>

      {/* Component Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.3}} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Radio className="w-5 h-5 text-blue-500"/>BLE Tags (Beacons)</h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"/><span><strong>Advertising Name:</strong> Configurable tag_id in device name (e.g., TAG001, BEACON01)</span></li>
            <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0"/><span><strong>Broadcast Interval:</strong> Typically 100ms–1s depending on battery life needs</span></li>
            <li className="flex items-start gap-2"><Wifi className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0"/><span><strong>RSSI Range:</strong> –30 (close) to –90 (far), used for proximity estimation</span></li>
            <li className="flex items-start gap-2"><Download className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0"/><span><strong>Battery:</strong> Optional — some beacons advertise battery level in manufacturer data</span></li>
          </ul>
        </motion.div>
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:.3}} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-orange-500"/>ESP32 Anchor (Scanner)</h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2"><Radio className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"/><span><strong>BLE Scanning:</strong> Passive scan mode, filters by known tag prefixes or UUIDs</span></li>
            <li className="flex items-start gap-2"><Clock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0"/><span><strong>NTP Time Sync:</strong> Gets accurate UTC timestamps from pool.ntp.org</span></li>
            <li className="flex items-start gap-2"><Database className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"/><span><strong>Offline Queue:</strong> LittleFS stores events when WiFi is down, replays on reconnect</span></li>
            <li className="flex items-start gap-2"><Server className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"/><span><strong>Batch Upload:</strong> Sends up to 20 events per HTTP request for efficiency</span></li>
          </ul>
        </motion.div>
      </div>

      {/* Database Schema */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4}} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-green-500"/>Database Schema</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{name:'anchors', color:'blue', cols:[['id','VARCHAR(64) PK'],['name','VARCHAR(128)'],['lat','DOUBLE'],['lon','DOUBLE'],['created_at','TIMESTAMP']]},{name:'tags', color:'green', cols:[['id','VARCHAR(64) PK'],['name','VARCHAR(128)'],['created_at','TIMESTAMP']]},{name:'patrol_events', color:'purple', cols:[['id','SERIAL PK'],['received_at','TIMESTAMP'],['timestamp_utc','TIMESTAMP'],['anchor_id','VARCHAR(64) FK'],['tag_id','VARCHAR(64) FK'],['rssi','INTEGER'],['battery','INTEGER'],['raw_json','JSONB']]}].map((t,i)=>(
            <div key={i} className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden`}>
              <div className={`bg-${t.color}-50 dark:bg-${t.color}-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-700`}><h4 className={`font-semibold text-${t.color}-700 dark:text-${t.color}-300 text-sm`}>{t.name}</h4></div>
              <table className="w-full text-sm"><thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{t.cols.map(([col,type],j)=><tr key={j} className="text-gray-700 dark:text-gray-300"><td className="px-3 py-2 font-mono text-xs">{col}</td><td className="px-3 py-2 text-xs text-gray-500">{type}</td></tr>)}</tbody></table>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="text-center p-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to Dive Into Code?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Explore each component's complete source code with detailed explanations.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/firmware" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"><Cpu className="w-4 h-4"/>ESP32 Firmware</Link>
          <Link to="/backend" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"><Server className="w-4 h-4"/>FastAPI Backend</Link>
          <Link to="/frontend" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-colors"><Globe className="w-4 h-4"/>Web Frontend</Link>
        </div>
      </motion.div>
    </div>
  );
}
