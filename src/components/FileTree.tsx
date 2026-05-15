import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
interface FileNode { name: string; type: 'file'|'folder'; children?: FileNode[]; highlight?: boolean; }
interface Props { files: FileNode[]; onFileClick?: (name:string)=>void; }
function TreeNode({ node, depth=0, onFileClick }: {node:FileNode; depth?:number; onFileClick?:(name:string)=>void}) {
  const [open, setOpen] = useState(depth < 2);
  if (node.type === 'file') return (
    <div onClick={()=>onFileClick?.(node.name)} className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${node.highlight?'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20':'text-gray-700 dark:text-gray-300'}`} style={{paddingLeft:`${depth*16+8}px`}}>
      <File className="w-4 h-4 text-gray-400 flex-shrink-0"/><span className="text-sm truncate">{node.name}</span>
    </div>
  );
  return (<div>
    <div onClick={()=>setOpen(!open)} className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300" style={{paddingLeft:`${depth*16+8}px`}}>
      {open?<ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>:<ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
      {open?<FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0"/>:<Folder className="w-4 h-4 text-amber-500 flex-shrink-0"/>}
      <span className="text-sm font-medium">{node.name}</span>
    </div>
    {open && node.children?.map((c,i)=><TreeNode key={i} node={c} depth={depth+1} onFileClick={onFileClick}/>)}
  </div>);
}
export default function FileTree({ files, onFileClick }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">Project Structure</div>
      {files.map((n,i)=><TreeNode key={i} node={n} onFileClick={onFileClick}/>)}
    </div>
  );
}