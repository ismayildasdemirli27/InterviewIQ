import React from "react";
import Editor from "@monaco-editor/react";
import { FiCode, FiRotateCcw } from "react-icons/fi";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  onReset?: () => void;
  height?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = "javascript",
  onReset,
  height = "380px",
  readOnly = false,
}) => {
  const normalizedLanguage =
    language.toLowerCase() === "typescript"
      ? "typescript"
      : language.toLowerCase() === "python"
      ? "python"
      : "javascript";

  return (
    <div className="monaco-editor-container" style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #334155" }}>
      <div
        className="editor-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCode style={{ color: "#818cf8" }} />
          <span style={{ fontWeight: 600, color: "#e2e8f0", textTransform: "uppercase" }}>
            {normalizedLanguage}
          </span>
          <span style={{ fontSize: "11px", color: "#64748b" }}>• UTF-8</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onReset && !readOnly && (
            <button
              type="button"
              onClick={onReset}
              title="Reset boilerplate code"
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
              }}
            >
              <FiRotateCcw /> Reset Code
            </button>
          )}
        </div>
      </div>

      <Editor
        height={height}
        language={normalizedLanguage}
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
        }}
      />
    </div>
  );
};

export default CodeEditor;
