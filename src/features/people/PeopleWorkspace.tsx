"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
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
    <main className="space-y-4 pb-8 text-[#0f1b31]">
      <header className="border-b border-[#dce3ee] pb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
          <Users className="h-3.5 w-3.5 text-[#2563eb]" />
          <span>{organization?.name || "Organization"}</span>
          <span className="text-[#c3cad6]">/</span>
          <Link href="/admin/people" className="text-[#344054]">
            People
          </Link>
          {selectedProperty ? (
            <>
              <span className="text-[#c3cad6]">/</span>
              <span className="font-semibold text-[#0f1b31]">
                {selectedProperty.name}
              </span>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.04em] sm:text-[36px]">
              People
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#667085]">
              Assign administrators and occupants to a property. Onboarding is
              prepared when a new person is added.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-semibold text-[#344054] transition hover:border-[#94a3b8] hover:bg-[#f8faff]"
            >
              <Building2 className="h-3.5 w-3.5" />
              Manage properties
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-[#2563eb] hover:bg-[#edf3ff]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-[#dce3ee] bg-white p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563eb]">
              Property context
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              The selected property determines the available roles and scope.
            </p>
          </div>
          <div className="w-full lg:max-w-xl">
            {selectedProperty ? (
              <div className="flex items-center justify-between gap-4 rounded-md border border-[#dce3ee] bg-[#f8faff] px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[#2563eb] shadow-sm ring-1 ring-[#dce3ee]">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <small className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
                      Selected property
                    </small>
                    <strong className="block truncate text-sm">
                      {selectedProperty.name}
                    </strong>
                  </span>
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#edf3ff]"
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
        <PeopleFailure error={people.error} retry={() => people.refetch()} />
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
        className="grid overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)] sm:grid-cols-3"
        aria-label="People summary"
      >
        <PersonMetric
          label="Property administrators"
          value={people.administrators.length}
          detail="Site management authority"
        />
        <PersonMetric
          label={occupantLabel(people.effective_use_case)}
          value={people.occupants.length}
          detail={`${roleLabel(people.effective_use_case)} operating context`}
        />
        <PersonMetric
          label="People in this context"
          value={total}
          detail="Administration and occupancy"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <section className="overflow-hidden rounded-lg border border-[#dce3ee] bg-white shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
          <div className="border-b border-[#dce3ee] px-4 py-3.5">
            <h2 className="text-sm font-semibold">Property roster</h2>
            <p className="mt-0.5 text-xs text-[#667085]">
              Administration remains separate from occupancy and tenancy.
            </p>
          </div>
          <div className="grid md:grid-cols-2">
            <Roster
              icon={ShieldCheck}
              title="Administrators"
              description="Manage the site and its operating workflows."
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
    <section className="rounded-lg border border-[#cddbf5] bg-[#f4f8ff] p-4 shadow-[0_1px_2px_rgba(15,27,49,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#2563eb] shadow-sm ring-1 ring-[#d6e2f8]">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">
            {isSite
              ? "Add a property administrator"
              : `Add ${useCase === "hospitality" ? "a guest" : "an occupant"}`}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-[#667085]">
            {isSite
              ? "Adds a site-level manager. It does not create occupancy."
              : `Assign this person to ${place.name} and prepare onboarding.`}
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <fieldset className="space-y-3" disabled={mutation.isPending}>
          <Field label="Full name">
            <input
              required
              maxLength={255}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
              placeholder="Ada Okafor"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
              placeholder="ada@example.com"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
              placeholder="+234 800 000 0000"
            />
          </Field>
          {!isSite ? (
            <Field
              label="Role in this property"
              hint={`Available roles follow the ${roleLabel(useCase)} use case.`}
            >
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbe7ff]"
              >
                <option value="">Use the property default</option>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabel(item)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="rounded-md border border-[#d6e2f8] bg-white px-3 py-3 text-xs">
              <strong className="block">Role: Property administrator</strong>
              <span className="mt-1 block text-[#667085]">
                The server applies this role; it cannot become an occupancy
                role.
              </span>
            </div>
          )}
        </fieldset>

        {mutation.isError ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          >
            {parseApiError(mutation.error).message}
          </p>
        ) : null}
        {success ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#2563eb] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93b4f6]"
          disabled={mutation.isPending || !displayName.trim() || !email.trim()}
        >
          {mutation.isPending ? (
            "Adding person…"
          ) : (
            <>
              <Mail className="h-4 w-4" />
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
      className={`p-4 ${divided ? "border-t border-[#edf0f5] md:border-l md:border-t-0" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#2563eb]" />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded bg-[#f1f6ff] px-1.5 py-0.5 text-[10px] font-bold text-[#2563eb]">
          {items.length}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>
      {items.length ? (
        <ul className="mt-3 divide-y divide-[#edf0f5]">
          {items.map((item) => (
            <li
              key={`${item.source}:${item.party.id}:${item.role}`}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="min-w-0">
                <strong className="block truncate text-sm">
                  {item.party.display_name}
                </strong>
                <span className="mt-0.5 block truncate text-xs text-[#667085]">
                  {item.party.email || "No email"}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[#dce3ee] bg-[#f8faff] px-2 py-1 text-[10px] font-semibold capitalize">
                {roleLabel(item.role)}
                {item.is_super_admin ? " · Primary" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-xs leading-5 text-[#667085]">
          {empty}
        </p>
      )}
    </div>
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
    <div className="border-b border-[#edf0f5] px-4 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-medium text-[#667085]">{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-[#98a2b3]">{detail}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <span className="mt-1.5 block">{children}</span>
      {hint ? (
        <span className="mt-1.5 block font-normal leading-5 text-[#667085]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function EmptyProperty() {
  return (
    <section className="rounded-lg border border-dashed border-[#c8d1df] bg-white p-8 text-center sm:p-10">
      <Building2 className="mx-auto h-8 w-8 text-[#2563eb]" />
      <h2 className="mt-3 text-base font-semibold">
        Choose a property to manage people
      </h2>
      <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-[#667085]">
        Select a property or space above. Its use case determines whether you
        add residents, employees, members or guests.
      </p>
      <Link
        href="/admin/properties"
        className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#2563eb] hover:bg-[#edf3ff]"
      >
        Review properties
        <ArrowRight className="h-4 w-4" />
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
    <section
      className="rounded-lg border border-red-200 bg-red-50 p-5"
      role="alert"
    >
      <h2 className="text-sm font-semibold">People unavailable</h2>
      <p className="mt-1 text-sm text-red-800">
        {parseApiError(error).message}
      </p>
      <button
        type="button"
        className="mt-4 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800"
        onClick={retry}
      >
        Retry
      </button>
    </section>
  );
}

function PeopleSkeleton() {
  return (
    <div className="space-y-4" role="status">
      <span className="sr-only">Loading property people</span>
      <div className="h-24 animate-pulse rounded-lg bg-[#e8edf5]" />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-80 animate-pulse rounded-lg bg-[#e8edf5]" />
        <div className="h-80 animate-pulse rounded-lg bg-[#e8edf5]" />
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
    return "Employees, members and tenants assigned to this space.";
  }
  return "Residents, owners and tenants assigned to this space.";
}

function roleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
