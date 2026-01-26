"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Terminal, Play, Square, Trash2, ArrowDownCircle, Download, FileDown, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface LogsViewerProps {
    className?: string;
}

export function LogsViewer({ className }: LogsViewerProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { token } = useAuthStore();

    const connectToStream = useCallback(async () => {
        if (isConnected) return;

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;
            setIsConnected(true);

            // Ensure API_URL is defined, fallback to window.origin if not (or handle error)
            const baseUrl = API_URL || '';
            const response = await fetch(`${baseUrl}/admin/logs/stream`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream',
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Connection failed: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No readable stream available");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);

                setLogs(prev => {
                    // Keep last 1000 logs to prevent memory issues
                    const newLogs = [...prev, ...lines];
                    return newLogs.slice(-1000);
                });
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Stream error:", error);
                toast.error("Lost connection to log stream");
            }
        } finally {
            setIsConnected(false);
            abortControllerRef.current = null;
        }
    }, [token, isConnected]);

    const disconnectStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsConnected(false);
            toast.info("Stream disconnected");
        }
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const downloadBuffer = useCallback(() => {
        if (logs.length === 0) {
            toast.error("No logs to download");
            return;
        }

        const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-buffer-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Log buffer downloaded");
    }, [logs]);

    const downloadFullLogs = useCallback(async () => {
        try {
            toast.loading("Preparing download...");
            const baseUrl = API_URL || '';
            const response = await fetch(`${baseUrl}/admin/logs/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Try to get filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `system-logs-${new Date().toISOString()}.txt`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) fileName = match[1];
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success("Logs downloaded successfully");
        } catch (error) {
            console.error('Download error:', error);
            toast.dismiss();
            toast.error("Failed to download logs");
        }
    }, [token]);

    // Auto-scroll effect
    useEffect(() => {
        if (isAutoScroll && scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [logs, isAutoScroll]);

    // Initial connection
    useEffect(() => {
        connectToStream();
        return () => {
            disconnectStream();
        };
    }, []); // Run once on mount

    return (
        <div className={cn("flex flex-col space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg text-green-500">
                        <Terminal className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">System Logs</h1>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "flex h-2 w-2 rounded-full",
                                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                            )} />
                            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                {isConnected ? "Live Stream Active" : "Disconnected"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAutoScroll(!isAutoScroll)}
                        className={cn(
                            "gap-2 transition-all",
                            isAutoScroll && "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        )}
                    >
                        <ArrowDownCircle className={cn("h-4 w-4", isAutoScroll && "animate-bounce")} />
                        Auto-scroll {isAutoScroll ? "On" : "Off"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadFullLogs}
                        className="gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Download className="h-4 w-4" />
                        Full Log
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadBuffer}
                        className="gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <Save className="h-4 w-4" />
                        Save View
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearLogs}
                        className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear
                    </Button>
                    <div className="h-6 w-[1px] bg-border mx-2" />
                    {isConnected ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={disconnectStream}
                            className="gap-2 shadow-sm"
                        >
                            <Square className="h-4 w-4 fill-current" />
                            Stop Stream
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={connectToStream}
                            className="gap-2 shadow-sm"
                        >
                            <Play className="h-4 w-4 fill-current" />
                            Connect
                        </Button>
                    )}
                </div>
            </div>

            {/* Terminal Window */}
            <Card className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                        Console Output
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-1">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4 pt-32">
                                <Terminal className="h-12 w-12 opacity-20" />
                                <p className="text-sm">Waiting for incoming log data...</p>
                            </div>
                        ) : (
                            logs.map((log, idx) => (
                                <div key={idx} className="text-sm md:text-xs leading-relaxed break-all hover:bg-white/5 px-2 py-0.5 rounded transition-colors flex gap-3">
                                    <span className="text-zinc-600 select-none w-8 text-right flex-shrink-0">{idx + 1}</span>
                                    <span className={cn(
                                        log.toLowerCase().includes('error') ? "text-red-400 font-bold" :
                                            log.toLowerCase().includes('warn') ? "text-yellow-400" :
                                                log.toLowerCase().includes('info') ? "text-blue-300" :
                                                    "text-zinc-300"
                                    )}>
                                        {log}
                                    </span>
                                </div>
                            ))
                        )}
                        {/* Scroll anchor */}
                        <div id="log-end" />
                    </div>
                </ScrollArea>

                {/* Status Footer */}
                <div className="px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between font-medium">
                    <span>Buffer: {logs.length}/1000 lines</span>
                    <span>{isConnected ? "● Connected via Stream" : "○ Disconnected"}</span>
                </div>
            </Card>
        </div>
    );
}
