"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { parseApiError } from "@/lib/error-utils";
import { hospitalityApi } from "@/features/hospitality/api";
import {
  HospitalityAdminPage,
  ModuleMetrics,
  ModulePanel,
  StatusPill,
  displayDate,
  money,
} from "@/features/hospitality/HospitalityAdminPage";
import type { GuestFolioLine } from "@/features/hospitality/contracts";
import { useHospitalityAccess } from "@/features/hospitality/use-hospitality-access";

export function BillingWorkspace() {
  const access = useHospitalityAccess();
  const client = useQueryClient();
  const search = useSearchParams();
  const requestedStay = search.get("stay") || "";
  const [stayId, setStayId] = useState(requestedStay);
  const [mode, setMode] = useState<"charge" | "payment">("charge");
  const [notice, setNotice] = useState("");
  const stays = useQuery({
    queryKey: ["hospitality-billing-stays", access.contextKey],
    queryFn: () => hospitalityApi.list(1, "checked_in"),
    enabled: !!access.organization?.id && access.allowed("list"),
  });
  useEffect(() => {
    if (requestedStay) {
      setStayId(requestedStay);
      return;
    }
    const first = stays.data?.items[0]?.id;
    if (!stayId && first) setStayId(first);
  }, [requestedStay, stayId, stays.data?.items]);
  const folio = useQuery({
    queryKey: ["hospitality-folio", access.contextKey, stayId],
    queryFn: () => hospitalityApi.folios.get(stayId),
    enabled: !!stayId && access.allowed("show"),
  });
  const stay = stays.data?.items.find((item) => item.id === stayId);
  const mutate = useMutation({
    mutationFn: (body: {
      mode: "charge" | "payment";
      amount: string;
      description: string;
      category?: "room" | "service" | "charge";
      reference?: string;
    }) =>
      body.mode === "payment"
        ? hospitalityApi.folios.recordPayment(stayId, {
            amount: body.amount,
            reference: body.reference,
          })
        : hospitalityApi.folios.addLine(stayId, {
            amount: body.amount,
            description: body.description,
            category: body.category || "charge",
          }),
    onSuccess: (next) => {
      setNotice(mode === "payment" ? "Payment recorded." : "Charge added.");
      client.setQueryData(
        ["hospitality-folio", access.contextKey, stayId],
        next,
      );
    },
  });
  const lines = folio.data?.lines ?? [];
  const columns: Column<GuestFolioLine>[] = [
    {
      key: "created_at",
      header: "Posted",
      sortable: true,
      accessor: (line) => (
        <div>
          <span className="block">{displayDate(line.created_at, true)}</span>
          <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
            {line.category}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      accessor: (line) => line.description,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      accessor: (line) => (
        <span
          className={
            line.category === "payment"
              ? "font-semibold text-[var(--vms-success)]"
              : "font-semibold"
          }
        >
          {line.category === "payment" ? "−" : ""}
          {money(line.amount, line.currency)}
        </span>
      ),
    },
  ];
  return (
    <HospitalityAdminPage
      access={access}
      title="Guest billing"
      description="Post room and service charges, record payments and keep the guest balance ready for check-out."
      primaryAction={
        access.allowed("update") && stayId ? (
          <Button
            onClick={() => {
              setMode("charge");
              setNotice("");
            }}
          >
            Post charge
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <ModulePanel
          title="Select guest folio"
          description="Billing starts from an in-house reservation. Arrivals can be billed after check-in."
        >
          {stays.isError ? (
            <InlineAlert
              tone="danger"
              title="In-house stays could not be loaded"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stays.refetch()}
                >
                  Retry
                </Button>
              }
            >
              {parseApiError(stays.error).message}
            </InlineAlert>
          ) : stays.isPending ? (
            <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
              Loading in-house stays…
            </p>
          ) : stays.data?.items.length ? (
            <div className="grid max-w-2xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="space-y-1.5 text-sm font-medium">
                <span>In-house guest</span>
                <select
                  value={stayId}
                  onChange={(event) => {
                    setStayId(event.currentTarget.value);
                    setNotice("");
                  }}
                  className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
                >
                  <option value="">Choose a guest</option>
                  {stays.data.items.map((item) => {
                    const guest =
                      item.guests.find((entry) => entry.role === "primary") ||
                      item.guests[0];
                    return (
                      <option key={item.id} value={item.id}>
                        {guest?.party.display_name || "Guest"} ·{" "}
                        {item.room_assignments.at(-1)?.room.name ||
                          "No room assigned"}
                      </option>
                    );
                  })}
                </select>
              </label>
              <Button
                variant="outline"
                onClick={() => folio.refetch()}
                disabled={!stayId || folio.isFetching}
              >
                Refresh folio
              </Button>
            </div>
          ) : (
            <InlineAlert tone="info" title="No checked-in guests">
              Check a reservation in from the Reservations workspace before
              posting a guest charge.
            </InlineAlert>
          )}
        </ModulePanel>
        {notice ? <InlineAlert tone="success" title={notice} /> : null}
        {folio.isError ? (
          <InlineAlert
            tone="danger"
            title="Guest folio could not be loaded"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => folio.refetch()}
              >
                Retry
              </Button>
            }
          >
            {parseApiError(folio.error).message}
          </InlineAlert>
        ) : stayId && folio.isPending ? (
          <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
            Loading folio…
          </p>
        ) : folio.data ? (
          <>
            <ModuleMetrics
              items={[
                {
                  label: "Guest",
                  value:
                    folio.data.guest_name ||
                    stay?.guests.find((guest) => guest.role === "primary")
                      ?.party.display_name ||
                    "Selected stay",
                  detail: stay?.room_assignments.at(-1)?.room.name
                    ? `Room ${stay.room_assignments.at(-1)?.room.name}`
                    : "Room not reported",
                  icon: ReceiptText,
                },
                {
                  label: "Charges",
                  value: money(folio.data.total, folio.data.currency),
                  detail: `${lines.length} posted lines`,
                  icon: CircleDollarSign,
                },
                {
                  label: "Paid",
                  value: money(folio.data.paid, folio.data.currency),
                  detail: "Payments received",
                  icon: CreditCard,
                },
                {
                  label: "Balance",
                  value: money(folio.data.balance, folio.data.currency),
                  detail:
                    folio.data.status === "settled"
                      ? "Folio settled"
                      : "Outstanding at departure",
                  icon: WalletCards,
                },
              ]}
            />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
              <ModulePanel
                title="Folio activity"
                description="Charges and payments are shown in posting order."
                action={
                  <StatusPill
                    tone={
                      folio.data.status === "settled"
                        ? "success"
                        : folio.data.status === "void"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {folio.data.status}
                  </StatusPill>
                }
              >
                <DataTable
                  data={lines}
                  columns={columns}
                  tableLabel="Guest folio lines"
                  searchPlaceholder="Search posted activity"
                  availableFilters={[
                    {
                      field: "category",
                      label: "Kind",
                      type: "select",
                      options: [
                        { value: "room", label: "Room charge" },
                        { value: "service", label: "Service" },
                        { value: "charge", label: "Other charge" },
                        { value: "payment", label: "Payment" },
                      ],
                    },
                  ]}
                  emptyMessage="No charges or payments have been posted."
                  mobileSummary={(line) => (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block">{line.description}</strong>
                        <span className="text-xs capitalize text-[var(--vms-ink-muted)]">
                          {line.category} · {displayDate(line.created_at, true)}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {line.category === "payment" ? "−" : ""}
                        {money(line.amount, line.currency)}
                      </span>
                    </div>
                  )}
                />
              </ModulePanel>
              <ModulePanel
                title={mode === "payment" ? "Record payment" : "Post charge"}
                description={
                  mode === "payment"
                    ? "Payments reduce the outstanding guest balance."
                    : "Charges appear immediately on the guest folio."
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMode((current) =>
                        current === "payment" ? "charge" : "payment",
                      )
                    }
                  >
                    {mode === "payment" ? "Post charge" : "Record payment"}
                  </Button>
                }
              >
                <FolioEntryForm
                  key={mode}
                  mode={mode}
                  currency={folio.data.currency}
                  disabled={!access.allowed("update")}
                  pending={mutate.isPending}
                  error={
                    mutate.isError ? parseApiError(mutate.error).message : ""
                  }
                  onSubmit={(values) => {
                    setNotice("");
                    mutate.mutate({ ...values, mode });
                  }}
                />
              </ModulePanel>
            </div>
          </>
        ) : (
          <ModulePanel title="No guest selected">
            <p className="text-sm text-[var(--vms-ink-muted)]">
              Choose an in-house guest to review or post billing activity.
            </p>
          </ModulePanel>
        )}
      </div>
    </HospitalityAdminPage>
  );
}

function FolioEntryForm({
  mode,
  currency,
  disabled,
  pending,
  error,
  onSubmit,
}: {
  mode: "charge" | "payment";
  currency: string;
  disabled: boolean;
  pending: boolean;
  error: string;
  onSubmit: (values: {
    amount: string;
    description: string;
    category?: "room" | "service" | "charge";
    reference?: string;
  }) => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"room" | "service" | "charge">(
    "service",
  );
  const [reference, setReference] = useState("");
  const [validation, setValidation] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setValidation("Enter an amount greater than zero.");
      return;
    }
    if (mode === "charge" && !description.trim()) {
      setValidation("Describe the charge.");
      return;
    }
    setValidation("");
    onSubmit({
      amount: parsed.toFixed(2),
      description: mode === "payment" ? "Guest payment" : description.trim(),
      category: mode === "charge" ? category : undefined,
      reference: reference.trim() || undefined,
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "charge" ? (
        <>
          <Input
            label="Description"
            required
            value={description}
            placeholder="Minibar, laundry, room service…"
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
          <label className="space-y-1.5 text-sm font-medium">
            <span>Charge type</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.currentTarget.value as "room" | "service" | "charge",
                )
              }
              className="h-[var(--vms-control-height)] w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base sm:text-sm"
            >
              <option value="service">Service</option>
              <option value="room">Room</option>
              <option value="charge">Other charge</option>
            </select>
          </label>
        </>
      ) : (
        <Input
          label="Payment reference"
          value={reference}
          placeholder="Card, cash or transfer reference"
          onChange={(event) => setReference(event.currentTarget.value)}
        />
      )}
      <Input
        label={`Amount (${currency})`}
        required
        type="number"
        min="0.01"
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.currentTarget.value)}
      />
      {(validation || error) && (
        <InlineAlert tone="danger" title="Entry was not saved">
          {validation || error}
        </InlineAlert>
      )}
      <Button
        type="submit"
        disabled={disabled}
        isLoading={pending}
        className="w-full"
      >
        {mode === "payment" ? "Record payment" : "Post charge"}
      </Button>
    </form>
  );
}
