import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { useUploadVisitorsToGatePass } from "@/hooks/use-resident";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportResult } from "@/types";

interface UploadVisitorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    passId: string;
    houseId: string | null;
}


export function UploadVisitorsModal({
    isOpen,
    onClose,
    passId,
    houseId,
}: UploadVisitorsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadVisitorsMutation = useUploadVisitorsToGatePass(houseId);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        uploadVisitorsMutation.mutate(
            { passId, data: formData },
            {
                onSuccess: (response) => {
                    // Check if response has data property (ApiResponse) or is the data itself
                    const resultData = 'data' in response ? response.data : response;

                    if (resultData && typeof (resultData as any).total === 'number') {
                        setUploadResult(resultData as unknown as ImportResult);
                    } else {
                        setFile(null);
                        onClose();
                    }
                },
            }
        );
    };

    const handleClose = () => {
        setFile(null);
        setUploadResult(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Visitors">
            {uploadResult ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg text-center border border-muted">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{uploadResult.total}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Total Rows</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center border border-green-100 dark:border-green-900/30">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.successful}</div>
                            <div className="text-xs text-green-700/80 dark:text-green-400/80 uppercase tracking-wider font-medium mt-1">Successful</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center border border-red-100 dark:border-red-900/30">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResult.failed}</div>
                            <div className="text-xs text-red-700/80 dark:text-red-400/80 uppercase tracking-wider font-medium mt-1">Failed</div>
                        </div>
                    </div>

                    {uploadResult.failed > 0 && (
                        <div className="border border-muted rounded-md overflow-hidden">
                            <div className="bg-zinc-50 dark:bg-zinc-900 px-3 py-2 border-b border-muted">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    Error Details
                                </h3>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto divide-y divide-muted bg-background">
                                {uploadResult.results
                                    .filter(r => r.status === 'failed')
                                    .map((result, idx) => (
                                        <div key={idx} className="px-3 py-2 text-sm flex gap-3">
                                            <div className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5">Row {result.row}</div>
                                            <div className="text-red-600 dark:text-red-400">{result.error}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Upload File (CSV)</Label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                                dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                                file && "border-primary bg-primary/5"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleChange}
                            />

                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="h-10 w-10 text-primary" />
                                    <div className="text-sm font-medium text-foreground">{file.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 h-auto py-1 text-xs text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-10 w-10" />
                                    <p className="text-sm font-medium">
                                        Drag & drop or click to upload
                                    </p>
                                    <p className="text-xs">Supported formats: CSV, Excel</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-semibold mb-1">Expected Format</p>
                            <p>Your file should have columns for: <strong>name, email, phone</strong>.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={uploadVisitorsMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!file || uploadVisitorsMutation.isPending}
                        >
                            {uploadVisitorsMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Upload & Process
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
