"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormErrorSummary } from "@/components/ui/form/FormErrorSummary";
import { Modal } from "@/components/ui/Modal";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { placesApi, type PlaceTreeNode } from "@/features/places/api";

import {
    commercialSpaceKind,
    commercialSpaceTypes,
} from "../contracts";
import type { InventoryRow } from "../lib";

export function CommercialSpaceModal({
    open,
    space,
    parents,
    onClose,
    onSaved,
}: {
    open: boolean;
    space?: InventoryRow | null;
    parents: PlaceTreeNode[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const selectedSite = useAppStore((state) => state.selectedSite);
    const [name, setName] = useState(space?.name || "");
    const [parentId, setParentId] = useState(
        space?.parent_id || parents[0]?.id || "",
    );
    const [buildingType, setBuildingType] = useState(
        space?.building_type || "office",
    );
    const structuralKind = commercialSpaceKind(buildingType);
    const [address, setAddress] = useState(space?.address || "");
    const [description, setDescription] = useState(space?.description || "");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const save = useMutation({
        mutationFn: async () => {
            if (!space) {
                return placesApi.create({
                    site_id:
                        parents.find((parent) => parent.id === parentId)?.site_id ||
                        parents[0]?.site_id ||
                        selectedSite?.id ||
                        "",
                    name: name.trim(),
                    kind: structuralKind,
                    building_type: buildingType,
                    address: address.trim(),
                    description: description.trim(),
                    parent_id: parentId || null,
                });
            }

            const updated = await placesApi.update(space.id, {
                name: name.trim(),
                address: address.trim(),
                description: description.trim(),
            });
            if ((space.parent_id ?? "") !== parentId) {
                await placesApi.move(space.id, parentId || null);
            }
            return updated;
        },
        onSuccess: async () => {
            toast.success(
                space ? "Commercial space updated." : "Commercial space added.",
            );
            await onSaved();
        },
        onError: (error) => setErrors({ form: parseApiError(error).message }),
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        const next: Record<string, string> = {};
        if (name.trim().length < 2) next.name = "Enter a space name.";
        setErrors(next);
        if (Object.keys(next).length) return;
        save.mutate();
    }

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={space ? "Edit commercial space" : "Add commercial space"}
            description="Commercial inventory uses canonical Places; rent, tenants and access attach to the same space."
        >
            <form className="space-y-4" onSubmit={submit} noValidate>
                <FormErrorSummary errors={errors} />
                <Field
                    id="commercial-name"
                    label="Space name"
                    required
                    error={errors.name}
                >
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Suite 4A · Harbour Offices"
                        />
                    )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        id="commercial-type"
                        label="Space type"
                        required
                        description={
                            structuralKind === "building"
                                ? "Buildings can contain spaces and other buildings."
                                : "Only a building can contain this space."
                        }
                    >
                        {(control) => (
                            <select
                                {...control}
                                className={fieldControlClassName}
                                value={buildingType}
                                disabled={!!space}
                                onChange={(event) => {
                                    const nextType = event.target.value;
                                    setBuildingType(nextType);
                                    // A new building starts at the top level; a space defaults to
                                    // the first building but can still be cleared to top level.
                                    setParentId(
                                        commercialSpaceKind(nextType) === "building"
                                            ? ""
                                            : (parents[0]?.id ?? ""),
                                    );
                                }}
                            >
                                {commercialSpaceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </Field>
                    <Field
                        id="commercial-parent"
                        label="Building"
                        description={
                            space
                                ? "Move this place to another building, or leave it at the top level of the Site."
                                : structuralKind === "building"
                                    ? "Optional — nest this building inside another one, or leave it at the top level."
                                    : "Optional — leave empty to create it at the top level of this Site. Only buildings can contain other places."
                        }
                        error={errors.parent}
                    >
                        {(control) => (
                            <select
                                {...control}
                                className={fieldControlClassName}
                                value={parentId}
                                onChange={(event) => setParentId(event.target.value)}
                            >
                                <option value="">
                                    {structuralKind === "building"
                                        ? "Top level of this Site"
                                        : "No building — top level of this Site"}
                                </option>
                                {parents
                                    .filter((parent) => parent.id !== space?.id)
                                    .map((parent) => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.name}
                                        </option>
                                    ))}
                            </select>
                        )}
                    </Field>
                </div>
                <Field id="commercial-address" label="Address">
                    {(control) => (
                        <input
                            {...control}
                            className={fieldControlClassName}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                        />
                    )}
                </Field>
                <Field id="commercial-description" label="Description">
                    {(control) => (
                        <textarea
                            {...control}
                            className={`${fieldControlClassName} min-h-24 py-2`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    )}
                </Field>
                <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={save.isPending}>
                        {space ? "Save space" : "Add space"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
