import { useState, useEffect, useCallback, useRef } from 'react';
import type { BuildSession, BuildLog, BuildFile } from '../types/build';
import { buildApi } from '../api/buildApi';

interface UseBuildSessionReturn {
  session: BuildSession | null;
  logs: BuildLog[];
  files: BuildFile[];
  isLoading: boolean;
  error: string | null;
  startBuild: (prompt: string) => Promise<void>;
  stopBuild: () => Promise<void>;
  continueBuild: () => Promise<void>;
  sendInstruction: (content: string) => Promise<void>;
}

const POLL_INTERVAL = 1200;

export function useBuildSession(): UseBuildSessionReturn {
  const [session, setSession] = useState<BuildSession | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(false);
  const sessionStatusRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await buildApi.getStatus();
      if ('id' in data) {
        setSession(data as BuildSession);
        sessionStatusRef.current = (data as BuildSession).status;
      }
    } catch {
      // silent
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await buildApi.getLogs();
      setLogs(data.logs);
    } catch {
      // silent
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await buildApi.getFiles();
      setFiles(data.files);
    } catch {
      // silent
    }
  }, []);

  const pollAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchLogs(), fetchFiles()]);
  }, [fetchStatus, fetchLogs, fetchFiles]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    isActiveRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    isActiveRef.current = true;
    pollRef.current = setInterval(async () => {
      if (!isActiveRef.current) return;
      await pollAll();
      const s = sessionStatusRef.current;
      if (s === 'complete' || s === 'stopped' || s === 'error') {
        stopPolling();
      }
    }, POLL_INTERVAL);
  }, [pollAll, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startBuild = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await buildApi.start(prompt);
      setSession(result.session);
      sessionStatusRef.current = result.session.status;
      setLogs([]);
      setFiles([]);
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start build');
    } finally {
      setIsLoading(false);
    }
  }, [startPolling]);

  const stopBuild = useCallback(async () => {
    try {
      const result = await buildApi.stop();
      setSession(result.session);
      sessionStatusRef.current = result.session.status;
      stopPolling();
      await pollAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop build');
    }
  }, [pollAll, stopPolling]);

  const continueBuild = useCallback(async () => {
    try {
      const result = await buildApi.continue();
      setSession(result.session);
      sessionStatusRef.current = result.session.status;
      startPolling();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to continue build');
    }
  }, [startPolling]);

  const sendInstruction = useCallback(async (content: string) => {
    try {
      const result = await buildApi.sendInstruction(content);
      setSession(result.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send instruction');
    }
  }, []);

  return {
    session,
    logs,
    files,
    isLoading,
    error,
    startBuild,
    stopBuild,
    continueBuild,
    sendInstruction,
  };
}
