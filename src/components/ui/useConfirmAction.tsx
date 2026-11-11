"use client";

import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { parseApiError } from "@/lib/error-utils";

interface ConfirmationRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => unknown | Promise<unknown>;
}

/** Stage an action first; only the explicit confirm button can run it. */
export function useConfirmAction() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retained = useRef<ConfirmationRequest | null>(null);
  const busy = useRef(false);
  if (request) retained.current = request;
  const current = request || retained.current;

  function confirmAction(next: ConfirmationRequest) {
    if (busy.current) return;
    setError(null);
    setRequest(next);
  }
  function close() {
    if (!busy.current) setRequest(null);
  }
  async function execute() {
    if (!request || busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await request.onConfirm();
      setRequest(null);
    } catch (reason) {
      setError(parseApiError(reason).message);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const confirmationDialog = (
    <Modal
      isOpen={!!request}
      onClose={close}
      title={current?.title || "Confirm action"}
      description={current?.description}
      icon={AlertTriangle}
      size="sm"
      bodyClassName="p-0 sm:p-0"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void execute()}
            isLoading={pending}
          >
            {current?.confirmLabel || "Confirm"}
          </Button>
        </div>
      }
    >
      {error && (
        <p
          role="alert"
          className="px-5 py-4 text-sm text-[var(--vms-danger)] sm:px-6"
        >
          {error}
        </p>
      )}
    </Modal>
  );

  return { confirmAction, confirmationDialog };
}
