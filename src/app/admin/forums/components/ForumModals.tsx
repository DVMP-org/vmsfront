"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import type { ForumCategory, Residency } from "@/types";

interface CategoryFormValues {
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
  residencyId: string;
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
      residencyId: fallbackResidencyId,
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      isDefault: initialValues?.isDefault ?? false,
      isLocked: initialValues?.isLocked ?? false,
    });
  }, [isOpen, initialValues, residencies, defaultResidencyId]);

  const canSubmit = formValues.residencyId && formValues.name.trim().length > 0;
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
            name: formValues.name.trim(),
            description: formValues.description.trim(),
          });
        }}
      >
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
          <p className="text-xs text-muted-foreground">
            Categories are scoped per residency so residents see only relevant threads.
          </p>
        </div>

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
  categories,
  defaultResidencyId,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
}: TopicFormModalProps) {
  const [formValues, setFormValues] = useState<TopicFormValues>({
    residencyId: defaultResidencyId || "",
    categoryId: "",
    title: "",
    content: "",
    isPinned: false,
    isLocked: false,
  });

  const categoriesForResidency = useMemo(() => {
    if (!formValues.residencyId) return categories;
    return categories.filter(
      (category) => !category.residency_id || category.residency_id === formValues.residencyId
    );
  }, [categories, formValues.residencyId]);

  useEffect(() => {
    if (!isOpen) return;
    const fallbackResidencyId =
      initialValues?.residencyId ||
      defaultResidencyId ||
      residencies[0]?.id ||
      "";
    const scopedCategories = categories.filter(
      (category) =>
        !category.residency_id || category.residency_id === fallbackResidencyId
    );
    setFormValues({
      residencyId: fallbackResidencyId,
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
    defaultResidencyId,
    categories,
  ]);

  const canSubmit =
    formValues.residencyId &&
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
            title: formValues.title.trim(),
            content: formValues.content.trim(),
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Residency
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={formValues.residencyId}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  residencyId: event.target.value,
                  categoryId: "",
                }))
              }
            >
              <option value="">Select residency</option>
              {residencies.map((residency) => (
                <option key={residency.id} value={residency.id}>
                  {residency.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
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
                {categoriesForResidency.length === 0
                  ? "No categories for this residency"
                  : "Select category"}
              </option>
              {categoriesForResidency.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
