import Head from "next/head";
import { Footer } from "@/page-components/Footer";
import { Nav } from "@/page-components/Nav";
import { useAppContext } from "@/lib/app_context";

export default function Solutions() {
  const { appName } = useAppContext();
  const problemCards = [
    {
      title: "That visitor has been waiting at the gate for 10 minutes",
      body: "Your gate team is calling the resident, the resident isn’t picking up, and nobody can find the original approval. Sound familiar? That’s what happens when approvals live in group chats instead of a shared system.",
    },
    {
      title: "Gate codes that half the neighborhood already has",
      body: "The code went out in a newsletter six months ago. Nobody changed it. Three contractors, two ex-residents, and a delivery driver all still have it. You won’t know until something goes wrong.",
    },
    {
      title: "The vendor who shows up unannounced on a Saturday",
      body: "Nobody logged the visit. Nobody sent an access pass. The gate team turns them away, the maintenance job gets delayed, and your property manager gets an angry call. A proper visit request workflow would have prevented all of it.",
    },
    {
      title: "Leadership asks for an access report and nobody has one",
      body: "How many people entered the property last month? How many visits were approved vs. flagged? Which gate had the most events? Most teams can’t answer these questions without digging through notebooks and chat logs.",
    },
    {
      title: "Your front desk manually re-enters the same information three times",
      body: "The resident fills in the form. The gate team re-enters it in their log. The admin copies it into a spreadsheet. Without a shared workflow, every step is a new opportunity for something to get misread or missed.",
    },
    {
      title: "Something happened at the gate last night and you have no record",
      body: "If a resident makes a complaint or a dispute arises, fragmented logs, missing timestamps, and no audit trail turn a recoverable situation into a risk. Clean records are only valuable if the system creates them automatically.",
    },
  ];

  const betterFlow = [
    ["Before arrival", "Guests are invited in advance, approvals are clear, and the site knows what to expect."],
    ["At check-in", "Teams follow one visible workflow instead of relying on memory or back-and-forth calls."],
    ["During the visit", "Staff, residents, and operators stay aligned on who is on site and what changed."],
    ["After exit", "Records remain easy to review for operations, support, and leadership reporting."],
  ];

  const outcomes = [
    "No more ‘who approved this?’ moments",
    "Visitors don’t wait at a locked gate",
    "Audit trail for every access event",
    "Leadership sees the real access picture",
    "Residents handle their own guest passes",
    "Gate codes that actually expire",
  ];

  return (
    <>
      <Head>
        <title>Solutions | {appName}</title>
        <meta
          name="description"
          content={`See the operational problems ${appName} helps teams solve across visitor approvals, gate activity, resident coordination, and site visibility.`}
        />
      </Head>
      <Nav />
      <main>
        <section className="section problems-hero-section" style={{ paddingTop: "152px", paddingBottom: "72px", overflow: "hidden" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "-16%", left: "10%", width: "400px", height: "400px", opacity: 0.42 }}
          ></div>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "18%",
              top: "20%",
              color: "rgba(124,169,255,0.6)",
              fontSize: "1.15rem",
              opacity: 0.7,
            }}
          >
            ✦
          </div>
          <div className="container" style={{ textAlign: "center" }}>
            <span className="section-label">Solutions</span>
            <h1 className="section-headline problems-hero-headline" style={{ margin: "0 auto 18px auto", maxWidth: "780px" }}>
              Traditional visitor management wasn’t built for communities. It was built for offices.
            </h1>
            <p className="section-desc problems-hero-desc" style={{ margin: "0 auto 28px auto", maxWidth: "720px" }}>
              Clipboards, shared gate codes, and WhatsApp approvals worked when your
              community was smaller. Now they’re the reason your team is always one
              unanswered call away from an access incident. {appName} replaces the mess
              with a calm, auditable workflow every role can follow.
            </p>
            <div className="problems-hero-cta" style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <a href="/#contact" className="btn-primary" style={{ textDecoration: "none" }}>
                Book a Demo
              </a>
              <a href="/" className="btn-secondary" style={{ textDecoration: "none" }}>
                Back to Overview
              </a>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: "32px", overflow: "hidden" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "10% 0 auto 0",
              margin: "0 auto",
              width: "74%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          ></div>
          <div className="container">
            <div
              className="problems-cards-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "20px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {problemCards.map((card) => (
                <div key={card.title} className="card problems-card" style={{ padding: "24px", minHeight: "100%" }}>
                  <div
                    className="problems-card-label"
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: "0.74rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      marginBottom: "12px",
                    }}
                  >
                    Common failure point
                  </div>
                  <h2 className="font-display problems-card-title" style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--text-primary)" }}>
                    {card.title}
                  </h2>
                  <p className="problems-card-body" style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.94rem", lineHeight: 1.7 }}>
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ overflow: "hidden" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ bottom: "-20%", right: "-4%", left: "auto", width: "420px", height: "420px", opacity: 0.24 }}
          ></div>
          <div className="container">
            <div className="card problems-better-card" style={{ padding: "30px" }}>
              <div className="problems-better-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "28px", alignItems: "start" }}>
                <div>
                  <span className="section-label">What better looks like</span>
                  <h2 className="section-headline problems-better-headline" style={{ marginBottom: "14px", maxWidth: "560px" }}>
                    One clear flow, from invite to exit.
                  </h2>
                  <p className="section-desc problems-better-desc" style={{ marginBottom: 0, maxWidth: "560px" }}>
                    A good system doesn’t just record who came in. It gives every person
                    involved a clear next step — and leaves your team with a clean record
                    of what happened and who was responsible.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "14px" }}>
                  {betterFlow.map(([title, text], index) => (
                    <div
                      key={title}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px minmax(0, 1fr)",
                        gap: "14px",
                        padding: "16px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: index === 1 ? "linear-gradient(180deg, rgba(84,132,255,0.1), rgba(255,255,255,0.02))" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "var(--text-primary)",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="problems-flow-title" style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px", fontSize: "0.98rem" }}>
                          {title}
                        </div>
                        <div className="problems-flow-text" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                          {text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: "28px", overflow: "hidden" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "18%", left: "12%", width: "280px", height: "280px", opacity: 0.18 }}
          ></div>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <span className="section-label">Outcomes</span>
              <h2 className="section-headline problems-outcomes-headline" style={{ margin: "0 auto 12px auto", maxWidth: "700px" }}>
                Switch to a system built for communities that actually care.
              </h2>
            </div>

            <div
              className="problems-outcomes-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {outcomes.map((item) => (
                <div
                  key={item}
                  className="problems-outcome-item"
                  style={{
                    padding: "16px 18px",
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--text-secondary)",
                    fontSize: "0.95rem",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
