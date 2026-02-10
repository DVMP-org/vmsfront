import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useAddVisitorsToGatePass } from "@/hooks/use-resident";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface AddVisitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    passId: string;
    residencyId: string | null;
}

interface TempVisitor {
    id: string; // Temporary ID for list management
    name: string;
    email: string;
    phone: string;
}

export function AddVisitorModal({
    isOpen,
    onClose,
    passId,
    residencyId,
}: AddVisitorModalProps) {
    // Form State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // List State
    const [visitors, setVisitors] = useState<TempVisitor[]>([]);

    const addVisitorsMutation = useAddVisitorsToGatePass(residencyId);

    const handleAddToList = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error("Name is required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && email != "" && !emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        const newVisitor: TempVisitor = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            phone,
        };

        setVisitors([...visitors, newVisitor]);

        // Reset form
        setName("");
        setEmail("");
        setPhone("");
    };

    const handleRemoveFromList = (id: string) => {
        setVisitors(visitors.filter((v) => v.id !== id));
    };

    const handleSubmit = () => {
        if (visitors.length === 0) return;

        // Remove the temporary ID before sending to API
        const apiPayload = visitors.map(({ name, email, phone }) => ({
            name,
            email,
            phone: phone || undefined,
        }));

        addVisitorsMutation.mutate(
            { passId, data: apiPayload },
            {
                onSuccess: () => {
                    setVisitors([]);
                    setName("");
                    setEmail("");
                    setPhone("");
                    onClose();
                },
            }
        );
    };

    const handleClose = () => {
        setVisitors([]);
        setName("");
        setEmail("");
        setPhone("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Visitors" size="lg">
            <div className="space-y-6">
                {/* Input Form */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-muted">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        New Visitor Details
                    </h3>
                    <form onSubmit={handleAddToList} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4 space-y-1.5">
                            <Label htmlFor="visitor-name" className="text-xs">Full Name *</Label>
                            <Input
                                id="visitor-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="h-9"
                            />
                        </div>
                        <div className="sm:col-span-4 space-y-1.5">
                            <Label htmlFor="visitor-email" className="text-xs">Email *</Label>
                            <Input
                                id="visitor-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="h-9"
                            />
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                            <Label htmlFor="visitor-phone" className="text-xs">Phone</Label>
                            <Input
                                id="visitor-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1..."
                                className="h-9"
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <Button type="submit" size="sm" className="w-full h-9" disabled={!name}>
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add</span>
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Visitors List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Visitors to Add <span className="text-muted-foreground ml-1">({visitors.length})</span>
                        </h3>
                        {visitors.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setVisitors([])} className="h-7 text-xs text-destructive hover:text-destructive">
                                Clear All
                            </Button>
                        )}
                    </div>

                    {visitors.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                            No visitors added to the list yet.
                        </div>
                    ) : (
                        <div className="border border-muted rounded-md divide-y divide-muted max-h-[300px] overflow-y-auto">
                            {visitors.map((visitor) => (
                                <div key={visitor.id} className="p-3 flex items-center justify-between bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 flex-1 mr-4">
                                        <div className="font-medium text-sm truncate">{visitor.name}</div>
                                        <div className="text-xs text-muted-foreground sm:text-sm truncate">{visitor.email || "-"}</div>
                                        <div className="text-xs text-muted-foreground sm:text-sm truncate">{visitor.phone || "-"}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveFromList(visitor.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={addVisitorsMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={visitors.length === 0 || addVisitorsMutation.isPending}
                    >
                        {addVisitorsMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add {visitors.length} Visitor{visitors.length !== 1 ? 's' : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
