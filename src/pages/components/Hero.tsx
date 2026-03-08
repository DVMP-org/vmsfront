import Link from "next/link";
import { Fragment } from "react";
import { motion } from "framer-motion";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const activities = [
    ["Visit request submitted", "Residents and staff can review the next action without back-and-forth"],
    ["Due reminder posted", "Operations keeps payments and follow-up in one shared system"],
    ["Gate team monitoring live", "Leadership sees access, arrivals, and site activity across properties"],
  ];

  const navigationItems = ["Admin Dashboard", "Visitor Queue", "Gate Control", "Access Audit", "Resident Requests", "Announcements"];

  const queue = [
    ["A. Johnson", "Delivery guest", "Approved"],
    ["Greenfield Vendor", "Maintenance team", "Pending"],
    ["Resident Family", "Personal visit", "Scheduled"],
  ];

  return (
    <section
      className="section"
      style={{
        paddingTop: "154px",
        paddingBottom: "96px",
      }}
    >
      <motion.div
        className="container"
        style={{ position: "relative", zIndex: 10 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="hero-layout" style={{ gap: "30px" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <motion.div
              variants={itemVariants}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                marginBottom: "28px",
                fontSize: "0.84rem",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  boxShadow: "0 0 0 6px rgba(84, 132, 255, 0.12)",
                }}
              ></span>
              Built for community administrators — HOAs, gated communities, apartments &amp; managed properties
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="section-headline"
              style={{
                maxWidth: "760px",
                margin: "0 0 18px 0",
                textAlign: "center",
                fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                lineHeight: 1.0,
              }}
            >
              Stop improvising.
              <br />
              Start operating.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="section-desc"
              style={{
                margin: "0 0 24px 0",
                maxWidth: "560px",
                textAlign: "center",
                fontSize: "1.04rem",
              }}
            >
              One platform that replaces the group chats, gate codes, and notebooks
              your team still relies on.
            </motion.p>

            <motion.div
              variants={itemVariants}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              {[
                "Visitor approvals",
                "Gate access & audits",
                "Resident self-service",
                "Visit requests",
                "Dues & wallet",
                "Community forum",
              ].map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "var(--text-secondary)",
                    fontSize: "0.8rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}
            >

              <Link href="/#platform" className="btn-secondary" style={{ padding: "15px 28px", fontSize: "0.98rem", textDecoration: "none" }}>
                Explore Platform
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <div style={{ width: "100%", maxWidth: "920px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>


              <div
                style={{
                  width: "100%",
                  maxWidth: "920px",
                  borderRadius: "32px",
                  padding: "14px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 48px 120px -70px rgba(0, 0, 0, 1)",
                }}
              >
                <div
                  style={{
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: "56px",
                      height: "6px",
                      borderRadius: "999px",
                      background: "rgba(255, 255, 255, 0.18)",
                    }}
                  ></span>
                </div>

                <div className="card" style={{ padding: "0", minHeight: "560px", borderRadius: "24px", background: "rgba(8, 9, 11, 0.96)" }}>
                  <div
                    style={{
                      padding: "18px 22px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "var(--text-tertiary)",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.14em",
                          marginBottom: "6px",
                        }}
                      >
                        Live operations surface
                      </div>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 700,
                          fontSize: "1.08rem",
                        }}
                      >
                        Community operations dashboard
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(84, 132, 255, 0.24)",
                        background: "rgba(84, 132, 255, 0.08)",
                        color: "var(--accent-secondary)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      Live
                    </div>
                  </div>

                  <div style={{ padding: "24px", display: "grid", gap: "18px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "210px minmax(0, 1fr)",
                        gap: "18px",
                      }}
                    >
                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "18px",
                          background: "rgba(255,255,255,0.02)",
                          padding: "16px",
                          display: "grid",
                          gap: "10px",
                          alignContent: "start",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-tertiary)",
                            fontSize: "0.72rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                            marginBottom: "4px",
                          }}
                        >
                          Admin Portal
                        </div>
                        {navigationItems.map((item, index) => (
                          <div
                            key={item}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "12px",
                              color: index === 1 ? "var(--text-primary)" : "var(--text-secondary)",
                              background: index === 1 ? "rgba(84, 132, 255, 0.12)" : "transparent",
                              border: index === 1 ? "1px solid rgba(84, 132, 255, 0.18)" : "1px solid transparent",
                              fontSize: "0.9rem",
                              fontWeight: index === 1 ? 600 : 500,
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gap: "14px" }}>
                        <div
                          style={{
                            padding: "18px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "14px", alignItems: "center" }}>
                            <div>
                              <div
                                style={{
                                  color: "var(--text-primary)",
                                  fontSize: "1rem",
                                  fontWeight: 700,
                                  marginBottom: "4px",
                                }}
                              >
                                Today&apos;s operations queue
                              </div>
                              <div
                                style={{
                                  color: "var(--text-secondary)",
                                  fontSize: "0.82rem",
                                  lineHeight: 1.5,
                                }}
                              >
                                Visit requests, expected arrivals, gate dependencies, and pending approvals in one view.
                              </div>
                            </div>
                            <div
                              style={{
                                padding: "8px 10px",
                                borderRadius: "999px",
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--text-secondary)",
                                fontSize: "0.76rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Updated 2m ago
                            </div>
                          </div>

                          <div style={{ display: "grid", gap: "10px" }}>
                            {queue.map(([name, type, status]) => (
                              <div
                                key={name}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) auto",
                                  gap: "12px",
                                  alignItems: "center",
                                  padding: "12px 14px",
                                  borderRadius: "14px",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  background: "rgba(255,255,255,0.018)",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      color: "var(--text-primary)",
                                      fontSize: "0.9rem",
                                      fontWeight: 600,
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {name}
                                  </div>
                                  <div style={{ color: "var(--text-tertiary)", fontSize: "0.78rem" }}>
                                    Access request
                                  </div>
                                </div>
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                  {type}
                                </div>
                                <div
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "999px",
                                    background:
                                      status === "Approved"
                                        ? "rgba(84, 132, 255, 0.12)"
                                        : status === "Pending"
                                          ? "rgba(255, 184, 77, 0.12)"
                                          : "rgba(255,255,255,0.05)",
                                    color:
                                      status === "Approved"
                                        ? "var(--accent-secondary)"
                                        : status === "Pending"
                                          ? "#ffd089"
                                          : "var(--text-secondary)",
                                    fontSize: "0.76rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "14px",
                          }}
                        >
                          <div
                            style={{
                              padding: "16px",
                              borderRadius: "18px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "linear-gradient(180deg, rgba(84, 132, 255, 0.1), rgba(255,255,255,0.02))",
                            }}
                          >
                            <div style={{ color: "var(--text-tertiary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>
                              Resident experience
                            </div>
                            <div style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                              Fewer handoffs
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                              Residents can manage guests, visit requests, dues, and updates without switching tools.
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "16px",
                              borderRadius: "18px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(255,255,255,0.025)",
                            }}
                          >
                            <div style={{ color: "var(--text-tertiary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>
                              Admin operations
                            </div>
                            <div style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>
                              Cleaner control
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                              Teams get one place for residencies, visitors, gate events, forums, plugins, and reporting.
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            padding: "16px",
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.02)",
                            display: "grid",
                            gap: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                            <div>
                              <div style={{ color: "var(--text-primary)", fontSize: "0.94rem", fontWeight: 700, marginBottom: "4px" }}>
                                Gate dependency map
                              </div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.55 }}>
                                Model how visitors move through main gates, inner checkpoints, and dependent access points.
                              </div>
                            </div>
                            <div
                              style={{
                                padding: "7px 10px",
                                borderRadius: "999px",
                                background: "rgba(84, 132, 255, 0.08)",
                                border: "1px solid rgba(84, 132, 255, 0.16)",
                                color: "var(--accent-secondary)",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Tree view
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            {[
                              { label: "Main Gate", active: true },
                              { label: "Lobby Checkpoint" },
                              { label: "Service Entry" },
                            ].map((gate, index) => (
                              <Fragment key={gate.label}>
                                <div
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: "12px",
                                    background: gate.active ? "rgba(84, 132, 255, 0.12)" : "rgba(255,255,255,0.03)",
                                    border: gate.active ? "1px solid rgba(84, 132, 255, 0.18)" : "1px solid rgba(255,255,255,0.08)",
                                    color: gate.active ? "var(--text-primary)" : "var(--text-secondary)",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {gate.label}
                                </div>
                                {index < 2 && (
                                  <div style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>→</div>
                                )}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </div>

              <div
                aria-hidden="true"
                style={{
                  width: "140px",
                  height: "24px",
                  marginTop: "-2px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(110,110,110,0.08))",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                  borderBottomLeftRadius: "18px",
                  borderBottomRightRadius: "18px",
                }}
              ></div>
              <div
                aria-hidden="true"
                style={{
                  width: "240px",
                  height: "18px",
                  borderRadius: "999px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(110,110,110,0.08))",
                  boxShadow: "0 26px 60px -26px rgba(0, 0, 0, 0.9)",
                }}
              ></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
