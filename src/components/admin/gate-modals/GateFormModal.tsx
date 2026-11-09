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
import { useCreateGate, useUpdateGate, useAdminGates } from "@/hooks/use-admin";

const gateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dependency_id: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
  slug: z.string().optional(),
});

type GateFormValues = z.infer<typeof gateSchema>;

interface GateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gate?: Gate;
}

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
      dependency_id: null,
      is_default: false,
      slug: "",
    },
  });

  const watchDependencyId = watch("dependency_id");
  const watchIsDefault = watch("is_default");

  useEffect(() => {
    if (gate) {
      reset({
        name: gate.name,
        dependency_id: gate.dependency_id,
        is_default: gate.is_default,
        slug: gate.slug,
      });
    } else {
      reset({
        name: "",
        dependency_id: null,
        is_default: false,
        slug: "",
      });
    }
  }, [gate, reset, isOpen]);

  const createGate = useCreateGate();
  const updateGate = useUpdateGate();

  const { data: gatesData } = useAdminGates({ page: 1, pageSize: 100 });

  const gateOptions = (gatesData?.items || [])
    .filter((g) => g.id !== gate?.id)
    .map((g) => ({
      value: g.id,
      label: g.name,
    }));

  const onSubmit = async (data: GateFormValues) => {
    setSubmitError(null);
    const placeId = selectedProperty?.id;
    if (!isEditing && !placeId) {
      setSubmitError("Select a site workspace before creating a checkpoint.");
      return;
    }
    try {
      if (isEditing && gate) {
        await updateGate.mutateAsync({
          gateId: gate.id,
          data: data as UpdateGateRequest,
        });
      } else {
        await createGate.mutateAsync({
          name: data.name,
          place_id: placeId,
          dependency_id: data.dependency_id ?? null,
          is_default: data.is_default,
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
      description="Name the checkpoint and optionally declare a dependency. Operator assignment can be completed now or later."
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

        <Field
          id="gate-dependency"
          label="Dependency gate (optional)"
          description="Use this when another gate must exist before this one is available."
        >
          {() => (
            <SearchableSelect
              inputId="gate-dependency"
              options={gateOptions}
              isClearable
              placeholder="Select dependency gate"
              value={watchDependencyId || undefined}
              onChange={(value: string | undefined) => {
                setValue("dependency_id", value || null);
              }}
            />
          )}
        </Field>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={!!watchIsDefault}
            onChange={(e) => setValue("is_default", e.target.checked)}
            label="Mark as default gate"
          />
        </div>

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
