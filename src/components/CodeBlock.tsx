import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
interface Props { code: string; language?: string; filename?: string; title?: string; }
export default function CodeBlock({ code, language='text', filename, title }: Props) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 my-4">
      {(title || filename) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {filename && <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{filename}</span>}
            {title && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>}
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5 text-green-500"/> Copied!</> : <><Copy className="w-3.5 h-3.5"/> Copy</>}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && !filename && (
          <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
          </button>
        )}
        <pre className="p-4 bg-gray-950 text-gray-100 overflow-x-auto text-sm leading-relaxed"><code>{code}</code></pre>
      </div>
    </div>
  );
}