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
import { EmptyRow, SectionCard } from "@/features/place-workspace/ui";
import { WalletSummaryCard } from "@/features/wallet/WalletSummaryCard";
import { useWallet } from "@/features/wallet/queries";
import { formatMoney } from "@/lib/currency";
import { parseApiError } from "@/lib/error-utils";
import { formatDate } from "@/lib/utils";
import { electricityService } from "@/plugins/electricity/services/electricity-service";
import type { Meter, PurchaseToken } from "@/plugins/electricity/types";

const MINOR_PER_MAJOR = 100;

/**
 * Electricity for one Place: the meters on this unit, the Party wallet that
 * funds a purchase, and the durable purchase record.
 *
 * Buying is two server steps: a quote that says which tenders the payment
 * policy allows, then the purchase itself. A successful HTTP response is not
 * proof of delivery — the purchase only becomes `confirmed` when the provider
 * returns a token.
 */
export default function ElectricityPartyPage() {
    const context = usePlaceWorkspace();
    const queryClient = useQueryClient();
    const placeId = context.place.id;
    const [purchasing, setPurchasing] = useState<Meter | null>(null);
    const [amount, setAmount] = useState("1000");
    const [result, setResult] = useState<PurchaseToken | null>(null);

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

    const walletQuery = useWallet(placeId);

    const purchase = useMutation({
      mutationFn: async ({ meterId, value }: { meterId: string; value: string }) => {
          // The quote is advisory, but it fails fast when no tender is allowed.
          const quote = await electricityService.getPurchaseQuote({
              meter_id: meterId,
              amount: value,
          });
          return electricityService.purchaseToken({
              meter_id: meterId,
              amount: value,
              tender: quote.data.default_tender,
          });
      },
      onSuccess: async (response) => {
          setResult(response.data);
          setPurchasing(null);
        queryClient.invalidateQueries({
            queryKey: ["electricity", "purchases", placeId],
        });
        queryClient.invalidateQueries({ queryKey: ["wallet", placeId] });
        if (response.data.status === "confirmed") {
            toast.success("Token purchased");
        } else if (response.data.status === "failed") {
            toast.error(
                "The provider rejected this purchase; your funds were released",
            );
        } else {
            toast.message("Purchase submitted", {
                description:
                    "Your token appears here as soon as the provider confirms the vend.",
            });
        }
      },
      onError: (error: unknown) => toast.error(parseApiError(error).message),
  });

    const wallet = walletQuery.data;
    const available = wallet ? Number(wallet.available) : 0;
    const meters = useMemo(() => metersQuery.data ?? [], [metersQuery.data]);
    const purchases = purchasesQuery.data ?? [];

    return (
        <div className="space-y-5">
          <WalletSummaryCard placeId={placeId} />

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
                            setResult(null);
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

          {result ? (
              <SectionCard
                  title="Purchase status"
                  description={`${result.tender === "wallet" ? "Paid from wallet" : "Paid by card"} · ${formatMoney(Number(result.amount))}`}
              >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge
                          variant={
                              result.status === "confirmed"
                                  ? "success"
                                  : result.status === "failed"
                                      ? "danger"
                                      : "warning"
                          }
                      >
                          {result.status.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-xs text-[var(--vms-ink-muted)]">
                          {result.reference}
                      </span>
                  </div>
                  {result.token ? (
                      <p className="mt-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] p-4 font-mono text-lg tracking-wider">
                          {result.token}
                      </p>
                  ) : (
                      <p className="mt-3 text-sm text-[var(--vms-ink-muted)]">
                          No token yet. A purchase is only complete when the provider confirms
                          it; if it stays pending the Site administrator can requery the
                          provider without charging you twice.
                      </p>
                  )}
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
                        {entry.status ? (
                            <Badge
                                variant={
                                    entry.status === "confirmed"
                                        ? "success"
                                        : entry.status === "failed"
                                            ? "danger"
                                            : "warning"
                                }
                            >
                                {entry.status.replaceAll("_", " ")}
                            </Badge>
                        ) : null}
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
                      hint={`Paid from your wallet (${formatMoney(available)} available).`}
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
                  {wallet && Number(amount) * MINOR_PER_MAJOR > wallet.available_minor ? (
                      <p className="text-sm text-[var(--vms-ink-muted)]">
                          This is more than your available balance. Fund the wallet first —
                          nothing is charged automatically.
                      </p>
                  ) : null}
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
