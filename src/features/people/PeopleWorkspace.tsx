"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SlideOver } from "@/components/ui/SlideOver";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { useAdminProfile } from "@/hooks/use-admin";
import { hasAdminPermission } from "@/lib/permissions";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import {
  AddPlacePersonInput,
  peopleApi,
  PlacePeople,
  PlacePerson,
} from "./api";
import "./people-directory.css";

const OCCUPANCY_ROLES = {
  residential: ["resident", "owner", "tenant"],
  commercial: ["employee", "member", "tenant"],
  hospitality: ["guest"],
  mixed_use: ["resident", "owner", "tenant", "employee", "member", "guest"],
} as const;

type PeopleScope = "all" | "administrators" | "relationships";

export default function PeopleWorkspace() {
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const profile = useAdminProfile();
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const contextKey = `${organization?.id}:${user?.id}`;
  const placeId = selectedProperty?.id || null;
  const people = useQuery({
    queryKey: ["people", contextKey, placeId],
    queryFn: () => peopleApi.get(placeId!),
    enabled: !!placeId,
    retry: false,
  });

  const canManage =
    !!profile.data &&
    hasAdminPermission(profile.data, "parties.create") &&
    hasAdminPermission(profile.data, "place_relationships.create");

  const selectedFacet: FacetItem | null = selectedProperty
    ? {
        value: selectedProperty.id,
        label: selectedProperty.name,
        disabled: false,
        meta: { kind: "site", slug: "", parent_id: null },
      }
    : null;

  function chooseProperty(item: FacetItem | null) {
    setNotice("");
    setSelectedProperty(item ? { id: item.value, name: item.label } : null);
  }

  async function invalidatePeople() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["people", contextKey, placeId],
      }),
      queryClient.invalidateQueries({ queryKey: ["workspace-context"] }),
    ]);
  }

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-5 pb-10 text-[var(--vms-ink)]">
      <PageHeader
        organizationName={organization?.name || "Organization"}
        propertyName={selectedProperty?.name}
        canManage={canManage}
        permissionPending={profile.isPending}
        onAdd={() => setAddOpen(true)}
      />

      <ContextControl
        contextKey={contextKey}
        property={selectedProperty}
        value={selectedFacet}
        onChange={chooseProperty}
      />

      {notice ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-success)_30%,white)] bg-[var(--vms-success-subtle)] px-4 py-3 text-sm text-[var(--vms-success)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {!placeId ? (
        <EmptyProperty />
      ) : people.isPending ? (
        <PeopleSkeleton />
      ) : people.isError && !people.data ? (
        <PeopleFailure error={people.error} retry={() => people.refetch()} />
      ) : people.data ? (
        <PeopleContent
          people={people.data}
          canManage={canManage}
          permissionPending={profile.isPending}
          stale={people.isError}
          onRetry={() => people.refetch()}
          onChanged={invalidatePeople}
          onNotice={setNotice}
        />
      ) : null}

      {people.data && canManage ? (
        <AddPersonDrawer
          open={addOpen}
          people={people.data}
          onClose={() => setAddOpen(false)}
          onChanged={invalidatePeople}
          onSuccess={(message) => {
            setNotice(message);
            setAddOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function PageHeader({
  organizationName,
  propertyName,
  canManage,
  permissionPending,
  onAdd,
}: {
  organizationName: string;
  propertyName?: string;
  canManage: boolean;
  permissionPending: boolean;
  onAdd: () => void;
}) {
  return (
    <header className="border-b border-[var(--vms-line)] pb-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
        <Users className="h-3.5 w-3.5 text-[var(--vms-active-accent)]" />
        <span>{organizationName}</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[var(--vms-ink)]">People</span>
        {propertyName ? (
          <>
            <span aria-hidden="true">/</span>
            <span>{propertyName}</span>
          </>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
            People
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
            Manage site administration and property relationships without
            confusing an account, a person and a place assignment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/properties">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Manage properties
            </Link>
          </Button>
          {canManage ? (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add person
            </Button>
          ) : permissionPending ? (
            <Button disabled aria-busy="true">
              Checking permissions…
            </Button>
          ) : (
            <Badge variant="neutral">Read-only</Badge>
          )}
          <Button asChild variant="ghost">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ContextControl({
  contextKey,
  property,
  value,
  onChange,
}: {
  contextKey: string;
  property: { id: string; name: string } | null;
  value: FacetItem | null;
  onChange: (item: FacetItem | null) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
          Property context
        </p>
        <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
          The selected property determines the available relationship roles,
          permissions and people.
        </p>
      </div>
      <div className="w-full lg:max-w-xl">
        {property ? (
          <div className="flex min-h-12 items-center justify-between gap-4 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-2">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface)]">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <small className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                  Selected property
                </small>
                <strong className="block truncate text-sm">{property.name}</strong>
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              Change
            </Button>
          </div>
        ) : (
          <FacetPicker
            facet="places"
            label="Choose a property or space"
            value={value}
            onChange={onChange}
            contextKey={contextKey}
          />
        )}
      </div>
    </section>
  );
}

function PeopleContent({
  people,
  canManage,
  permissionPending,
  stale,
  onRetry,
  onChanged,
  onNotice,
}: {
  people: PlacePeople;
  canManage: boolean;
  permissionPending: boolean;
  stale: boolean;
  onRetry: () => void;
  onChanged: () => Promise<unknown>;
  onNotice: (message: string) => void;
}) {
  const [scope, setScope] = useState<PeopleScope>("all");
  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<PlacePerson | null>(null);
  const [removeError, setRemoveError] = useState("");
  const remove = useMutation({
    mutationFn: (person: PlacePerson) =>
      peopleApi.remove(people.place.id, person.source, person.assignment_id),
    onMutate: () => setRemoveError(""),
    onSuccess: async (result, person) => {
      onNotice(
        result.source === "administration"
          ? `${person.party.display_name} no longer administers this property.`
          : `${person.party.display_name}'s property access has ended.`,
      );
      setRemoveTarget(null);
      await onChanged();
    },
    onError: (error) => setRemoveError(parseApiError(error).message),
  });

  const normalizedSearch = search.trim().toLowerCase();
  const rows = useMemo(() => {
    const all = [
      ...people.administrators.map((person) => ({
        person,
        scope: "administrators" as const,
        scopeLabel: "Administration",
      })),
      ...people.occupants.map((person) => ({
        person,
        scope: "relationships" as const,
        scopeLabel: occupantLabel(people.effective_use_case),
      })),
    ];
    return all.filter(({ person, scope: rowScope, scopeLabel }) => {
      if (scope !== "all" && scope !== rowScope) return false;
      if (!normalizedSearch) return true;
      return [
        person.party.display_name,
        person.party.email || "",
        person.role,
        scopeLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [normalizedSearch, people, scope]);

  const total = people.administrators.length + people.occupants.length;

  return (
    <>
      {stale ? (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-warning)_35%,white)] bg-[var(--vms-warning-subtle)] px-4 py-3 text-sm text-[var(--vms-warning)] sm:flex-row sm:items-center"
        >
          <span>
            Showing the last successful roster. A refresh failed, so newer
            assignments may be missing.
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {!canManage && !permissionPending ? (
        <p
          role="status"
          className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-4 py-3 text-sm text-[var(--vms-ink-muted)]"
        >
          You can review this roster, but adding people and changing access
          require party and place-relationship management permissions.
        </p>
      ) : null}

      <section
        className="grid overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] sm:grid-cols-3"
        aria-label="People summary"
      >
        <PersonMetric
          label="Administrators"
          value={people.administrators.length}
          detail="Property management authority"
        />
        <PersonMetric
          label={occupantLabel(people.effective_use_case)}
          value={people.occupants.length}
          detail={`${roleLabel(people.effective_use_case)} operating context`}
        />
        <PersonMetric
          label="Total relationships"
          value={total}
          detail="Administration and property access"
        />
      </section>

      <section
        className="overflow-hidden rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
        aria-labelledby="people-register-heading"
      >
        <div className="border-b border-[var(--vms-line)] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 id="people-register-heading" className="text-lg font-semibold">
                Property people
              </h2>
              <p className="mt-1 text-sm text-[var(--vms-ink-muted)]">
                Administration stays separate from occupancy, tenancy, staff
                and guest relationships.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-1 rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] p-1"
              role="group"
              aria-label="Filter people by scope"
            >
              {[
                ["all", "All"],
                ["administrators", "Administrators"],
                ["relationships", occupantLabel(people.effective_use_case)],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => setScope(value as PeopleScope)}
                  className="min-h-10 rounded-[var(--vms-radius-control)] px-3 text-xs font-semibold text-[var(--vms-ink-muted)] transition-colors aria-pressed:bg-[var(--vms-surface)] aria-pressed:text-[var(--vms-ink)] aria-pressed:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-md">
              <span className="sr-only">Search people</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vms-ink-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a person, role or email…"
                className="h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] pl-10 pr-3 text-base text-[var(--vms-ink)] outline-none focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)] sm:text-sm"
              />
            </label>
            <p className="text-xs text-[var(--vms-ink-muted)]" aria-live="polite">
              {rows.length} {rows.length === 1 ? "person" : "people"} shown
            </p>
          </div>
        </div>

        <PeopleRegister
          rows={rows}
          canManage={canManage}
          permissionPending={permissionPending}
          onRemove={setRemoveTarget}
          effectiveUseCase={people.effective_use_case}
        />
      </section>

      <RemovePersonDialog
        person={removeTarget}
        pending={remove.isPending}
        error={removeError}
        onClose={() => {
          if (!remove.isPending) {
            setRemoveTarget(null);
            setRemoveError("");
          }
        }}
        onConfirm={() => {
          if (removeTarget) remove.mutate(removeTarget);
        }}
      />
    </>
  );
}

function PeopleRegister({
  rows,
  canManage,
  permissionPending,
  onRemove,
  effectiveUseCase,
}: {
  rows: Array<{
    person: PlacePerson;
    scope: "administrators" | "relationships";
    scopeLabel: string;
  }>;
  canManage: boolean;
  permissionPending: boolean;
  onRemove: (person: PlacePerson) => void;
  effectiveUseCase: PlacePeople["effective_use_case"];
}) {
  if (!rows.length) {
    return (
      <div className="px-5 py-10 text-center">
        <Users className="mx-auto h-8 w-8 text-[var(--vms-ink-muted)]" />
        <h3 className="mt-3 text-base font-semibold">No people match</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--vms-ink-muted)]">
          Change the scope or search text. New administration and{" "}
          {occupantLabel(effectiveUseCase).toLowerCase()} relationships will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <Table
      className="people-directory-table"
      containerClassName="people-directory-region rounded-none border-0"
      scrollLabel="Property people"
    >
      <caption className="sr-only">
        Administrators and {occupantLabel(effectiveUseCase).toLowerCase()} for
        the selected property
      </caption>
      <TableHeader className="people-directory-header">
        <TableRow>
          <TableHead>Person</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Relationship</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ person, scope, scopeLabel }) => (
          <TableRow
            key={`${person.source}:${person.party.id}:${person.assignment_id}`}
            className="people-directory-row"
          >
            <TableCell data-label="Person" className="people-directory-identity">
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-xs font-semibold"
                  aria-hidden="true"
                >
                  {initials(person.party.display_name)}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold">
                    {person.party.display_name}
                  </strong>
                  <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
                    {person.party.is_active ? "Active account" : "Inactive account"}
                  </span>
                </span>
              </span>
            </TableCell>
            <TableCell data-label="Contact">
              <span className="break-all">{person.party.email || "No email"}</span>
            </TableCell>
            <TableCell data-label="Relationship">
              <span className="flex flex-wrap items-center gap-2">
                {roleLabel(person.role)}
                {person.is_super_admin ? (
                  <Badge variant="info">Primary</Badge>
                ) : null}
              </span>
            </TableCell>
            <TableCell data-label="Scope">
              <Badge variant={scope === "administrators" ? "neutral" : "default"}>
                {scope === "administrators" ? (
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {scopeLabel}
              </Badge>
            </TableCell>
            <TableCell data-label="Status">
              <Badge variant={person.status === "active" ? "success" : "neutral"}>
                {roleLabel(person.status)}
              </Badge>
            </TableCell>
            <TableCell
              data-label="Action"
              className="people-directory-action text-right"
            >
              {canManage ? (
                <Button
                  type="button"
                  variant="destructive-outlined"
                  size="sm"
                  aria-label={`Review access change for ${person.party.display_name}`}
                  onClick={() => onRemove(person)}
                >
                  Review access
                </Button>
              ) : (
                <span className="text-xs text-[var(--vms-ink-muted)]">
                  {permissionPending ? "Checking access…" : "Read-only"}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AddPersonDrawer({
  open,
  people,
  onClose,
  onChanged,
  onSuccess,
}: {
  open: boolean;
  people: PlacePeople;
  onClose: () => void;
  onChanged: () => Promise<unknown>;
  onSuccess: (message: string) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSite = people.place.kind === "site";
  const roles = OCCUPANCY_ROLES[people.effective_use_case];
  const mutation = useMutation({
    mutationFn: () => {
      const body: AddPlacePersonInput = {
        display_name: displayName.trim(),
        email: email.trim(),
        kind: "person",
      };
      if (phone.trim()) body.phone = phone.trim();
      if (!isSite && role) body.role = role;
      return peopleApi.add(people.place.id, body);
    },
    onSuccess: async (result) => {
      const onboarding =
        result.onboarding_email === "queued"
          ? " An onboarding email has been queued."
          : " This person already has an active account.";
      onSuccess(
        `${result.party.display_name} was added as ${roleLabel(result.role)}.${onboarding}`,
      );
      setDisplayName("");
      setEmail("");
      setPhone("");
      setRole("");
      setErrors({});
      await onChanged();
    },
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = "Enter the person’s full name.";
    if (!email.trim()) next.email = "Enter an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.getElementById("add-person-errors")?.focus(),
      );
      return false;
    }
    return true;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (validate()) mutation.mutate();
  }

  return (
    <SlideOver
      isOpen={open}
      onClose={onClose}
      title={isSite ? "Add a property administrator" : "Add a person"}
      description={
        isSite
          ? `Grant ${people.place.name} management authority. This does not create occupancy.`
          : `Assign a relationship at ${people.place.name} and prepare onboarding when required.`
      }
      size="md"
    >
      <form className="flex min-h-full flex-col" onSubmit={submit} noValidate>
        <div className="space-y-5">
          {Object.keys(errors).length || mutation.isError ? (
            <div
              id="add-person-errors"
              role="alert"
              tabIndex={-1}
              className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] px-4 py-3 text-sm text-[var(--vms-danger)]"
            >
              <strong className="block">Please correct the following</strong>
              <ul className="mt-1 list-disc pl-5">
                {Object.values(errors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
                {mutation.isError ? (
                  <li>{parseApiError(mutation.error).message}</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <FormField
            id="person-display-name"
            label="Full name"
            description="The name used on assignments, approvals and access history."
            error={errors.displayName}
          >
            <input
              id="person-display-name"
              required
              maxLength={255}
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-invalid={!!errors.displayName}
              aria-describedby={
                errors.displayName
                  ? "person-display-name-error person-display-name-help"
                  : "person-display-name-help"
              }
              className={fieldClass}
              placeholder="Ada Okafor"
            />
          </FormField>

          <FormField
            id="person-email"
            label="Email"
            description="Invitation and onboarding messages are sent here."
            error={errors.email}
          >
            <input
              id="person-email"
              required
              type="email"
              maxLength={255}
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email
                  ? "person-email-error person-email-help"
                  : "person-email-help"
              }
              className={fieldClass}
              placeholder="ada@example.com"
            />
          </FormField>

          <FormField
            id="person-phone"
            label="Phone"
            optional
            description="Optional contact number for the property team."
          >
            <input
              id="person-phone"
              type="tel"
              maxLength={32}
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
              placeholder="+234 800 000 0000"
            />
          </FormField>

          {isSite ? (
            <div className="rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] px-3 py-3 text-sm">
              <strong className="block">Relationship: Property administrator</strong>
              <span className="mt-1 block text-[var(--vms-ink-muted)]">
                Site administration is applied by the server and never becomes
                an occupancy role.
              </span>
            </div>
          ) : (
            <FormField
              id="person-role"
              label="Property relationship"
              description={`Available roles follow the ${roleLabel(people.effective_use_case)} context.`}
            >
              <select
                id="person-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className={fieldClass}
              >
                <option value="">Use the property default</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>

        <div className="mt-auto flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            {mutation.isPending ? "Adding person…" : "Add person"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}

function RemovePersonDialog({
  person,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  person: PlacePerson | null;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const administrator = person?.source === "administration";
  return (
    <Modal
      isOpen={!!person}
      onClose={onClose}
      title={administrator ? "Remove administrator?" : "End property access?"}
      description={
        person
          ? `${person.party.display_name} will no longer have this assignment at the selected property.`
          : undefined
      }
      size="sm"
    >
      <div className="space-y-4 text-sm">
        <p className="leading-6 text-[var(--vms-ink-muted)]">
          {administrator
            ? "This removes property management authority. The account and other organization relationships are not deleted."
            : "This ends the occupancy or personal access relationship. The account and its history remain available."}
        </p>
        {error ? (
          <p
            role="alert"
            className="rounded-[var(--vms-radius-control)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] px-3 py-2 text-[var(--vms-danger)]"
          >
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--vms-line)] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Keep access
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            isLoading={pending}
          >
            {administrator ? "Remove administrator" : "End access"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PersonMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="border-b border-[var(--vms-line)] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-medium text-[var(--vms-ink-muted)]">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[var(--vms-ink-muted)]">{detail}</p>
    </div>
  );
}

function FormField({
  id,
  label,
  description,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-[var(--vms-ink-muted)]">
            (optional)
          </span>
        ) : null}
      </label>
      {description ? (
        <p
          id={`${id}-help`}
          className="mt-1 text-xs leading-5 text-[var(--vms-ink-muted)]"
        >
          {description}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs font-medium text-[var(--vms-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EmptyProperty() {
  return (
    <section className="rounded-[var(--vms-radius-surface)] border border-dashed border-[var(--vms-line-strong)] bg-[var(--vms-surface)] p-8 text-center sm:p-10">
      <Building2 className="mx-auto h-8 w-8 text-[var(--vms-ink-muted)]" />
      <h2 className="mt-3 text-lg font-semibold">
        Choose a property to manage people
      </h2>
      <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-[var(--vms-ink-muted)]">
        Select a property or space above. Its operating context determines
        whether relationships are residents, employees, members or guests.
      </p>
      <Button asChild variant="secondary" className="mt-4">
        <Link href="/admin/properties">
          Review properties
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

function PeopleFailure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <section
      className="rounded-[var(--vms-radius-surface)] border border-[color-mix(in_srgb,var(--vms-danger)_35%,white)] bg-[var(--vms-danger-subtle)] p-5"
      role="alert"
    >
      <h2 className="text-base font-semibold text-[var(--vms-danger)]">
        People unavailable
      </h2>
      <p className="mt-1 text-sm text-[var(--vms-danger)]">
        {parseApiError(error).message}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={retry}
      >
        Retry
      </Button>
    </section>
  );
}

function PeopleSkeleton() {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading property people</span>
      <div className="h-24 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)]" />
      <div className="h-80 animate-pulse rounded-[var(--vms-radius-surface)] bg-[var(--vms-surface-subtle)]" />
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-base text-[var(--vms-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--vms-focus)] focus:ring-2 focus:ring-[var(--vms-focus)] disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm";

function occupantLabel(useCase: PlacePeople["effective_use_case"]) {
  if (useCase === "hospitality") return "Guests";
  if (useCase === "commercial") return "Occupants & members";
  return "Occupants";
}

function roleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
