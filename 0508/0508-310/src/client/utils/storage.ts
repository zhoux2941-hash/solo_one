import type { SSHConnection, CommandSnippet } from '../types';
import { encrypt, decrypt } from './crypto';

const STORAGE_KEY = 'webssh_connections';
const SNIPPET_STORAGE_KEY = 'webssh_snippets';

export function saveConnection(connection: SSHConnection): void {
  const connections = getConnections();
  const index = connections.findIndex(c => c.id === connection.id);
  
  const connectionToSave = {
    ...connection,
    password: connection.password ? encrypt(connection.password) : undefined
  };

  if (index >= 0) {
    connections[index] = connectionToSave;
  } else {
    connections.push(connectionToSave);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

export function getConnections(): SSHConnection[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  const connections = JSON.parse(data);
  return connections.map((c: SSHConnection) => ({
    ...c,
    password: c.password ? decrypt(c.password) : undefined
  }));
}

export function deleteConnection(id: string): void {
  const connections = getConnections();
  const filtered = connections.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateLastUsed(id: string): void {
  const connections = getConnections();
  const connection = connections.find(c => c.id === id);
  if (connection) {
    connection.lastUsed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  }
}

export function saveSnippet(snippet: CommandSnippet): void {
  const snippets = getSnippets();
  const index = snippets.findIndex(s => s.id === snippet.id);
  
  if (index >= 0) {
    snippets[index] = snippet;
  } else {
    snippets.push(snippet);
  }
  
  localStorage.setItem(SNIPPET_STORAGE_KEY, JSON.stringify(snippets));
}

export function getSnippets(): CommandSnippet[] {
  const data = localStorage.getItem(SNIPPET_STORAGE_KEY);
  if (!data) {
    return getDefaultSnippets();
  }
  return JSON.parse(data);
}

export function deleteSnippet(id: string): void {
  const snippets = getSnippets();
  const filtered = snippets.filter(s => s.id !== id);
  localStorage.setItem(SNIPPET_STORAGE_KEY, JSON.stringify(filtered));
}

export function updateSnippetUsage(id: string): void {
  const snippets = getSnippets();
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    snippet.lastUsed = Date.now();
    snippet.useCount = (snippet.useCount || 0) + 1;
    localStorage.setItem(SNIPPET_STORAGE_KEY, JSON.stringify(snippets));
  }
}

function getDefaultSnippets(): CommandSnippet[] {
  return [
    {
      id: 'default-1',
      name: '查看系统信息',
      command: 'uname -a',
      description: '显示操作系统信息',
      category: '系统',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-2',
      name: '查看磁盘使用',
      command: 'df -h',
      description: '显示磁盘空间使用情况',
      category: '系统',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-3',
      name: '查看内存使用',
      command: 'free -h',
      description: '显示内存使用情况',
      category: '系统',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-4',
      name: '查看进程列表',
      command: 'ps aux',
      description: '显示所有运行进程',
      category: '进程',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-5',
      name: '查看网络连接',
      command: 'netstat -tuln',
      description: '显示TCP/UDP监听端口',
      category: '网络',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-6',
      name: '查看IP地址',
      command: 'ip addr show',
      description: '显示网络接口和IP地址',
      category: '网络',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-7',
      name: '清空终端',
      command: 'clear',
      description: '清空终端屏幕',
      category: '常用',
      createdAt: Date.now(),
      useCount: 0
    },
    {
      id: 'default-8',
      name: '列出文件',
      command: 'ls -la',
      description: '详细列出当前目录文件',
      category: '文件',
      createdAt: Date.now(),
      useCount: 0
    }
  ];
}
