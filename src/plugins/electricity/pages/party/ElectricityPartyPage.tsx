"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/form/Field";
import { usePlaceWorkspace } from "@/features/place-workspace/PlaceWorkspaceShell";
import { EmptyRow, SectionCard, formatMoney } from "@/features/place-workspace/ui";
import { parseApiError } from "@/lib/error-utils";
import { formatDate } from "@/lib/utils";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import type { Meter } from "@/plugins/electricity/types";

/**
 * Electricity for one Place: the meters registered on this unit and token
 * purchase from the party's wallet. Rendered inside the place workspace shell.
 */
export default function ElectricityPartyPage() {
    const context = usePlaceWorkspace();
    const queryClient = useQueryClient();
    const placeId = context.place.id;
    const [purchasing, setPurchasing] = useState<Meter | null>(null);
    const [amount, setAmount] = useState("1000");
    const [token, setToken] = useState<string | null>(null);

    const metersQuery = useQuery({
        queryKey: ["electricity", "meters", placeId],
        queryFn: async () =>
            (await electricityService.getMeters({ placeId, pageSize: 100 })).data.items,
    });

    const purchasesQuery = useQuery({
        queryKey: ["electricity", "purchases", placeId],
        queryFn: async () =>
            (await electricityService.getPurchases({ placeId, pageSize: 10 })).data.items,
    });

    const purchase = useMutation({
        mutationFn: async ({ meterId, value }: { meterId: string; value: string }) =>
            electricityService.purchaseToken({ meter_id: meterId, amount: value }),
        onSuccess: (response) => {
            setToken(response.data.token ?? null);
            setPurchasing(null);
            toast.success("Token purchased");
            queryClient.invalidateQueries({
                queryKey: ["electricity", "purchases", placeId],
            });
        },
        onError: (error: unknown) => toast.error(parseApiError(error).message),
    });

    const meters = useMemo(() => metersQuery.data ?? [], [metersQuery.data]);
    const purchases = purchasesQuery.data ?? [];

    return (
        <div className="space-y-5">
            <SectionCard
                title="Meters in this place"
                description="Tokens you buy are delivered for the meter you choose."
            >
                {metersQuery.isLoading ? (
                    <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
                        Loading meters…
                    </p>
                ) : meters.length === 0 ? (
                    <EmptyRow
                        icon={Zap}
                        title="No meter registered for this place"
                        description="Ask the Site administrator to register a meter for this unit before buying tokens."
                    />
                ) : (
                    <ul className="divide-y divide-[var(--vms-line)]">
                        {meters.map((meter) => (
                            <li
                                key={meter.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold">{meter.meter_number}</p>
                                    <p className="text-xs text-[var(--vms-ink-muted)]">
                                        {meter.disco_name || meter.disco} · {meter.meter_type}
                                        {meter.meter_name ? ` · ${meter.meter_name}` : ""}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setToken(null);
                                        setPurchasing(meter);
                                    }}
                                >
                                    Buy token
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            {token ? (
                <SectionCard
                    title="Your token"
                    description="Keep this token to load the units on your meter."
                >
                    <p className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 font-mono text-lg tracking-wider">
                        {token}
                    </p>
                </SectionCard>
            ) : null}

            <SectionCard title="Recent purchases">
                {purchasesQuery.isLoading ? (
                    <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
                        Loading purchases…
                    </p>
                ) : purchases.length === 0 ? (
                    <EmptyRow
                        icon={Zap}
                        title="No purchases yet"
                        description="Token purchases for this place will appear here."
                    />
                ) : (
                    <ul className="divide-y divide-[var(--vms-line)]">
                        {purchases.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold">
                                        {entry.meter?.meter_number ?? "Meter"}
                                    </p>
                                    <p className="text-xs text-[var(--vms-ink-muted)]">
                                        {entry.created_at ? formatDate(entry.created_at) : ""}
                                        {entry.units ? ` · ${entry.units} units` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {entry.token ? (
                                        <Badge variant="success">{entry.token}</Badge>
                                    ) : null}
                                    <span className="text-sm font-medium">
                                        {formatMoney(Number(entry.amount))}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <Modal
                isOpen={Boolean(purchasing)}
                onClose={() => setPurchasing(null)}
                title="Buy electricity token"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-[var(--vms-ink-muted)]">
                        {purchasing
                            ? `${purchasing.meter_number} · ${purchasing.disco_name || purchasing.disco}`
                            : ""}
                    </p>
                    <Field
                        id="electricity-amount"
                        label="Amount"
                        required
                        hint="The amount is debited from your wallet."
                    >
                        {({ id, ...control }) => (
                            <Input
                                id={id}
                                {...control}
                                type="number"
                                min={100}
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        )}
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setPurchasing(null)}>
                            Cancel
                        </Button>
                        <Button
                            isLoading={purchase.isPending}
                            disabled={!purchasing || !amount}
                            onClick={() =>
                                purchasing &&
                                purchase.mutate({ meterId: purchasing.id, value: amount })
                            }
                        >
                            Buy token
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
