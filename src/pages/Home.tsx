import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Bluetooth, Server, Globe, Rocket, Wifi, Database, MapPin, Download, ChevronRight, Terminal, Container, TestTube, Cpu } from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

export default function Home() {
  const features = [
    { icon: Bluetooth, title:'ESP32 BLE Scanner', desc:'PlatformIO firmware scanning BLE advertisements with tag filtering, RSSI extraction, and battery reading', color:'from-blue-500 to-cyan-500' },
    { icon: Server, title:'FastAPI Backend', desc:'Python REST API with SQLAlchemy models, Pydantic validation, API key auth, CORS, SQLite/Postgres support', color:'from-green-500 to-emerald-500' },
    { icon: Globe, title:'Web Dashboard', desc:'Jinja2 templates + Leaflet maps showing real-time patrol events, filters, CSV export', color:'from-purple-500 to-pink-500' },
    { icon: Container, title:'Docker Ready', desc:'One-command docker-compose setup with seed scripts, health checks, volume persistence', color:'from-orange-500 to-red-500' },
    { icon: Database, title:'Data Persistence', desc:'SQLite for development, PostgreSQL-ready for production. Full CRUD on anchors, tags, events', color:'from-indigo-500 to-violet-500' },
    { icon: Download, title:'Export & Reports', desc:'CSV export with date/tag/anchor filters. Includes lat/lon when anchor positions configured', color:'from-teal-500 to-cyan-500' },
  ];
  const quickLinks = [
    { icon:Cpu, label:'ESP32 Firmware', desc:'PlatformIO + Arduino', path:'/firmware', color:'text-blue-500' },
    { icon:Server, label:'FastAPI Backend', desc:'Python + SQLAlchemy', path:'/backend', color:'text-green-500' },
    { icon:Globe, label:'Web Frontend', desc:'Jinja2 + Leaflet', path:'/frontend', color:'text-purple-500' },
    { icon:MapPin, label:'Live Demo', desc:'Interactive Dashboard', path:'/dashboard', color:'text-orange-500' },
    { icon:Container, label:'Docker Setup', desc:'docker-compose', path:'/devops', color:'text-cyan-500' },
    { icon:TestTube, label:'Test Plan', desc:'curl + ESP32 tests', path:'/testing', color:'text-pink-500' },
  ];
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-800"/>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6 border border-white/20">
              <Shield className="w-4 h-4"/><span>IoT Starter Project &bull; ESP32 + FastAPI + Web Dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Security Patrol<div className="text-2xl sm:text-3xl lg:text-4xl mt-2 text-primary-200 font-normal">BLE-Based Guard Tour System</div>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-10 leading-relaxed">Complete IoT starter kit for building security patrol monitoring systems. ESP32 anchors scan BLE tags, report to FastAPI backend, visualize in real-time dashboard.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/architecture" className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg shadow-black/20"><Rocket className="w-5 h-5"/>Explore Architecture<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/></Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"><MapPin className="w-5 h-5"/>View Live Demo</Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-gray-50 dark:text-gray-950"/></svg></div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link,i) => (
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2+i*0.05}}>
              <Link to={link.path} className="block p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all group">
                <link.icon className={`w-6 h-6 ${link.color} mb-2`}/>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{link.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{link.desc}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">A production-ready starter with firmware, backend, frontend, and DevOps tooling included.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{features.map((f,i) => <FeatureCard key={i} {...f} delay={i*0.1}/>)}</div>
      </section>
      <section className="bg-gray-100 dark:bg-gray-900/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tech Stack</h2>
            <p className="text-gray-600 dark:text-gray-400">Built with proven, well-documented technologies</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[{name:'ESP32',icon:Wifi,color:'bg-red-500'},{name:'PlatformIO',icon:Terminal,color:'bg-blue-500'},{name:'BLE',icon:Bluetooth,color:'bg-blue-400'},{name:'FastAPI',icon:Server,color:'bg-teal-500'},{name:'SQLAlchemy',icon:Database,color:'bg-red-600'},{name:'Jinja2',icon:Globe,color:'bg-black dark:bg-white'},{name:'Leaflet',icon:MapPin,color:'bg-green-500'},{name:'Docker',icon:Container,color:'bg-blue-600'},{name:'NTP',icon:Terminal,color:'bg-purple-500'},{name:'LittleFS',icon:Database,color:'bg-yellow-500'},{name:'Pydantic',icon:Terminal,color:'bg-red-500'},{name:'HTTPS',icon:Shield,color:'bg-green-600'}].map((t,i)=>(
              <motion.div key={i} initial={{opacity:0,scale:.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*.05}} className="flex flex-col items-center gap-2 p-4">
                <div className={`w-12 h-12 ${t.color} rounded-xl flex items-center justify-center shadow-lg`}><t.icon className="w-6 h-6 text-white"/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center p-12 bg-gradient-to-br from-primary-600 to-accent-700 rounded-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">Start with the Architecture overview, then dive into each component's complete source code.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/architecture" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all">View Architecture Diagram &rarr;</Link>
            <Link to="/firmware" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all">Browse Source Code &rarr;</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}