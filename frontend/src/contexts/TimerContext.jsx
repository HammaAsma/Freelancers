import { createContext, useContext, useState, useEffect, useCallback } from "react";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [timer, setTimer] = useState({
    taskId: null,
    taskTitle: null,
    projectName: null,
    baseSeconds: 0,
    elapsedSeconds: 0,
  });

  useEffect(() => {
    if (!timer.taskId) return;
    const interval = setInterval(() => {
      setTimer((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.taskId]);

  const setActiveTimer = useCallback(
    ({ taskId, taskTitle, projectName, elapsedSeconds = 0, totalSecondsBefore = 0 }) => {
      setTimer({
        taskId,
        taskTitle: taskTitle || "Tâche",
        projectName: projectName || null,
        baseSeconds: totalSecondsBefore,
        elapsedSeconds,
      });
    },
    []
  );

  const clearTimer = useCallback(() => {
    setTimer({
      taskId: null,
      taskTitle: null,
      projectName: null,
      baseSeconds: 0,
      elapsedSeconds: 0,
    });
  }, []);

  const totalSeconds = timer.baseSeconds + timer.elapsedSeconds;

  const value = {
    ...timer,
    totalSeconds,
    isActive: !!timer.taskId,
    setActiveTimer,
    clearTimer,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
