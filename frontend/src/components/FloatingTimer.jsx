import { useState, useRef, useEffect } from "react";
import { Square, GripVertical, X } from "lucide-react";
import { useTimer } from "../contexts/TimerContext";
import api from "../api/client";

const STORAGE_KEY = "floating-timer-position";

function formatSeconds(sec) {
  const s = Number(sec || 0);
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${ss}`;
}

function loadPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { x, y } = JSON.parse(saved);
      return { x: Number(x), y: Number(y) };
    }
  } catch (_) {}
  return { x: 24, y: 24 };
}

function savePosition(x, y) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch (_) {}
}

export default function FloatingTimer() {
  const { taskId, taskTitle, projectName, totalSeconds, clearTimer, isActive } = useTimer();
  const [position, setPosition] = useState(loadPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    setPosition(loadPosition());
  }, []);

  const handleStop = async () => {
    if (!taskId || stopping) return;
    setStopping(true);
    try {
      await api.post(`/tasks/${taskId}/time/stop`);
      clearTimer();
    } catch (e) {
      console.error("error stop timer", e);
    } finally {
      setStopping(false);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest("button")) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
    };
  };

  const lastPositionRef = useRef(position);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(0, dragRef.current.startLeft + dx);
      const newY = Math.max(0, dragRef.current.startTop + dy);
      lastPositionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });
    };
    const onUp = () => {
      setIsDragging(false);
      savePosition(lastPositionRef.current.x, lastPositionRef.current.y);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  if (!isActive) return null;

  return (
    <div
      role="dialog"
      aria-label="Chrono en cours"
      className="fixed z-[9999] w-72 rounded-xl border-2 border-primary/30 bg-base-100 shadow-2xl overflow-hidden select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-base-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-base-content/60 shrink-0" />
        <span className="text-xs font-medium text-base-content/80 truncate flex-1">
          Chrono en cours
        </span>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-base-content truncate" title={taskTitle}>
            {taskTitle}
          </p>
          {projectName && (
            <p className="text-xs text-base-content/60 truncate">{projectName}</p>
          )}
        </div>

        <p className="text-2xl font-mono font-bold tabular-nums text-primary">
          {formatSeconds(totalSeconds)}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStop}
            disabled={stopping}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-error/15 text-error hover:bg-error/25 border border-error/30 py-2 px-3 text-sm font-medium disabled:opacity-50"
          >
            <Square className="h-4 w-4" />
            {stopping ? "Arrêt..." : "Arrêter"}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={stopping}
            aria-label="Fermer"
            className="p-2 rounded-lg border border-base-300 hover:bg-base-200 text-base-content/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
