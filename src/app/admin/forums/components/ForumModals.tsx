"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import type { ForumCategory, Residency, ResidencyGroup } from "@/types";

interface CategoryFormValues {
  scopeType: "organization" | "residency";
  residencyId: string;
  name: string;
  description: string;
  isDefault: boolean;
  isLocked: boolean;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  residencies: Residency[];
  defaultResidencyId?: string;
  initialValues?: Partial<CategoryFormValues>;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

interface TopicFormValues {
  targetType: "residency" | "residencyGroup";
  residencyId: string;
  residencyGroupId: string;
  categoryId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
}

interface TopicFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  residencies: Residency[];
  residencyGroups: ResidencyGroup[];
  categories: ForumCategory[];
  defaultResidencyId?: string;
  initialValues?: Partial<TopicFormValues>;
  onClose: () => void;
  onSubmit: (values: TopicFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryFormModal({
  isOpen,
  mode,
  residencies,
  defaultResidencyId,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
}: CategoryFormModalProps) {
  const [formValues, setFormValues] = useState<CategoryFormValues>({
    scopeType: defaultResidencyId ? "residency" : "organization",
    residencyId: defaultResidencyId || "",
    name: "",
    description: "",
    isDefault: false,
    isLocked: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    const fallbackResidencyId =
      initialValues?.residencyId ||
      defaultResidencyId ||
      residencies[0]?.id ||
      "";
    setFormValues({
      scopeType: initialValues?.scopeType ?? (fallbackResidencyId ? "residency" : "organization"),
      residencyId: fallbackResidencyId,
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      isDefault: initialValues?.isDefault ?? false,
      isLocked: initialValues?.isLocked ?? false,
    });
  }, [isOpen, initialValues, residencies, defaultResidencyId]);

  const canSubmit =
    formValues.name.trim().length > 0 &&
    (formValues.scopeType === "organization" || Boolean(formValues.residencyId));
  const modalTitle =
    mode === "create" ? "Create Forum Category" : "Edit Forum Category";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            ...formValues,
            residencyId:
              formValues.scopeType === "organization" ? "" : formValues.residencyId,
            name: formValues.name.trim(),
            description: formValues.description.trim(),
          });
        }}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category scope
          </label>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={formValues.scopeType}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                scopeType: event.target.value as CategoryFormValues["scopeType"],
                residencyId:
                  event.target.value === "organization"
                    ? ""
                    : prev.residencyId || defaultResidencyId || residencies[0]?.id || "",
              }))
            }
          >
            <option value="organization">Organization-wide</option>
            <option value="residency">Single residency</option>
          </select>
        </div>

        {formValues.scopeType === "residency" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Residency scope
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formValues.residencyId}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, residencyId: event.target.value }))
              }
              required
            >
              <option value="" disabled>
                Select residency
              </option>
              {residencies.map((residency) => (
                <option key={residency.id} value={residency.id}>
                  {residency.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Organization categories are visible everywhere. Residency categories stay local to one residency.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category name
          </label>
          <Input
            placeholder="e.g., Community Updates"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Short description that explains what belongs here"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={formValues.description}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-3">
          <Checkbox
            checked={formValues.isDefault}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                isDefault: event.target.checked,
              }))
            }
            label="Set as default"
            description="New topics default to this category."
          />
          <Checkbox
            checked={formValues.isLocked}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                isLocked: event.target.checked,
              }))
            }
            label="Lock category"
            description="Locked categories are visible but read-only."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TopicFormModal({
  isOpen,
  mode,
  residencies,
  residencyGroups,
  categories,
  defaultResidencyId,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
}: TopicFormModalProps) {
  const [formValues, setFormValues] = useState<TopicFormValues>({
    targetType: "residency",
    residencyId: defaultResidencyId || "",
    residencyGroupId: "",
    categoryId: "",
    title: "",
    content: "",
    isPinned: false,
    isLocked: false,
  });

  const categoriesForTarget = useMemo(() => {
    if (formValues.targetType === "residencyGroup") {
      return categories.filter((category) => !category.residency_id);
    }

    if (!formValues.residencyId) {
      return categories.filter((category) => !category.residency_id);
    }

    return categories.filter(
      (category) => !category.residency_id || category.residency_id === formValues.residencyId
    );
  }, [categories, formValues.targetType, formValues.residencyId]);

  useEffect(() => {
    if (!isOpen) return;
    const fallbackResidencyId =
      initialValues?.residencyId ||
      defaultResidencyId ||
      residencies[0]?.id ||
      "";
    const fallbackTargetType = initialValues?.targetType ?? "residency";
    const scopedCategories = categories.filter((category) => {
      if (fallbackTargetType === "residencyGroup") {
        return !category.residency_id;
      }

      return !category.residency_id || category.residency_id === fallbackResidencyId;
    });
    setFormValues({
      targetType: fallbackTargetType,
      residencyId: fallbackResidencyId,
      residencyGroupId: initialValues?.residencyGroupId || "",
      categoryId:
        initialValues?.categoryId ||
        scopedCategories[0]?.id ||
        "",
      title: initialValues?.title ?? "",
      content: initialValues?.content ?? "",
      isPinned: initialValues?.isPinned ?? false,
      isLocked: initialValues?.isLocked ?? false,
    });
  }, [
    isOpen,
    initialValues,
    residencies,
    residencyGroups,
    defaultResidencyId,
    categories,
  ]);

  const canSubmit =
    ((formValues.targetType === "residency" && formValues.residencyId) ||
      (formValues.targetType === "residencyGroup" && formValues.residencyGroupId)) &&
    formValues.categoryId &&
    formValues.title.trim().length > 0 &&
    (mode === "edit" || formValues.content.trim().length > 0);

  const modalTitle =
    mode === "create" ? "Create Topic" : "Edit Topic";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            ...formValues,
            residencyId:
              formValues.targetType === "residency" ? formValues.residencyId : "",
            residencyGroupId:
              formValues.targetType === "residencyGroup"
                ? formValues.residencyGroupId
                : "",
            title: formValues.title.trim(),
            content: formValues.content.trim(),
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Topic audience
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formValues.targetType}
              disabled={mode === "edit"}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  targetType: event.target.value as TopicFormValues["targetType"],
                  residencyId:
                    event.target.value === "residency"
                      ? prev.residencyId || defaultResidencyId || residencies[0]?.id || ""
                      : "",
                  residencyGroupId:
                    event.target.value === "residencyGroup"
                      ? prev.residencyGroupId || residencyGroups[0]?.id || ""
                      : "",
                  categoryId: "",
                }))
              }
            >
              <option value="residency">Single residency</option>
              {mode === "create" ? (
                <option value="residencyGroup">Residency group</option>
              ) : null}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formValues.targetType === "residencyGroup" ? "Residency group" : "Residency"}
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={
                formValues.targetType === "residencyGroup"
                  ? formValues.residencyGroupId
                  : formValues.residencyId
              }
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  residencyId:
                    prev.targetType === "residency" ? event.target.value : prev.residencyId,
                  residencyGroupId:
                    prev.targetType === "residencyGroup"
                      ? event.target.value
                      : prev.residencyGroupId,
                  categoryId: "",
                }))
              }
            >
              <option value="">
                {formValues.targetType === "residencyGroup"
                  ? "Select residency group"
                  : "Select residency"}
              </option>
              {formValues.targetType === "residencyGroup"
                ? residencyGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
                : residencies.map((residency) => (
                  <option key={residency.id} value={residency.id}>
                    {residency.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formValues.categoryId}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              required
            >
              <option value="" disabled>
                {categoriesForTarget.length === 0
                  ? "No categories available for this audience"
                  : "Select category"}
              </option>
              {categoriesForTarget.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.residency_id ? " · Organization" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Residency-group creation fans out into one topic per residency and can only use organization-wide categories.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Topic title
          </label>
          <Input
            placeholder="Add a concise headline"
            value={formValues.title}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>

        {mode === "create" ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Initial post
            </label>
            <textarea
              rows={4}
              placeholder="Seed the conversation with context..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formValues.content}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  content: event.target.value,
                }))
              }
              required
            />
          </div>
        ) : (
          <div className="grid gap-3">
            <Checkbox
              checked={formValues.isPinned}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  isPinned: event.target.checked,
                }))
              }
              label="Pinned topic"
              description="Pinned topics stay at the top."
            />
            <Checkbox
              checked={formValues.isLocked}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  isLocked: event.target.checked,
                }))
              }
              label="Lock replies"
              description="Lock to pause replies."
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting}>
            {mode === "create" ? "Create topic" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>{description}</p>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
