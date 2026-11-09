"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { useAppStore } from "@/store/app-store";
import { Gate, CreateGateRequest, UpdateGateRequest } from "@/types";
import { useCreateGate, useUpdateGate } from "@/hooks/use-admin";

const gateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  is_default: z.boolean().optional(),
  slug: z.string().optional(),
  allowed_entry: z.boolean(),
  allowed_exit: z.boolean(),
  automatic_direction: z.boolean(),
  manual_direction_override: z.boolean(),
  offline_policy: z.enum(["deny", "queue", "allow_verified"]),
  reentry_policy: z.enum(["allowed", "denied", "manual"]),
  allowed_credential_types: z.array(z.string()).min(1),
  access_days: z.array(z.number()),
  access_start: z.string(),
  access_end: z.string(),
});

type GateFormValues = z.infer<typeof gateSchema>;

interface GateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gate?: Gate;
}

const credentialOptions = [
  { value: "invitation_code", label: "Invitation IDs" },
  { value: "invitation_qr", label: "Invitation QR" },
  { value: "badge_qr", label: "Registered-party badge QR" },
  { value: "permanent_code", label: "Permanent access codes" },
];

const weekdays = [
  [0, "Mon"],
  [1, "Tue"],
  [2, "Wed"],
  [3, "Thu"],
  [4, "Fri"],
  [5, "Sat"],
  [6, "Sun"],
] as const;

export function GateFormModal({ isOpen, onClose, gate }: GateFormModalProps) {
  const isEditing = !!gate;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedProperty = useAppStore((state) => state.selectedProperty);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GateFormValues>({
    resolver: zodResolver(gateSchema),
    defaultValues: {
      name: "",
      is_default: false,
      slug: "",
      allowed_entry: true,
      allowed_exit: true,
      automatic_direction: true,
      manual_direction_override: false,
      offline_policy: "deny",
      reentry_policy: "allowed",
      allowed_credential_types: [
        "invitation_code",
        "invitation_qr",
        "badge_qr",
        "permanent_code",
      ],
      access_days: [],
      access_start: "",
      access_end: "",
    },
  });

  const watchIsDefault = watch("is_default");
  const watchAllowedEntry = watch("allowed_entry");
  const watchAllowedExit = watch("allowed_exit");
  const watchAutomaticDirection = watch("automatic_direction");
  const watchManualDirectionOverride = watch("manual_direction_override");
  const watchCredentialTypes = watch("allowed_credential_types");
  const watchAccessDays = watch("access_days");

  useEffect(() => {
    if (gate) {
      reset({
        name: gate.name,
        is_default: gate.is_default,
        slug: gate.slug,
        allowed_entry: gate.allowed_entry ?? true,
        allowed_exit: gate.allowed_exit ?? true,
        automatic_direction: gate.automatic_direction ?? true,
        manual_direction_override: gate.manual_direction_override ?? false,
        offline_policy: gate.offline_policy ?? "deny",
        reentry_policy: gate.reentry_policy ?? "allowed",
        allowed_credential_types: gate.allowed_credential_types?.length
          ? gate.allowed_credential_types
          : ["invitation_code", "invitation_qr", "badge_qr", "permanent_code"],
        access_days: gate.access_schedule?.days ?? [],
        access_start: gate.access_schedule?.start ?? "",
        access_end: gate.access_schedule?.end ?? "",
      });
    } else {
      reset({
        name: "",
        is_default: false,
        slug: "",
        allowed_entry: true,
        allowed_exit: true,
        automatic_direction: true,
        manual_direction_override: false,
        offline_policy: "deny",
        reentry_policy: "allowed",
        allowed_credential_types: [
          "invitation_code",
          "invitation_qr",
          "badge_qr",
          "permanent_code",
        ],
        access_days: [],
        access_start: "",
        access_end: "",
      });
    }
  }, [gate, reset, isOpen]);

  const createGate = useCreateGate();
  const updateGate = useUpdateGate();

  const onSubmit = async (data: GateFormValues) => {
    setSubmitError(null);
    const { access_days, access_start, access_end, ...gateData } = data;
    const access_schedule =
      access_days.length || access_start || access_end
        ? {
            ...(access_days.length ? { days: access_days } : {}),
            ...(access_start ? { start: access_start } : {}),
            ...(access_end ? { end: access_end } : {}),
          }
        : null;
    const placeId = selectedProperty?.id;
    if (!isEditing && !placeId) {
      setSubmitError("Select a site workspace before creating a checkpoint.");
      return;
    }
    try {
      if (isEditing && gate) {
        await updateGate.mutateAsync({
          gateId: gate.id,
          data: {
            ...gateData,
            access_schedule,
          } as UpdateGateRequest,
        });
      } else {
        await createGate.mutateAsync({
          ...gateData,
          place_id: placeId,
          dependency_id: null,
          is_default: data.is_default,
          access_schedule,
        } as CreateGateRequest);
      }
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "The gate could not be saved.",
      );
    }
  };

  const fieldErrors = {
    ...(errors.name?.message ? { "gate-name": errors.name.message } : {}),
    ...(submitError ? { "gate-form-error": submitError } : {}),
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit gate" : "Create gate"}
      description="Name the checkpoint and configure movement. Dependencies and operator assignment are managed from the Gates register."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
        <FormErrorSummary errors={fieldErrors} />

        <Field
          id="gate-name"
          label="Gate name"
          required
          error={errors.name?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register("name")}
              placeholder="Main entrance"
              className={fieldControlClassName}
            />
          )}
        </Field>

        {isEditing && (
          <Field id="gate-slug" label="Slug" error={errors.slug?.message}>
            {(control) => (
              <input
                {...control}
                {...register("slug")}
                placeholder="main-entrance"
                className={fieldControlClassName}
              />
            )}
          </Field>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={!!watchIsDefault}
            onChange={(e) => setValue("is_default", e.target.checked)}
            label="Mark as default gate"
          />
        </div>

        <fieldset className="space-y-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-4">
          <legend className="px-1 text-sm font-semibold">
            Movement policy
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              id="allowed-entry"
              checked={watchAllowedEntry}
              onChange={(event) =>
                setValue("allowed_entry", event.target.checked)
              }
              label="Allow check-in"
            />
            <Checkbox
              id="allowed-exit"
              checked={watchAllowedExit}
              onChange={(event) =>
                setValue("allowed_exit", event.target.checked)
              }
              label="Allow checkout"
            />
            <Checkbox
              id="automatic-direction"
              checked={watchAutomaticDirection}
              onChange={(event) =>
                setValue("automatic_direction", event.target.checked)
              }
              label="Infer direction from access state"
            />
            <Checkbox
              id="manual-direction-override"
              checked={watchManualDirectionOverride}
              onChange={(event) =>
                setValue("manual_direction_override", event.target.checked)
              }
              label="Permit manual direction selection"
            />
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="offline-policy" label="Offline policy">
            {(control) => (
              <select
                {...control}
                {...register("offline_policy")}
                className={fieldControlClassName}
              >
                <option value="deny">Deny passages offline</option>
                <option value="queue">Queue for reconnect</option>
                <option value="allow_verified">
                  Allow locally verified credentials
                </option>
              </select>
            )}
          </Field>
          <Field id="reentry-policy" label="Re-entry policy">
            {(control) => (
              <select
                {...control}
                {...register("reentry_policy")}
                className={fieldControlClassName}
              >
                <option value="allowed">Allow re-entry</option>
                <option value="denied">Deny re-entry</option>
                <option value="manual">Require override</option>
              </select>
            )}
          </Field>
        </div>

        <Field
          id="credential-types"
          label="Accepted credential types"
          description="Authorization and membership are still evaluated after credential verification."
        >
          {() => (
            <SearchableSelect
              inputId="credential-types"
              isMulti
              options={credentialOptions}
              value={watchCredentialTypes}
              onChange={(values: string[] | undefined) =>
                setValue("allowed_credential_types", values || [], {
                  shouldValidate: true,
                })
              }
            />
          )}
        </Field>

        <fieldset className="space-y-3 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] p-4">
          <legend className="px-1 text-sm font-semibold">
            Access schedule
          </legend>
          <p className="text-xs text-[var(--vms-ink-muted)]">
            Leave empty for 24/7 access.
          </p>
          <div className="flex flex-wrap gap-2">
            {weekdays.map(([value, label]) => (
              <label
                key={value}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <input
                  type="checkbox"
                  checked={watchAccessDays.includes(value)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...watchAccessDays, value]
                      : watchAccessDays.filter((day) => day !== value);
                    setValue("access_days", Array.from(new Set(next)).sort());
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="access-start" label="Opens">
              {(control) => (
                <input
                  {...control}
                  {...register("access_start")}
                  type="time"
                  className={fieldControlClassName}
                />
              )}
            </Field>
            <Field id="access-end" label="Closes">
              {(control) => (
                <input
                  {...control}
                  {...register("access_end")}
                  type="time"
                  className={fieldControlClassName}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] bg-[var(--vms-surface)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isEditing && !selectedProperty?.id}
            isLoading={createGate.isPending || updateGate.isPending}
          >
            {isEditing ? "Save changes" : "Create gate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
