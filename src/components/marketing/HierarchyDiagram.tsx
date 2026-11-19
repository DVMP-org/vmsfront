import { Building2, Building, DoorOpen, UsersRound } from "lucide-react";

export function HierarchyDiagram() {
  return (
    <div
      className="mk-hierarchy"
      role="img"
      aria-label="An organization manages multiple sites; sites contain places and give teams role-based workspaces."
    >
      <div className="mk-org-node">
        <Building2 size={19} />
        <span>
          <b>Organization</b>
          <small>Portfolio and shared settings</small>
        </span>
      </div>
      <div className="mk-branch">
        <div className="mk-site-node">
          <Building size={17} />
          <span>
            <b>Residential site</b>
            <small>Estate · Lagos</small>
          </span>
        </div>
        <div className="mk-site-node">
          <Building size={17} />
          <span>
            <b>Commercial site</b>
            <small>Offices · Abuja</small>
          </span>
        </div>
        <div className="mk-site-node mk-site-future">
          <Building size={17} />
          <span>
            <b>Another location</b>
            <small>Its own team and setup</small>
          </span>
        </div>
      </div>
      <div className="mk-place-row">
        <span>
          <DoorOpen size={14} /> Places
        </span>
        <span>
          <UsersRound size={14} /> Role-based workspaces
        </span>
      </div>
    </div>
  );
}
