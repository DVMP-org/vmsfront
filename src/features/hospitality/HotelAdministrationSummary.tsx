import {
  ArrowRight,
  Building2,
  CalendarClock,
  ConciergeBell,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { WorkspaceRelationship } from "@/types";
import { guestName, type Stay } from "./contracts";

const OCCUPANCY_ROLES = new Set([
  "resident",
  "resident_of",
  "owner",
  "tenant",
  "member",
  "member_of",
]);
const STAFF_ROLES = new Set([
  "employee",
  "staff",
  "hotel_staff",
  "operator",
  "manager",
]);
const GUEST_ROLES = new Set(["guest", "guest_of"]);

export interface SiteAdministrator {
  party_id: string;
  display_name: string;
  email: string | null;
  role: string;
}

export function HotelAdministrationSummary({
  administrators,
  authorityMode,
  authoritativePlaceName,
  relationships,
  stays,
  loading,
  error,
  onRetry,
  onOpenStay,
}: {
  administrators: SiteAdministrator[];
  authorityMode?: "local" | "inherited" | "none";
  authoritativePlaceName?: string | null;
  relationships: WorkspaceRelationship[];
  stays: Stay[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  onOpenStay: (id: string) => void;
}) {
  const people = groupPeople(relationships);
  const arrivals = stays
    .filter((stay) => stay.status === "reserved")
    .sort(
      (left, right) =>
        new Date(left.planned_check_in).getTime() -
        new Date(right.planned_check_in).getTime(),
    )
    .slice(0, 5);

  return (
    <section className="hotel-admin-overview" aria-label="Hotel administration">
      <div className="hotel-admin-intro">
        <div>
          <p className="stay-eyebrow">SITE MANAGEMENT / HOTEL OPERATIONS</p>
          <h2>Administration and occupancy</h2>
          <p>
            Administrators, occupants, staff, guests and expected arrivals for
            this operating context.
          </p>
        </div>
        <span className="hotel-admin-scope">
          <Building2 className="h-3.5 w-3.5" />
          Selected property context
        </span>
      </div>

      <div className="hotel-metrics">
        <Metric
          icon={ShieldCheck}
          label="Administrators"
          value={administrators.length}
        />
        <Metric
          icon={UserRound}
          label="Occupants"
          value={people.occupants.length}
        />
        <Metric
          icon={Users}
          label="Staff & guests"
          value={people.staff.length + people.guests.length}
        />
        <Metric
          icon={CalendarClock}
          label="Expected arrivals"
          value={arrivals.length}
        />
      </div>

      <div className="hotel-overview-grid">
        <div className="hotel-overview-panel">
          <div className="hotel-panel-heading">
            <div>
              <h3>People in this site</h3>
              <p>
                {authorityMode === "inherited" && authoritativePlaceName
                  ? `Administration is inherited from ${authoritativePlaceName}.`
                  : "Administration remains separate from occupancy and stays."}
              </p>
            </div>
          </div>
          {loading ? (
            <p role="status" className="stay-muted">
              Loading people…
            </p>
          ) : error ? (
            <div role="alert" className="stay-error">
              {error}
              <button type="button" onClick={onRetry}>
                Retry people
              </button>
            </div>
          ) : administrators.length || relationships.length ? (
            <ul className="hotel-people-list">
              {administrators.slice(0, 4).map((administrator) => (
                <li key={administrator.party_id}>
                  <span className="hotel-person-icon">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong>{administrator.display_name}</strong>
                    <small>
                      {roleLabel(administrator.role)}
                      {administrator.email ? ` · ${administrator.email}` : ""}
                    </small>
                  </span>
                </li>
              ))}
              {relationships
                .filter(
                  (relationship) =>
                    !["admin", "super_admin"].includes(
                      relationship.role.toLowerCase(),
                    ),
                )
                .slice(0, Math.max(0, 8 - administrators.length))
                .map((relationship) => (
                  <li key={relationship.id}>
                    <span className="hotel-person-icon">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong>{relationship.party.display_name}</strong>
                      <small>
                        {roleLabel(relationship.role)} ·{" "}
                        {relationship.place.name}
                      </small>
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="stay-muted">No active people relationships found.</p>
          )}
        </div>

        <div className="hotel-overview-panel">
          <div className="hotel-panel-heading">
            <div>
              <h3>Expected arrivals</h3>
              <p>Reserved stays waiting for hotel admission.</p>
            </div>
            <ConciergeBell className="h-5 w-5" />
          </div>
          {arrivals.length ? (
            <ul className="hotel-arrival-list">
              {arrivals.map((stay) => (
                <li key={stay.id}>
                  <a
                    href={`?stay=${stay.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onOpenStay(stay.id);
                    }}
                  >
                    <span>
                      <strong>{guestName(stay)}</strong>
                      <small>
                        {new Date(stay.planned_check_in).toLocaleString()}
                      </small>
                    </span>
                    <span>
                      {stay.room_assignments.at(-1)?.room.name || "No room"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="hotel-arrival-empty">
              <ConciergeBell className="h-6 w-6" />
              <p>No reserved arrivals in the current result set.</p>
              <small>
                Choose “Reserved” in the stay filter to review the queue.
              </small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="hotel-metric">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function groupPeople(relationships: WorkspaceRelationship[]) {
  return relationships.reduce(
    (groups, relationship) => {
      const role = relationship.role.toLowerCase();
      if (OCCUPANCY_ROLES.has(role)) groups.occupants.push(relationship);
      else if (STAFF_ROLES.has(role)) groups.staff.push(relationship);
      else if (GUEST_ROLES.has(role)) groups.guests.push(relationship);
      return groups;
    },
    {
      occupants: [] as WorkspaceRelationship[],
      staff: [] as WorkspaceRelationship[],
      guests: [] as WorkspaceRelationship[],
    },
  );
}

function roleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
