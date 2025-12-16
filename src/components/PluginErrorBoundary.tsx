"use client";

import React from "react";

interface Props {
    children: React.ReactNode;
    pluginName?: string;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class PluginErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Plugin Error (${this.props.pluginName || "Unknown"}):`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                    <div className="text-center space-y-4">
                        <h2 className="text-xl font-semibold text-destructive">
                            Plugin Error
                        </h2>
                        {this.props.pluginName && (
                            <p className="text-muted-foreground">
                                An error occurred in the <strong>{this.props.pluginName}</strong> plugin.
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: undefined });
                                window.location.reload();
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

