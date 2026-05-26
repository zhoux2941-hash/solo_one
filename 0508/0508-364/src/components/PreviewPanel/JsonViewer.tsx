import { useMemo } from 'react';

interface JsonViewerProps {
  data: any[];
}

function getTypeColor(value: any): string {
  if (value === null) return 'text-slate-500';
  if (typeof value === 'string') return 'text-emerald-400';
  if (typeof value === 'number') return 'text-orange-400';
  if (typeof value === 'boolean') return 'text-purple-400';
  if (Array.isArray(value)) return 'text-blue-400';
  if (typeof value === 'object') return 'text-pink-400';
  return 'text-slate-300';
}

function formatValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value.toString();
  return value.toString();
}

function JsonNode({ data, indent = 0 }: { data: any; indent?: number }) {
  const indentStr = '  '.repeat(indent);
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-500">[]</span>;
    }
    return (
      <div>
        <span className="text-slate-500">[</span>
        <div className="ml-4">
          {data.map((item, index) => (
            <div key={index}>
              <JsonNode data={item} indent={indent + 1} />
              {index < data.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">{indentStr}]</span>
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return <span className="text-slate-500">&#123;&#125;</span>;
    }
    return (
      <div>
        <span className="text-slate-500">&#123;</span>
        <div className="ml-4">
          {keys.map((key, index) => (
            <div key={key} className="flex">
              <span className="text-cyan-400">"{key}"</span>
              <span className="text-slate-500">: </span>
              <JsonNode data={data[key]} indent={indent + 1} />
              {index < keys.length - 1 && <span className="text-slate-500">,</span>}
            </div>
          ))}
        </div>
        <span className="text-slate-500">{indentStr}&#125;</span>
      </div>
    );
  }

  return <span className={getTypeColor(data)}>{formatValue(data)}</span>;
}

export function JsonViewer({ data }: JsonViewerProps) {
  const formatted = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-sm">点击「生成数据」按钮预览 JSON</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 font-mono text-sm">
      <div className="text-slate-500">[</div>
      <div className="ml-4">
        {data.map((item, index) => (
          <div key={index} className="mb-2">
            <JsonNode data={item} />
            {index < data.length - 1 && <span className="text-slate-500">,</span>}
          </div>
        ))}
      </div>
      <div className="text-slate-500">]</div>
    </div>
  );
}
