import {
  ArrowRight,
  Building2,
  ConciergeBell,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import type { WorkspaceRelationship } from "@/types";
import { formatDateTime } from "@/lib/datetime";
import { guestName, type Stay } from "./contracts";

export interface SiteAdministrator {
  site_admin_id: string;
  user_id: string;
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
  staysLoading,
  staysError,
  onRetryStays,
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
  staysLoading: boolean;
  staysError: string | null;
  onRetryStays: () => void;
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  onOpenStay: (id: string) => void;
}) {
  const arrivals = stays
    .filter((stay) => stay.status === "reserved")
    .sort(
      (left, right) =>
        new Date(left.planned_check_in).getTime() -
        new Date(right.planned_check_in).getTime(),
    );

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
              <Button variant="outline" size="sm" type="button" onClick={onRetry}>
                Retry people
              </Button>
            </div>
          ) : administrators.length || relationships.length ? (
            <ul className="hotel-people-list">
              {administrators.slice(0, 4).map((administrator) => (
                <li key={administrator.site_admin_id}>
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
                    <Avatar
                      name={relationship.party.display_name}
                      src={relationship.party.avatar_url}
                      size="xs"
                      className="hotel-person-icon"
                    />
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
              <h3>Reserved stays</h3>
              <p>Up to five arrivals from the reserved stay queue.</p>
            </div>
            <ConciergeBell className="h-5 w-5" />
          </div>
          {staysLoading ? (
            <p role="status" className="stay-muted">
              Loading reserved stays…
            </p>
          ) : staysError ? (
            <div role="alert" className="stay-error">
              {staysError}
              <Button variant="outline" size="sm" type="button" onClick={onRetryStays}>
                Retry stays
              </Button>
            </div>
          ) : arrivals.length ? (
            <ul className="hotel-arrival-list">
              {arrivals.slice(0, 5).map((stay) => (
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
                        {formatDateTime(stay.planned_check_in)}
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
              <p>No reserved stays in this Site.</p>
              <small>
                New reservations will appear here for arrival review.
              </small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function roleLabel(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
