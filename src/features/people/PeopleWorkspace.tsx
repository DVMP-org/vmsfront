"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Mail,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { PlacePicker } from "@/components/sites/PlacePicker";
import { SitePicker } from "@/components/sites/SitePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Modal } from "@/components/ui/Modal";
import { useSiteAccess } from "@/features/context/use-site-access";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { AccessCredentialDialog } from "@/features/access-credentials/AccessCredentialDialog";
import { type AddPlacePersonInput, peopleApi, type PlacePerson } from "./api";
import "./people-directory.css";

const OCCUPANCY_ROLES = {
  residential: ["resident", "owner", "tenant"],
  commercial: ["employee", "member", "tenant"],
  hospitality: ["guest"],
  mixed_use: ["resident", "owner", "tenant", "employee", "member", "guest"],
} as const;

export default function PeopleWorkspace() {
  const organization = useAppStore((state) => state.organization);
  const selectedSite = useAppStore((state) => state.selectedProperty);
  const setSelectedSite = useAppStore((state) => state.setSelectedProperty);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const access = useSiteAccess();
  const profile = access.workspace;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [credentialPerson, setCredentialPerson] = useState<PlacePerson | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const contextKey = `${organization?.id}:${user?.id}`;
  const siteId = selectedSite?.id || null;
  const people = useQuery({
    queryKey: ["site-people", contextKey, siteId],
    queryFn: () => peopleApi.get(siteId!),
    enabled: !!siteId,
    retry: false,
  });
  const canManage =
    access.allowed("parties.create") &&
    access.allowed("place_relationships.create");
  const roles =
    OCCUPANCY_ROLES[
      (people.data?.effective_use_case ||
        "mixed_use") as keyof typeof OCCUPANCY_ROLES
    ];
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (people.data?.people ?? []).filter((person) => {
      const matchesSearch = [
        person.party.display_name,
        person.party.email || "",
        person.place.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
      return matchesSearch && (!role || person.role === role);
    });
  }, [people.data?.people, role, search]);
  const columns: Column<PlacePerson>[] = [
    {
      key: "person",
      header: "Person",
      sortable: true,
      accessor: (person) => (
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--vms-surface-subtle)]">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <strong className="block">{person.party.display_name}</strong>
            <span className="block text-xs text-[var(--vms-ink-muted)]">
              {person.party.email || "No email"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Party role",
      sortable: true,
      accessor: (person) => <Badge variant="default">{person.role}</Badge>,
    },
    {
      key: "place",
      header: "Place",
      accessor: (person) => (
        <span>
          <strong className="block text-sm">{person.place.name}</strong>
          <span className="block text-xs capitalize text-[var(--vms-ink-muted)]">
            {person.place.kind}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (person) => (
        <Badge variant={person.party.is_active ? "success" : "neutral"}>
          {person.party.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      mobileHide: true,
      accessor: (person) => (
        <span className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCredentialPerson(person)}
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            Credential
          </Button>
          {canManage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void peopleApi
                  .remove(siteId!, "occupancy", person.assignment_id)
                  .then(async () => {
                    setNotice("Party relationship ended.");
                    await queryClient.invalidateQueries({
                      queryKey: ["site-people", contextKey, siteId],
                    });
                  });
              }}
            >
              Remove
            </Button>
          ) : null}
        </span>
      ),
    },
  ];
  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-5 pb-10 text-[var(--vms-ink)]">
      <header className="border-b border-[var(--vms-line)] pb-5">
        <p className="flex items-center gap-2 text-xs text-[var(--vms-ink-muted)]">
          <Users className="h-3.5 w-3.5 text-[var(--vms-active-accent)]" />
          {organization?.name}
          <span>/</span>
          <span className="font-semibold text-[var(--vms-ink)]">People</span>
          {selectedSite ? (
            <>
              <span>/</span>
              <span>{selectedSite.name}</span>
            </>
          ) : null}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em]">
              People
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--vms-ink-muted)]">
              Every person here is a Party attached to a non-Site Place in the
              selected Site. Site managers are administered separately and may
              also hold a Place relationship.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/managers">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Managers
              </Link>
            </Button>
            {canManage ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add party
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <section className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-4">
        {selectedSite ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              <span>
                <small className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--vms-ink-muted)]">
                  Site context
                </small>
                <strong>{selectedSite.name}</strong>
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSite(null)}
            >
              Change Site
            </Button>
          </div>
        ) : (
          <SitePicker
            label="Choose a Site workspace"
            value={selectedSite}
            onChange={setSelectedSite}
          />
        )}
      </section>
      {notice ? (
        <InlineAlert tone="success" title="People updated">
          <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
          {notice}
        </InlineAlert>
      ) : null}
      {!siteId ? (
        <InlineAlert tone="warning" title="Select a Site workspace">
          People are listed in the context of one Site.
        </InlineAlert>
      ) : people.isError ? (
        <InlineAlert
          tone="danger"
          title="People could not be loaded"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => people.refetch()}
            >
              Retry
            </Button>
          }
        >
          {parseApiError(people.error).message}
        </InlineAlert>
      ) : (
        <section className="space-y-3">
          <label className="flex min-h-11 items-center gap-2 rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] px-3">
            <span className="text-xs font-semibold text-[var(--vms-ink-muted)]">
              Party role
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="min-h-9 flex-1 bg-transparent text-sm"
            >
              <option value="">All roles</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <DataTable
            data={rows}
            columns={columns}
            tableLabel="Site Parties"
            searchable
            initialSearch={search}
            onSearchChange={setSearch}
            isLoading={people.isPending}
            emptyMessage="No Parties match these filters"
            mobileSummary={(person) => (
              <span className="flex items-center gap-3">
                <UserRound className="h-5 w-5" aria-hidden="true" />
                <span>
                  <strong className="block">{person.party.display_name}</strong>
                  <span className="text-xs text-[var(--vms-ink-muted)]">
                    {person.role} at {person.place.name}
                  </span>
                </span>
              </span>
            )}
          />
        </section>
      )}
      <AddPartyModal
        open={addOpen}
        siteId={siteId}
        roles={roles}
        onClose={() => setAddOpen(false)}
        onSaved={async (message) => {
          setAddOpen(false);
          setNotice(message);
          await queryClient.invalidateQueries({
            queryKey: ["site-people", contextKey, siteId],
          });
        }}
      />
      <AccessCredentialDialog
        person={credentialPerson}
        onClose={() => setCredentialPerson(null)}
      />
    </main>
  );
}

function AddPartyModal({
  open,
  siteId,
  roles,
  onClose,
  onSaved,
}: {
  open: boolean;
  siteId: string | null;
  roles: readonly string[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [place, setPlace] = useState<{ id: string; name: string } | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      const body: AddPlacePersonInput = {
        display_name: displayName.trim(),
        email: email.trim(),
        place_id: place!.id,
        kind: "person",
        ...(role ? { role } : {}),
      };
      return peopleApi.add(siteId!, body);
    },
    onSuccess: () =>
      onSaved("Party attached to the selected Place and onboarding prepared."),
  });
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add a Party to a Place"
      description="This creates a person membership at one non-Site Place."
      size="lg"
    >
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (displayName.trim() && email.trim() && place) mutation.mutate();
        }}
        className="space-y-4"
      >
        <Field id="person-name" label="Full name" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
          )}
        </Field>
        <Field id="person-email" label="Email address" required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          )}
        </Field>
        <div className="space-y-2">
          <p className="text-[13px] font-semibold">Place</p>
          <PlacePicker
            siteId={siteId!}
            label="Choose a Place in this Site"
            value={place}
            onChange={setPlace}
          />
        </div>
        <Field id="person-role" label="Party role">
          {(control) => (
            <select
              {...control}
              className={fieldControlClassName}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="">Use the Place default</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
        </Field>
        {mutation.isError ? (
          <InlineAlert tone="danger" title="Party could not be added">
            {parseApiError(mutation.error).message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              !displayName.trim() ||
              !email.trim() ||
              !place
            }
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {mutation.isPending ? "Adding…" : "Add and invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
