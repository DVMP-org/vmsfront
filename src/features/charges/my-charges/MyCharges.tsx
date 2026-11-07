"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CreditCard, ExternalLink, ReceiptText } from "lucide-react";
import { parseApiError } from "@/lib/error-utils";
import { CurrentCharge, myChargesApi } from "./api";

export function MyCharges({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  const queryClient = useQueryClient();
  const charges = useQuery({
    queryKey: ["current-charges", placeId],
    queryFn: myChargesApi.list,
    retry: false,
  });
  const pay = useMutation({
    mutationFn: (scheduleId: string) => myChargesApi.pay(scheduleId),
    onSuccess: async (checkout) => {
      await queryClient.invalidateQueries({
        queryKey: ["current-charges", placeId],
      });
      window.location.assign(checkout.authorization_url);
    },
  });
  const items = (charges.data || []).filter(
    (charge) => charge.target_place.id === placeId,
  );
  const outstanding = items.reduce(
    (total, charge) => total + Number(charge.balance || 0),
    0,
  );
  const currency = items[0]?.currency || "NGN";

  if (charges.isPending) {
    return (
      <section className="mt-4 rounded-xl border border-[#dce3ee] bg-white p-5">
        <p role="status" className="text-sm text-[#667085]">
          Loading charges…
        </p>
      </section>
    );
  }

  if (charges.isError) {
    return (
      <section
        role="alert"
        className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
      >
        <p>Charges could not be loaded.</p>
        <p className="mt-1">{parseApiError(charges.error).message}</p>
        <button
          type="button"
          className="mt-3 font-semibold underline"
          onClick={() => charges.refetch()}
        >
          Retry charges
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
      <header className="flex flex-col gap-3 border-b border-[#edf0f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
            Personal charges
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Charges for {placeName}
          </h2>
        </div>
        <div className="rounded-lg bg-[#f1f6ff] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#667085]">
            Outstanding
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {currency} {formatAmount(outstanding)}
          </p>
        </div>
      </header>
      {items.length ? (
        <ul className="divide-y divide-[#edf0f5]">
          {items.map((charge) => (
            <ChargeRow
              key={charge.id}
              charge={charge}
              paying={pay.isPending && pay.variables === charge.id}
              onPay={() => pay.mutate(charge.id)}
            />
          ))}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center">
          <ReceiptText className="mx-auto h-7 w-7 text-[#98a2b3]" />
          <h3 className="mt-3 text-sm font-semibold">No charges due</h3>
          <p className="mt-1 text-xs text-[#667085]">
            Charges assigned to you for this property will appear here.
          </p>
        </div>
      )}
      {pay.isError ? (
        <p
          role="alert"
          className="border-t border-red-200 bg-red-50 px-5 py-3 text-xs text-red-800"
        >
          {parseApiError(pay.error).message}
        </p>
      ) : null}
    </section>
  );
}

function ChargeRow({
  charge,
  paying,
  onPay,
}: {
  charge: CurrentCharge;
  paying: boolean;
  onPay: () => void;
}) {
  const due = new Date(charge.due_date);
  const balance = Number(charge.balance || 0);
  const payable = charge.status === "scheduled" && balance > 0;
  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f1f6ff] text-[#2563eb]">
          <ReceiptText className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm">
            {charge.charge_definition.name}
          </strong>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667085]">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              Due {due.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="capitalize">
              {charge.charge_definition.recurrence.replaceAll("_", " ")}
            </span>
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="text-right">
          <strong className="block text-sm tabular-nums">
            {charge.currency} {formatAmount(balance)}
          </strong>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
            {charge.status}
          </span>
        </span>
        {payable ? (
          <button
            type="button"
            disabled={paying}
            onClick={onPay}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {paying ? "Opening…" : "Pay balance"}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
            <CreditCard className="h-3.5 w-3.5" />
            Settled
          </span>
        )}
      </div>
    </li>
  );
}

function formatAmount(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
