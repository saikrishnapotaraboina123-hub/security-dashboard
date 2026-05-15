import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
interface Props { icon: LucideIcon; title: string; description: string; color?: string; delay?: number; }
export default function FeatureCard({ icon: Icon, title, description, color='from-primary-500 to-accent-600', delay=0 }: Props) {
  return (
    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.5,delay}}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5">
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}><Icon className="w-6 h-6 text-white"/></div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}