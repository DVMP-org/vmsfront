/**
 * Plain-language explanations for checkpoint decision reason codes.
 *
 * Operators act on these sentences at the gate, so every entry says what
 * happened and what to do next instead of restating the machine code.
 */
const reasonMessages: Record<string, string> = {
    authorization_valid: "Invitation is valid. The visitor may pass.",
    authorization_requested:
        "This invitation is still awaiting approval, so nobody can check in yet. Approve the visit first, then scan the same ID again.",
    authorization_approved: "Invitation is approved.",
    authorization_declined:
        "The host declined this invitation. Nobody can check in with it.",
    authorization_cancelled:
        "This invitation was cancelled. Create a new invite if the visit is still happening.",
    authorization_revoked:
        "This invitation was revoked. Ask the host to issue a new one.",
    authorization_expired:
        "This invitation has expired. Extend the visit window or issue a new invite.",
    authorization_not_started:
        "This invitation is not valid yet. The visit window has not started.",
    invitation_not_found:
        "No invitation matches that ID. Check the six-digit code and try again.",
    invitation_guest_not_found:
        "That visitor is not part of this invitation. Pick a visitor from the list.",
    guest_suffix_required:
        "This invitation covers several visitors. Choose the visitor who is passing.",
    credential_not_found:
        "That credential is not recognised. Check the code, or scan the badge QR again.",
    credential_expired: "This badge or code has expired.",
    credential_revoked: "This badge or code was revoked.",
    credential_suspended: "This badge or code is suspended.",
    credential_replaced: "This badge was replaced. Use the newer one.",
    party_inactive: "The party record for this badge is inactive.",
    checkpoint_outside_schedule:
        "This checkpoint is outside its operating hours. Use the override if the pass is authorised.",
    checkpoint_override: "Passed with an authorised override.",
    credential_type_not_allowed:
        "This checkpoint does not accept that kind of credential.",
    already_present:
        "This visitor is already checked in here. Check them out first.",
    no_active_session:
        "There is no open visit to check out. Check the visitor in first.",
    no_active_presence:
        "This visitor is not recorded as inside. Check them in before checking out.",
    parent_checkpoint_required:
        "The visitor must pass the parent checkpoint before this one.",
    child_checkpoint_active:
        "The visitor is still inside a child checkpoint. Clear that area first.",
    max_uses_reached:
        "This invitation has used all of its allowed entries. Issue a new invite.",
    entry_not_permitted: "This checkpoint does not allow entry.",
    exit_not_permitted: "This checkpoint does not allow exit.",
    direction_required:
        "This checkpoint needs an explicit direction. Choose check in or check out.",
    direction_ambiguous:
        "The server cannot tell whether this is an arrival or a departure. Choose check in or check out.",
    manual_direction_not_permitted:
        "This checkpoint chooses the direction automatically and does not allow the opposite one.",
    reentry_not_allowed:
        "This checkpoint does not allow re-entry after check out.",
    party_not_authorized_for_site:
        "This badge is not authorised for this site.",
};

/** Human sentence for a reason code, falling back to a readable title case. */
export function reasonMessage(code?: string | null): string {
    if (!code) return "No reason was recorded.";
    const known = reasonMessages[code.toLowerCase()];
    if (known) return known;
    return code
        .replaceAll("_", " ")
        .replace(/^\w/, (character) => character.toUpperCase());
}

/** Short label for tables, e.g. "Not approved yet". */
const reasonLabels: Record<string, string> = {
    authorization_requested: "Not approved yet",
    authorization_declined: "Declined",
    authorization_cancelled: "Cancelled",
    authorization_revoked: "Revoked",
    authorization_expired: "Expired",
    authorization_not_started: "Not valid yet",
    authorization_valid: "Valid",
    guest_suffix_required: "Visitor not chosen",
    invitation_not_found: "Invitation not found",
    invitation_guest_not_found: "Visitor not on invite",
    credential_not_found: "Credential not found",
    already_present: "Already inside",
    no_active_session: "Not checked in",
    no_active_presence: "Not inside",
    max_uses_reached: "Uses exhausted",
    manual_direction_not_permitted: "Wrong direction",
};

export function reasonLabel(code?: string | null): string {
    if (!code) return "No reason";
    const known = reasonLabels[code.toLowerCase()];
    if (known) return known;
    return code.replaceAll("_", " ");
}

/**
 * Sentence for a completed passage, derived from the action and the
 * checkpoint graph.
 *
 * A Site with a single checkpoint reports plain success; a multi-checkpoint
 * Site also names the next gate the visitor must pass, so the operator knows
 * the visit is not finished yet.
 */
export function passageMessage(passage: {
    person_name?: string | null;
    direction: "entry" | "exit";
    outcome: string;
    reason_code?: string | null;
    gate_name?: string | null;
    next_gate_name?: string | null;
}): string {
    if (passage.outcome !== "allowed") {
        return reasonMessage(passage.reason_code);
    }
    const person = passage.person_name?.trim() || "The visitor";
    const action = passage.direction === "entry" ? "checked in" : "checked out";
    const next = passage.next_gate_name?.trim();
    if (next) {
        const nextAction = passage.direction === "entry" ? "check in" : "check out";
        return `${person} ${action} at ${passage.gate_name || "the checkpoint"}. Next: ${nextAction} at ${next}.`;
    }
    return `${person} ${action} successfully.`;
}
