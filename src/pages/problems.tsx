import Head from "next/head";
import { Footer } from "@/pages/components/Footer";
import { Nav } from "@/pages/components/Nav";

export default function Problems() {
  const problemCards = [
    {
      title: "Front desks end up improvising",
      body: "Many teams still rely on calls, notebooks, chat messages, and memory to decide who should enter. That makes arrivals slower and more stressful than they need to be.",
    },
    {
      title: "Approvals are hard to track",
      body: "When approvals are spread across phones, chats, and spreadsheets, nobody has one reliable picture of what was approved, by whom, and for what reason.",
    },
    {
      title: "Visitors get a poor first impression",
      body: "A disorganized arrival process does not just slow operations. It makes communities, sites, and organizations feel less professional the moment someone arrives.",
    },
    {
      title: "Leadership cannot see the real picture",
      body: "Executives and site leaders need visibility into visits, traffic, exceptions, and bottlenecks, but most systems do not turn activity into a clear operating view.",
    },
    {
      title: "Residents and staff repeat work",
      body: "Without a proper workflow, the same information gets entered, confirmed, and re-confirmed multiple times across residents, security teams, and admins.",
    },
    {
      title: "Records are incomplete when it matters most",
      body: "If a team needs to review a visit later, fragmented logs and unclear timestamps create avoidable risk, confusion, and wasted time.",
    },
  ];

  const betterFlow = [
    ["Before arrival", "Guests are invited in advance, approvals are clear, and the site knows what to expect."],
    ["At check-in", "Teams follow one visible workflow instead of relying on memory or back-and-forth calls."],
    ["During the visit", "Staff, residents, and operators stay aligned on who is on site and what changed."],
    ["After exit", "Records remain easy to review for operations, support, and leadership reporting."],
  ];

  const outcomes = [
    "A better guest experience",
    "Fewer front-desk delays",
    "Cleaner approval records",
    "More confidence for operators",
    "Clearer oversight for leadership",
    "A more professional arrival experience",
  ];

  return (
    <>
      <Head>
        <title>Problems We Solve | VMS Core</title>
        <meta
          name="description"
          content="See the operational problems VMS Core helps teams solve across visitor approvals, gate activity, resident coordination, and site visibility."
        />
      </Head>
      <Nav />
      <main>
        <section className="section" style={{ paddingTop: "152px", paddingBottom: "72px", overflow: "hidden" }}>
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
            <span className="section-label">Problems</span>
            <h1 className="section-headline" style={{ margin: "0 auto 18px auto", maxWidth: "780px" }}>
              The real problem is not visitor check-in. It is operational uncertainty.
            </h1>
            <p className="section-desc" style={{ margin: "0 auto 28px auto", maxWidth: "720px" }}>
              Most visitor systems break down because approvals, arrivals, resident coordination,
              and site visibility do not live in one dependable workflow. VMS Core is designed to
              replace that confusion with a calmer, clearer operating model.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
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
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "20px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {problemCards.map((card) => (
                <div key={card.title} className="card" style={{ padding: "24px", minHeight: "100%" }}>
                  <div
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
                  <h2 className="font-display" style={{ fontSize: "1.08rem", marginBottom: "10px", color: "var(--text-primary)" }}>
                    {card.title}
                  </h2>
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.94rem", lineHeight: 1.7 }}>
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
            <div className="card" style={{ padding: "30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "28px", alignItems: "start" }}>
                <div>
                  <span className="section-label">What better looks like</span>
                  <h2 className="section-headline" style={{ marginBottom: "14px", maxWidth: "560px" }}>
                    One flow that makes sense before, during, and after every visit.
                  </h2>
                  <p className="section-desc" style={{ marginBottom: 0, maxWidth: "560px" }}>
                    A good system does not just record visits. It gives each person involved a clear
                    next step and leaves the organization with a cleaner record of what happened.
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
                        <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px", fontSize: "0.98rem" }}>
                          {title}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.65 }}>
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
              <h2 className="section-headline" style={{ margin: "0 auto 12px auto", maxWidth: "700px" }}>
                Better operations are usually the result of better flow design.
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {outcomes.map((item) => (
                <div
                  key={item}
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
