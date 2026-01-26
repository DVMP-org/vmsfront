import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { useUploadVisitorsToGatePass } from "@/hooks/use-resident";
import { Loader2, Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
                onSuccess: () => {
                    toast.success("Import has started, you should check your email for progress.");
                    setFile(null);
                    onClose();
                },
            }
        );
    };

    const handleClose = () => {
        setFile(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Visitors">
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
                        onClick={handleClose}
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
        </Modal>
    );
}