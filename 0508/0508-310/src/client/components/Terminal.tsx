import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { transportService } from '../services/transport';

interface TerminalProps {
  sessionId: string | null;
  onData?: (data: string) => void;
}

const WRITE_CHUNK_SIZE = 1024;
const WRITE_INTERVAL = 10;

export function TerminalComponent({ sessionId, onData }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastInputTime = useRef<number>(0);
  const writeQueue = useRef<string[]>([]);
  const isWriting = useRef(false);
  const writeTimeout = useRef<NodeJS.Timeout | null>(null);

  const processWriteQueue = useCallback(() => {
    if (writeQueue.current.length === 0 || !xtermRef.current) {
      isWriting.current = false;
      return;
    }

    isWriting.current = true;
    const chunk = writeQueue.current.shift()!;
    xtermRef.current.write(chunk, () => {
      writeTimeout.current = setTimeout(processWriteQueue, WRITE_INTERVAL);
    });
  }, []);

  const writeData = useCallback((data: string) => {
    if (!xtermRef.current) return;

    if (data.length <= WRITE_CHUNK_SIZE) {
      xtermRef.current.write(data);
      return;
    }

    for (let i = 0; i < data.length; i += WRITE_CHUNK_SIZE) {
      writeQueue.current.push(data.slice(i, i + WRITE_CHUNK_SIZE));
    }

    if (!isWriting.current) {
      processWriteQueue();
    }
  }, [processWriteQueue]);

  const handleData = useCallback((data: string) => {
    const now = performance.now();
    const latency = now - lastInputTime.current;
    
    if (latency > 0 && latency < 1000) {
      console.debug(`Input latency: ${latency.toFixed(2)}ms`);
    }

    if (sessionId) {
      transportService.send({
        type: 'data',
        data
      });
    }
    
    onData?.(data);
  }, [sessionId, onData]);

  const handleResize = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      const { cols, rows } = xtermRef.current;
      
      if (sessionId) {
        transportService.send({
          type: 'resize',
          cols,
          rows
        });
      }
    }
  }, [sessionId]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!xtermRef.current || !sessionId) return;
    
    const text = e.clipboardData?.getData('text');
    if (!text) return;

    e.preventDefault();
    
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    if (normalizedText.length <= WRITE_CHUNK_SIZE) {
      xtermRef.current.write(normalizedText);
      handleData(normalizedText);
      return;
    }

    let offset = 0;
    const writeNextChunk = () => {
      if (offset >= normalizedText.length) return;
      
      const chunk = normalizedText.slice(offset, offset + WRITE_CHUNK_SIZE);
      offset += WRITE_CHUNK_SIZE;
      
      xtermRef.current?.write(chunk, () => {
        handleData(chunk);
        setTimeout(writeNextChunk, WRITE_INTERVAL);
      });
    };
    
    writeNextChunk();
  }, [sessionId, handleData]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264F78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      allowTransparency: true,
      scrollback: 10000,
      convertEol: false,
      logLevel: 'info',
      rendererType: 'canvas'
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => {
      lastInputTime.current = performance.now();
      handleData(data);
    });

    term.onTitleChange((title) => {
      if (title) {
        document.title = title;
      }
    });

    const terminalElement = terminalRef.current;
    terminalElement.addEventListener('paste', handlePaste);

    window.addEventListener('resize', handleResize);

    const messageHandler = (message: any) => {
      if (message.type === 'data' && message.data) {
        writeData(message.data);
      } else if (message.type === 'error' && message.message) {
        writeData(`\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`);
      }
    };

    transportService.setOnMessage(messageHandler);

    return () => {
      if (writeTimeout.current) {
        clearTimeout(writeTimeout.current);
      }
      writeQueue.current = [];
      terminalElement.removeEventListener('paste', handlePaste);
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [handleData, handleResize, handlePaste, writeData]);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      if (!sessionId) {
        xtermRef.current.write('\x1b[32mWelcome to WebSSH\x1b[0m\r\n');
        xtermRef.current.write('Please connect to a server to start...\r\n');
      }
    }
  }, [sessionId]);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        padding: '8px'
      }} 
    />
  );
}
