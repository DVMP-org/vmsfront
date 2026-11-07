"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { FacetItem, FacetPicker } from "@/components/facets/FacetPicker";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import {
  AddPlacePersonInput,
  peopleApi,
  PlacePeople,
  PlacePerson,
} from "./api";
import "@/app/admin/properties/styles.css";

const OCCUPANCY_ROLES = {
  residential: ["resident", "owner", "tenant"],
  commercial: ["employee", "member", "tenant"],
  hospitality: ["guest"],
  mixed_use: ["resident", "owner", "tenant", "employee", "member", "guest"],
} as const;

export default function PeopleWorkspace() {
  const organization = useAppStore((state) => state.organization);
  const selectedProperty = useAppStore((state) => state.selectedProperty);
  const setSelectedProperty = useAppStore((state) => state.setSelectedProperty);
  const user = useAuthStore((state) => state.user);
  const contextKey = `${organization?.id}:${user?.id}`;
  const placeId = selectedProperty?.id || null;
  const queryClient = useQueryClient();
  const people = useQuery({
    queryKey: ["people", contextKey, placeId],
    queryFn: () => peopleApi.get(placeId!),
    enabled: !!placeId,
    retry: false,
  });

  const selectedFacet: FacetItem | null = selectedProperty
    ? {
        value: selectedProperty.id,
        label: selectedProperty.name,
        disabled: false,
        meta: { kind: "site", slug: "", parent_id: null },
      }
    : null;

  function chooseProperty(item: FacetItem | null) {
    setSelectedProperty(item ? { id: item.value, name: item.label } : null);
  }

  return (
    <main className="property-workspace">
      <header className="property-heading flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="property-eyebrow flex items-center gap-2">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            PROPERTY OPERATIONS / PEOPLE
          </p>
          <h1>
            People<span className="property-heading-period">.</span>
          </h1>
          <p className="property-heading-copy">
            Add the people responsible for a property, onboard occupants, and
            keep administrators separate from the people who live or work
            there.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--property-accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </header>

      <section className="property-registry mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="property-view-index">01</p>
            <h2 className="mt-1 text-base font-semibold">Property context</h2>
            <p className="mt-1 text-xs text-[var(--property-muted)]">
              People belong to the selected property or space. Choose one before
              adding or reviewing its roster.
            </p>
          </div>
          <div className="w-full lg:max-w-xl">
            {selectedProperty ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--property-line)] bg-[var(--property-canvas)] px-4 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[var(--property-accent)] shadow-sm dark:bg-slate-900">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <small className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--property-muted)]">
                      Selected property
                    </small>
                    <strong className="block truncate text-sm">
                      {selectedProperty.name}
                    </strong>
                  </span>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-[var(--property-accent)]"
                  onClick={() => chooseProperty(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <FacetPicker
                facet="places"
                label="Choose a property or space"
                value={selectedFacet}
                onChange={chooseProperty}
                contextKey={contextKey}
              />
            )}
          </div>
        </div>
      </section>

      {!placeId ? (
        <EmptyProperty />
      ) : people.isPending ? (
        <PeopleSkeleton />
      ) : people.isError ? (
        <PeopleFailure
          error={people.error}
          retry={() => people.refetch()}
        />
      ) : (
        <PeopleContent
          people={people.data}
          contextKey={contextKey}
          onChanged={() =>
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["people", contextKey, placeId],
              }),
              queryClient.invalidateQueries({
                queryKey: ["workspace-context"],
              }),
            ])
          }
        />
      )}
    </main>
  );
}

function PeopleContent({
  people,
  contextKey,
  onChanged,
}: {
  people: PlacePeople;
  contextKey: string;
  onChanged: () => void;
}) {
  const total = people.administrators.length + people.occupants.length;
  return (
    <>
      <section
        className="mb-5 grid gap-3 sm:grid-cols-3"
        aria-label="People summary"
      >
        <Summary label="Property administrators" value={people.administrators.length} />
        <Summary
          label={occupantLabel(people.effective_use_case)}
          value={people.occupants.length}
        />
        <Summary label="People in this context" value={total} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border border-[var(--property-line)] bg-[var(--property-paper)] shadow-sm">
          <div className="border-b border-[var(--property-line)] px-5 py-4">
            <h2 className="text-base font-semibold">Property roster</h2>
            <p className="mt-1 text-xs text-[var(--property-muted)]">
              Administration and occupancy are shown separately so an
              administrator is never mistaken for an occupant.
            </p>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <Roster
              icon={ShieldCheck}
              title="Administrators"
              description="Manage this site and its operating workflows."
              items={people.administrators}
              empty="No site administrator is assigned in this context."
            />
            <Roster
              icon={UserRound}
              title={occupantLabel(people.effective_use_case)}
              description={occupantDescription(people.effective_use_case)}
              items={people.occupants}
              empty={`No ${occupantLabel(people.effective_use_case).toLowerCase()} have been added.`}
              divided
            />
          </div>
        </section>

        <AddPersonForm
          place={people.place}
          useCase={people.effective_use_case}
          contextKey={contextKey}
          onChanged={onChanged}
        />
      </div>
    </>
  );
}

function AddPersonForm({
  place,
  useCase,
  contextKey,
  onChanged,
}: {
  place: PlacePeople["place"];
  useCase: PlacePeople["effective_use_case"];
  contextKey: string;
  onChanged: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [success, setSuccess] = useState("");
  const roles = OCCUPANCY_ROLES[useCase];
  const isSite = place.kind === "site";
  const mutation = useMutation({
    mutationFn: () => {
      const body: AddPlacePersonInput = {
        display_name: displayName.trim(),
        email: email.trim(),
        kind: "person",
      };
      if (phone.trim()) body.phone = phone.trim();
      if (!isSite && role) body.role = role;
      return peopleApi.add(place.id, body);
    },
    onSuccess: (result) => {
      const onboarding =
        result.onboarding_email === "queued"
          ? " An onboarding email has been queued."
          : " This person already had an active account.";
      setSuccess(
        `${result.party.display_name} was added as ${roleLabel(result.role)}.${onboarding}`,
      );
      setDisplayName("");
      setEmail("");
      setPhone("");
      setRole("");
      onChanged();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setSuccess("");
    mutation.mutate();
  }

  return (
    <section className="rounded-xl border border-[var(--property-line)] bg-[var(--property-paper)] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--property-accent)_10%,transparent)] text-[var(--property-accent)]">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">
            {isSite ? "Add a property administrator" : `Add ${useCase === "hospitality" ? "a guest" : "an occupant"}`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--property-muted)]">
            {isSite
              ? "This adds a site-level manager. Administration stays separate from occupancy."
              : `This creates or reuses the person’s account, assigns them to ${place.name}, and prepares onboarding.`}
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={submit}>
        <fieldset className="space-y-4" disabled={mutation.isPending}>
          <label className="block text-xs font-semibold">
            Full name
            <input
              required
              maxLength={255}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--property-line)] bg-transparent px-3 py-2.5 text-sm"
              placeholder="Ada Okafor"
            />
          </label>
          <label className="block text-xs font-semibold">
            Email
            <input
              required
              type="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--property-line)] bg-transparent px-3 py-2.5 text-sm"
              placeholder="ada@example.com"
            />
          </label>
          <label className="block text-xs font-semibold">
            Phone <span className="font-normal text-[var(--property-muted)]">(optional)</span>
            <input
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--property-line)] bg-transparent px-3 py-2.5 text-sm"
              placeholder="+234 800 000 0000"
            />
          </label>
          {!isSite ? (
            <label className="block text-xs font-semibold">
              Role in this property
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--property-line)] bg-[var(--property-paper)] px-3 py-2.5 text-sm"
              >
                <option value="">Use the property default</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block font-normal leading-5 text-[var(--property-muted)]">
                {isSite
                  ? "Site assignments always use the place administrator role."
                  : `Available roles follow the ${roleLabel(useCase)} use case.`}
              </span>
            </label>
          ) : (
            <div className="rounded-lg border border-[var(--property-line)] bg-[var(--property-canvas)] px-3 py-3 text-xs">
              <strong className="block">Role: Property administrator</strong>
              <span className="mt-1 block text-[var(--property-muted)]">
                The role is applied by the server; it cannot be changed into an
                occupancy role.
              </span>
            </div>
          )}
        </fieldset>

        {mutation.isError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          >
            {parseApiError(mutation.error).message}
          </p>
        ) : null}
        {success ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          className="property-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
          disabled={mutation.isPending || !displayName.trim() || !email.trim()}
        >
          {mutation.isPending ? (
            "Adding person…"
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Add person and prepare onboarding
            </>
          )}
        </button>
      </form>
    </section>
  );
}

function Roster({
  icon: Icon,
  title,
  description,
  items,
  empty,
  divided = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  items: PlacePerson[];
  empty: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`p-5 ${divided ? "border-t border-[var(--property-line)] md:border-l md:border-t-0" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--property-accent)]" />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-[var(--property-canvas)] px-2 py-0.5 text-[10px] font-bold">
          {items.length}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--property-muted)]">
        {description}
      </p>
      {items.length ? (
        <ul className="mt-4 divide-y divide-[var(--property-line)]">
          {items.map((item) => (
            <li
              key={`${item.source}:${item.party.id}:${item.role}`}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">
                  {item.party.display_name}
                </strong>
                <span className="mt-0.5 block truncate text-xs text-[var(--property-muted)]">
                  {item.party.email || "No email"}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[var(--property-line)] px-2 py-1 text-[10px] font-semibold capitalize">
                {roleLabel(item.role)}
                {item.is_super_admin ? " · Primary" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-[var(--property-line)] px-3 py-4 text-xs text-[var(--property-muted)]">
          {empty}
        </p>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function EmptyProperty() {
  return (
    <section className="property-editor text-center">
      <Building2 className="mx-auto h-8 w-8 text-[var(--property-accent)]" />
      <h2 className="mt-4">Choose a property to manage people</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--property-muted)]">
        Select a property or space above. Its use case determines whether the
        people you add are residents, employees, members, or guests.
      </p>
      <Link
        href="/admin/properties"
        className="mt-5 inline-flex text-sm font-semibold text-[var(--property-accent)]"
      >
        Review properties
      </Link>
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
    <section className="property-editor" role="alert">
      <h2>People unavailable</h2>
      <p className="mt-2 text-sm text-[var(--property-muted)]">
        {parseApiError(error).message}
      </p>
      <button
        type="button"
        className="mt-5 rounded-lg border border-[var(--property-line)] px-4 py-2 text-sm font-semibold"
        onClick={retry}
      >
        Retry
      </button>
    </section>
  );
}

function PeopleSkeleton() {
  return (
    <div className="space-y-5" role="status">
      <span className="sr-only">Loading property people</span>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function occupantLabel(useCase: PlacePeople["effective_use_case"]) {
  if (useCase === "hospitality") return "Guests";
  if (useCase === "commercial") return "Occupants & members";
  return "Occupants";
}

function occupantDescription(useCase: PlacePeople["effective_use_case"]) {
  if (useCase === "hospitality") {
    return "People staying in this property or room.";
  }
  if (useCase === "commercial") {
    return "Employees, members, and tenants assigned to this space.";
  }
  return "Residents, owners, and tenants assigned to this space.";
}

function roleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
