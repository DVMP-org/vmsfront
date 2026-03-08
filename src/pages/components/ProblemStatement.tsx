export function ProblemStatement() {
  return (
    <section className="section problem-section scroll-reveal">
      <div className="container" style={{ position: "relative" }}>
        <div className="problem-shell">
          <div>
            <span className="section-label">Why community admins and decision-makers switch</span>
            <p className="problem-copy font-display">
              Still tracking visitor approvals in a group chat? Still finding out
              someone entered your property only after the fact? Still issuing gate
              codes that half the neighborhood already has? You don’t have a
              software problem. You have a visibility problem — and it gets worse
              every time your community grows.
            </p>
          </div>

          <div className="problem-aside">
            <div
              style={{
                color: "var(--text-tertiary)",
                fontSize: "0.74rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "12px",
              }}
            >
              What managers told us
            </div>
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "1.04rem",
                marginBottom: "8px",
              }}
            >
              One system the gate team trusts and leadership can actually read.
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.94rem",
                lineHeight: 1.7,
              }}
            >
              Decision-makers need a clean audit trail and portfolio-wide visibility.
              Gate staff need a process that doesn’t slow them down. Residents need
              fewer steps. VMS Core is designed to deliver all three from one place.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
