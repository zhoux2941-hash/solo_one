import React, { useState, useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Square, BookOpen, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { EXAMPLE_LUA_SCRIPT, LUA_API_REFERENCE } from "../types";

type ScriptState = "Idle" | "Running" | "Error";

interface ScriptOutput {
  timestamp: number;
  level: "info" | "error" | "warn";
  message: string;
}

const ScriptEditor: React.FC = () => {
  const [script, setScript] = useState(EXAMPLE_LUA_SCRIPT);
  const [scriptState, setScriptState] = useState<ScriptState>("Idle");
  const [output, setOutput] = useState<ScriptOutput[]>([]);
  const [showApiRef, setShowApiRef] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  useEffect(() => {
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  const addOutput = useCallback((level: ScriptOutput["level"], message: string) => {
    setOutput((prev) => [
      ...prev,
      { timestamp: Date.now(), level, message },
    ]);
  }, []);

  const runScript = useCallback(async () => {
    setScriptState("Running");
    setOutput([]);
    try {
      const unlisten = await listen<string>("script-output", (event) => {
        addOutput("info", event.payload);
      });
      const unlistenErr = await listen<string>("script-error", (event) => {
        addOutput("error", event.payload);
      });
      unlistenRef.current = () => {
        unlisten();
        unlistenErr();
      };

      await invoke("run_lua_script", { script });
      addOutput("info", "Script execution started");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addOutput("error", `Failed to start script: ${msg}`);
      setScriptState("Error");
    }
  }, [script, addOutput]);

  const stopScript = useCallback(async () => {
    try {
      await invoke("stop_lua_script");
      addOutput("info", "Script execution stopped");
      setScriptState("Idle");
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addOutput("error", `Failed to stop script: ${msg}`);
    }
  }, [addOutput]);

  const STATE_COLORS: Record<ScriptState, string> = {
    Idle: "text-analyzer-text-dim",
    Running: "text-analyzer-success",
    Error: "text-analyzer-danger",
  };

  const STATE_DOT_COLORS: Record<ScriptState, string> = {
    Idle: "bg-analyzer-text-dim",
    Running: "bg-analyzer-success animate-pulse",
    Error: "bg-analyzer-danger",
  };

  return (
    <div className="flex h-full">
      <div className={`flex flex-col ${showApiRef ? "flex-1" : "w-full"}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-analyzer-border bg-analyzer-surface">
          <span className="text-xs font-semibold text-analyzer-text">Lua Script</span>
          <div className="flex items-center gap-1 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${STATE_DOT_COLORS[scriptState]}`} />
            <span className={STATE_COLORS[scriptState]}>{scriptState}</span>
          </div>
          <div className="flex-1" />
          <button
            className="btn-secondary text-xs flex items-center gap-1 px-2 py-0.5"
            onClick={() => setShowApiRef(!showApiRef)}
          >
            <BookOpen size={10} />
            API Ref
          </button>
          {scriptState === "Running" ? (
            <button
              className="btn-danger text-xs flex items-center gap-1 px-2 py-0.5"
              onClick={stopScript}
            >
              <Square size={10} />
              Stop
            </button>
          ) : (
            <button
              className="btn-primary text-xs flex items-center gap-1 px-2 py-0.5"
              onClick={runScript}
            >
              <Play size={10} />
              Run
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language="lua"
            theme="vs-dark"
            value={script}
            onChange={(val) => setScript(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 8 },
              renderLineHighlight: "line",
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        </div>

        <div className="h-40 border-t border-analyzer-border flex flex-col">
          <div className="flex items-center px-3 py-1 bg-analyzer-surface border-b border-analyzer-border">
            <span className="text-[10px] text-analyzer-text-dim font-medium">OUTPUT</span>
            <div className="flex-1" />
            <button
              className="text-analyzer-text-dim hover:text-analyzer-text text-[10px]"
              onClick={() => setOutput([])}
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-analyzer-bg p-2 font-mono text-[11px]">
            {output.map((entry, i) => (
              <div
                key={i}
                className={`${
                  entry.level === "error"
                    ? "text-analyzer-danger"
                    : entry.level === "warn"
                    ? "text-analyzer-warning"
                    : "text-analyzer-text"
                }`}
              >
                <span className="text-analyzer-text-dim mr-2">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                {entry.message}
              </div>
            ))}
            <div ref={outputEndRef} />
          </div>
        </div>
      </div>

      {showApiRef && (
        <div className="w-64 border-l border-analyzer-border bg-analyzer-surface overflow-auto flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-analyzer-border">
            <span className="text-xs font-semibold text-analyzer-text">API Reference</span>
            <button
              className="text-analyzer-text-dim hover:text-analyzer-text"
              onClick={() => setShowApiRef(false)}
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {LUA_API_REFERENCE.map((cat) => (
              <div key={cat.category} className="mb-3">
                <div className="text-[10px] font-semibold text-analyzer-accent mb-1">
                  {cat.category}
                </div>
                {cat.functions.map((fn) => (
                  <div key={fn.name} className="mb-1">
                    <div className="text-[10px] text-analyzer-text font-mono">{fn.name}</div>
                    <div className="text-[9px] text-analyzer-text-dim pl-2">{fn.desc}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
