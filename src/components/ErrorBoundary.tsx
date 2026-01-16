"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/select";
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-foreground">Something went wrong</h2>
                    <p className="mb-6 max-w-md text-sm text-muted-foreground">
                        An unexpected error occurred while rendering this component. We've been notified and are working on a fix.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reload Page
                        </Button>
                        <Button
                            onClick={this.handleReset}
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-8 overflow-auto rounded-lg bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
                            <p className="font-bold text-destructive mb-2">{this.state.error?.name}: {this.state.error?.message}</p>
                            <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
