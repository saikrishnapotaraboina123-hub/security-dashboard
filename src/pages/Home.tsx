import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-primary-500/10 blur-3xl rounded-full -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Live Security Monitoring System
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Security Patrol
            <span className="block bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Real-time BLE-based security guard tracking platform with
            checkpoint verification, attendance monitoring, patrol analytics,
            live location updates, and event management.
          </p>

          {/* Buttons */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <a
              href="/dashboard"
              className="px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 transition-all duration-300"
            >
              Open Dashboard
            </a>

            <a
              href="/architecture"
              className="px-7 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold transition-all duration-300"
            >
              View Architecture
            </a>
          </div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 17v-6h13v6"></path>
                <path d="M13 7V3H2v14h7"></path>
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Live Patrol Tracking
            </h3>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Monitor security guards in real time using BLE checkpoints and
              anchor devices deployed across patrol areas.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4"></path>
                <path d="M21 12c0 1.66-.67 3.16-1.76 4.24A5.98 5.98 0 0112 21a5.98 5.98 0 01-7.24-4.76A5.98 5.98 0 013 12c0-1.66.67-3.16 1.76-4.24A5.98 5.98 0 0112 3a5.98 5.98 0 017.24 4.76A5.98 5.98 0 0121 12z"></path>
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Attendance & Checkpoints
            </h3>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Automatically verify guard attendance and patrol completion with
              timestamped checkpoint events.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 3v18h18"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Analytics & Reports
            </h3>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Generate patrol reports, analyze checkpoint history, and monitor
              security performance through visual dashboards.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
