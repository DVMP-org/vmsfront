"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import type { PlacePerson } from "@/features/people/api";
import {
  accessCredentialsApi,
  type AccessCredential,
  type AccessCredentialType,
} from "./api";

export function AccessCredentialDialog({
  person,
  onClose,
}: {
  person: PlacePerson | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [credentialType, setCredentialType] =
    useState<AccessCredentialType>("permanent_code");
  const [label, setLabel] = useState("");
  const [issuedSecret, setIssuedSecret] = useState("");
  const query = useQuery({
    queryKey: ["access-credentials", person?.party.id],
    queryFn: () => accessCredentialsApi.list(person!.party.id),
    enabled: !!person,
  });
  const issue = useMutation({
    mutationFn: () =>
      accessCredentialsApi.issue({
        party_id: person!.party.id,
        credential_type: credentialType,
        ...(label.trim() ? { label: label.trim() } : {}),
      }),
    onSuccess: async (credential) => {
      setIssuedSecret(credential.credential || "");
      setLabel("");
      await queryClient.invalidateQueries({
        queryKey: ["access-credentials", person?.party.id],
      });
      toast.success("Access credential issued");
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });
  const lifecycle = useMutation({
    mutationFn: ({
      credential,
      action,
    }: {
      credential: AccessCredential;
      action: "suspend" | "revoke" | "replace";
    }) => accessCredentialsApi.lifecycle(credential.id, action),
    onSuccess: async (credential, variables) => {
      if (variables.action === "replace" && credential.credential) {
        setIssuedSecret(credential.credential);
      }
      await queryClient.invalidateQueries({
        queryKey: ["access-credentials", person?.party.id],
      });
      toast.success(`Credential ${variables.action}d`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  useEffect(() => {
    if (!person) {
      setIssuedSecret("");
      setLabel("");
      setCredentialType("permanent_code");
    }
  }, [person]);

  if (!person) return null;
  const credentials = query.data ?? [];
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Access credentials for ${person.party.display_name}`}
      description="Permanent codes and badge QR credentials are revocable. Authorization is still evaluated against active property membership and checkpoint policy."
      size="lg"
    >
      <div className="space-y-5 p-5">
        {issuedSecret ? (
          <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-success)] bg-[var(--vms-success-subtle)] p-4 text-sm text-[var(--vms-success)]">
            <strong>New credential shown once</strong>
            <code className="mt-2 block break-all rounded-[var(--vms-radius-control)] bg-[var(--vms-surface)] p-3 text-xs text-[var(--vms-ink)]">
              {issuedSecret}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={async () => {
                await navigator.clipboard.writeText(issuedSecret);
                toast.success("Credential copied");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy credential
            </Button>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <Field id="credential-type" label="Credential type">
            {(control) => (
              <select
                {...control}
                value={credentialType}
                onChange={(event) =>
                  setCredentialType(event.target.value as AccessCredentialType)
                }
                className={fieldControlClassName}
              >
                <option value="permanent_code">Permanent code</option>
                <option value="badge_qr">Badge QR</option>
              </select>
            )}
          </Field>
          <Field id="credential-label" label="Label">
            {(control) => (
              <input
                {...control}
                value={label}
                maxLength={255}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Primary staff badge"
                className={fieldControlClassName}
              />
            )}
          </Field>
          <Button onClick={() => issue.mutate()} isLoading={issue.isPending}>
            {credentialType === "badge_qr" ? (
              <QrCode className="h-4 w-4" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Issue credential
          </Button>
        </section>

        <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)]">
          <header className="border-b border-[var(--vms-line)] px-4 py-3">
            <h3 className="font-semibold">Credential lifecycle</h3>
          </header>
          {query.isPending ? (
            <p className="p-4 text-sm">Loading credentials…</p>
          ) : query.isError ? (
            <p className="p-4 text-sm text-[var(--vms-danger)]" role="alert">
              {parseApiError(query.error).message}
            </p>
          ) : credentials.length ? (
            <ul className="divide-y divide-[var(--vms-line)]">
              {credentials.map((credential) => (
                <li
                  key={credential.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">
                        {credential.label ||
                          credential.credential_type.replaceAll("_", " ")}
                      </strong>
                      <Badge
                        variant={
                          credential.status === "active" ? "success" : "neutral"
                        }
                      >
                        {credential.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                      Issued {new Date(credential.issued_at).toLocaleString()}
                      {credential.last_used_at
                        ? ` · Last used ${new Date(credential.last_used_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  {credential.status === "active" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={lifecycle.isPending}
                        onClick={() =>
                          lifecycle.mutate({
                            credential,
                            action: "replace",
                          })
                        }
                      >
                        Replace
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={lifecycle.isPending}
                        onClick={() =>
                          lifecycle.mutate({
                            credential,
                            action: "suspend",
                          })
                        }
                      >
                        Suspend
                      </Button>
                      <Button
                        variant="destructive-outlined"
                        size="sm"
                        isLoading={lifecycle.isPending}
                        onClick={() =>
                          lifecycle.mutate({
                            credential,
                            action: "revoke",
                          })
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-[var(--vms-ink-muted)]">
              No access credentials have been issued.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
