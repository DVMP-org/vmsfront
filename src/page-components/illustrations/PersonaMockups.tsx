"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════
   MANAGER MOCKUP — animated multi-segment dashboard
══════════════════════════════════════════════════════════ */

const GATE_ROWS = [
  { label: "Main Entrance", info: "Gate A · 12 today", color: "#4ade80" },
  { label: "North Block", info: "Gate B · 8 today", color: "#4ade80" },
  { label: "East Parking", info: "Gate C · 3 today", color: "#facc15" },
];

const BAR_HEIGHTS_A = [24, 38, 20, 46, 32, 54, 40];
const BAR_HEIGHTS_B = [32, 22, 40, 30, 50, 28, 44];

export function ManagerMockup({ color }: { color: string }) {
  const [tick, setTick] = useState(0);
  const [visitCount, setVisitCount] = useState(24);
  const [logEntries, setLogEntries] = useState([
    { name: "S. Chen", gate: "Main", action: "Entry", t: "10:41am" },
    { name: "J. Okafor", gate: "North", action: "Entry", t: "10:47am" },
  ]);

  useEffect(() => {
    const names = ["P. Nair", "A. Johnson", "M. Reid", "T. Williams"];
    const gates = ["Main", "East", "North"];
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTick(i);
      setVisitCount((v) => v + 1);
      setLogEntries((prev) => [
        {
          name: names[i % names.length],
          gate: gates[i % gates.length],
          action: i % 4 === 0 ? "Exit" : "Entry",
          t: "Now",
        },
        ...prev.slice(0, 3),
      ]);
    }, 2400);
    return () => clearInterval(iv);
  }, []);

  const barA = tick % 2 === 0 ? BAR_HEIGHTS_A : BAR_HEIGHTS_B;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "320px",
        background: "#080810",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        fontFamily: "inherit",
        fontSize: "10px",
        color: "var(--text-primary)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#0d0d16",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }}
          />
          <span style={{ fontSize: "10px", fontWeight: 600, color: color }}>Live Dashboard</span>
        </div>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>All Properties</span>
      </div>

      {/* Stat cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "10px 10px 0" }}
      >
        {[
          { label: "Today's Visits", value: visitCount, highlight: true },
          { label: "Active Gates", value: 3, highlight: false },
          { label: "Pending", value: 2, highlight: false },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: "6px",
              border: `1px solid ${s.highlight ? `${color}28` : "rgba(255,255,255,0.06)"}`,
              background: s.highlight ? `${color}0d` : "rgba(255,255,255,0.02)",
              padding: "7px 8px",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={s.value}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: s.highlight ? color : "rgba(255,255,255,0.8)",
                  lineHeight: 1,
                  marginBottom: "3px",
                }}
              >
                {s.value}
              </motion.div>
            </AnimatePresence>
            <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + gate list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "8px 10px" }}>
        {/* Bar chart */}
        <div
          style={{
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
            padding: "8px",
          }}
        >
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>
            Peak hours
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "3px",
              height: "54px",
            }}
          >
            {barA.map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: `${h}px` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flex: 1,
                  borderRadius: "2px 2px 0 0",
                  background: `${color}${Math.round(40 + (i / barA.length) * 160).toString(16)}`,
                  minWidth: "6px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Gate status */}
        <div
          style={{
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", marginBottom: "1px" }}>
            Gate status
          </div>
          {GATE_ROWS.map((g) => (
            <div key={g.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: g.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "8.5px",
                    color: "rgba(255,255,255,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {g.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit log */}
      <div
        style={{
          margin: "0 10px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.015)",
          padding: "7px 8px",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", marginBottom: "5px" }}>
          Recent events
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {logEntries.slice(0, 3).map((e, i) => (
            <motion.div
              key={`${e.name}-${e.t}-${i}`}
              initial={i === 0 ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 5px",
                borderRadius: "4px",
                background: i === 0 ? `${color}0d` : "transparent",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "6px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}
              >
                {e.name.slice(0, 2)}
              </div>
              <span
                style={{
                  fontSize: "8.5px",
                  color: "rgba(255,255,255,0.7)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.name}
              </span>
              <span
                style={{
                  fontSize: "7.5px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  background:
                    e.action === "Entry" ? `${color}1a` : "rgba(255,255,255,0.04)",
                  color: e.action === "Entry" ? color : "rgba(255,255,255,0.4)",
                  fontWeight: 500,
                }}
              >
                {e.action}
              </span>
              <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                {e.t}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RESIDENT MOCKUP — phone with QR invite + gate tap
══════════════════════════════════════════════════════════ */

type GatePhase = "idle" | "opening" | "open" | "notif";

export function ResidentMockup({ color }: { color: string }) {
  const [gatePhase, setGatePhase] = useState<GatePhase>("idle");
  const [scanLine, setScanLine] = useState(0);

  // Scan line animation
  useEffect(() => {
    const iv = setInterval(
      () => setScanLine((s) => (s >= 100 ? 0 : s + 4)),
      60,
    );
    return () => clearInterval(iv);
  }, []);

  // Gate cycle
  useEffect(() => {
    const cycle = () => {
      setGatePhase("idle");
      setTimeout(() => setGatePhase("opening"), 2200);
      setTimeout(() => setGatePhase("open"), 3500);
      setTimeout(() => setGatePhase("notif"), 4000);
      setTimeout(cycle, 6200);
    };
    cycle();
  }, []);

  const gateLabel =
    gatePhase === "opening"
      ? "Opening\u2026"
      : gatePhase === "open" || gatePhase === "notif"
      ? "\u2713 Gate Open"
      : "Tap to Open Gate";

  const gateColor =
    gatePhase === "open" || gatePhase === "notif" ? "#4ade80" : color;

  return (
    <div
      style={{
        width: "148px",
        background: "#080810",
        borderRadius: "28px",
        border: "1.5px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        padding: "12px 10px 8px",
        fontSize: "9px",
        color: "var(--text-primary)",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {/* Notch */}
      <div
        style={{
          width: "44px",
          height: "9px",
          background: "#0d0d14",
          borderRadius: "0 0 8px 8px",
          margin: "0 auto 8px",
          border: "1px solid rgba(255,255,255,0.06)",
          borderTop: "none",
        }}
      />

      {/* App header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "11px", color: "rgba(255,255,255,0.9)" }}>
          My Home
        </span>
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
          }}
        />
      </div>

      {/* Guest pass card */}
      <div
        style={{
          borderRadius: "10px",
          border: `1px solid ${color}30`,
          background: `${color}08`,
          padding: "8px",
          marginBottom: "7px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <div>
            <div style={{ fontSize: "9.5px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              Priya Nair
            </div>
            <div style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>
              Today · 2pm – 6pm
            </div>
          </div>
          <div
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              background: `${color}1a`,
              border: `1px solid ${color}30`,
              fontSize: "7px",
              fontWeight: 600,
              color: color,
            }}
          >
            Active
          </div>
        </div>

        {/* QR code with scan line */}
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            background: "#0d0d18",
            borderRadius: "7px",
            border: "1px solid rgba(255,255,255,0.07)",
            position: "relative",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "2px",
            padding: "6px",
          }}
        >
          {Array.from({ length: 36 }).map((_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            // corners
            const corner =
              (row < 2 && col < 2) ||
              (row < 2 && col >= 4) ||
              (row >= 4 && col < 2);
            return (
              <div
                key={i}
                style={{
                  borderRadius: "1px",
                  background: corner
                    ? color
                    : (row + col) % 3 === 0
                    ? `${color}80`
                    : (row * col) % 5 === 0
                    ? `${color}40`
                    : "rgba(255,255,255,0.05)",
                }}
              />
            );
          })}
          {/* scan line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scanLine}%`,
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
              pointerEvents: "none",
              transition: "top 0.06s linear",
            }}
          />
        </div>
      </div>

      {/* Gate button */}
      <motion.div
        animate={
          gatePhase === "open" || gatePhase === "notif"
            ? { background: "rgba(74,222,128,0.15)", borderColor: "rgba(74,222,128,0.4)" }
            : gatePhase === "opening"
            ? { background: `${color}10`, borderColor: `${color}35` }
            : { background: `${color}0d`, borderColor: `${color}28` }
        }
        transition={{ duration: 0.4 }}
        style={{
          borderRadius: "8px",
          border: "1px solid",
          padding: "7px 8px",
          textAlign: "center",
          marginBottom: "7px",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={gatePhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: gateColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {gatePhase === "opening" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderTopColor: color,
                }}
              />
            )}
            {gateLabel}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {gatePhase === "notif" && (
          <motion.div
            key="notif"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(74,222,128,0.25)",
              background: "rgba(74,222,128,0.07)",
              padding: "6px 8px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#4ade80",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>
              Priya arrived · Just now
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "7px",
          paddingTop: "6px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {[true, false, false].map((active, i) => (
          <div
            key={i}
            style={{
              width: "24px",
              height: "3px",
              borderRadius: "2px",
              background: active ? color : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>

      {/* Home bar */}
      <div
        style={{
          width: "40px",
          height: "3px",
          borderRadius: "2px",
          background: "rgba(255,255,255,0.15)",
          margin: "5px auto 0",
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SECURITY MOCKUP — tablet gate console
══════════════════════════════════════════════════════════ */

type ScanPhase = "waiting" | "scanning" | "matched" | "granted" | "denied";

const VISITORS = [
  { initials: "JO", name: "James Okafor", ref: "VMS-4821", gates: ["Main", "North"], result: "granted" as const },
  { initials: "SC", name: "Sarah Chen", ref: "VMS-1193", gates: ["Main"], result: "granted" as const },
  { initials: "XX", name: "Unknown Vehicle", ref: "LP-7G4R", gates: [], result: "denied" as const },
];

const SECURITY_GATES = ["Main Entrance", "North Block", "East Parking"];

export function SecurityMockup({ color }: { color: string }) {
  const [scanPhase, setScanPhase] = useState<ScanPhase>("waiting");
  const [visitorIdx, setVisitorIdx] = useState(0);
  const [gatesLit, setGatesLit] = useState<boolean[]>([false, false, false]);
  const [log, setLog] = useState([
    { name: "A. Johnson", action: "Entry", gate: "Main", t: "10:41" },
    { name: "M. Reid", action: "Exit", gate: "North", t: "10:38" },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const runCycle = (vIdx: number) => {
      const visitor = VISITORS[vIdx];
      setScanPhase("waiting");
      setGatesLit([false, false, false]);

      timers.push(setTimeout(() => setScanPhase("scanning"), 600));
      timers.push(setTimeout(() => setScanPhase("matched"), 1400));

      // light up gates sequentially
      visitor.gates.forEach((_, gi) => {
        timers.push(
          setTimeout(() => {
            setGatesLit((prev) => {
              const next = [...prev];
              next[gi] = true;
              return next;
            });
          }, 1900 + gi * 500),
        );
      });

      timers.push(
        setTimeout(
          () => {
            setScanPhase(visitor.result);
            setLog((prev) => [
              {
                name: visitor.name.split(" ")[0][0] + ". " + visitor.name.split(" ")[1],
                action: visitor.result === "granted" ? "Entry" : "Denied",
                gate: visitor.gates[0] ?? "—",
                t: "Now",
              },
              ...prev.slice(0, 3),
            ]);
          },
          visitor.gates.length > 1 ? 2900 : 2000,
        ),
      );

      // next visitor
      timers.push(
        setTimeout(() => {
          const next = (vIdx + 1) % VISITORS.length;
          setVisitorIdx(next);
          runCycle(next);
        }, 4800),
      );
    };
    runCycle(visitorIdx);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visitor = VISITORS[visitorIdx];

  const statusLabel =
    scanPhase === "waiting"
      ? "Awaiting scan\u2026"
      : scanPhase === "scanning"
      ? "Scanning\u2026"
      : scanPhase === "matched"
      ? "Visitor matched"
      : scanPhase === "granted"
      ? "\u2713 Access Granted"
      : "\u2715 Access Denied";

  const statusColor =
    scanPhase === "granted"
      ? "#4ade80"
      : scanPhase === "denied"
      ? "#f87171"
      : scanPhase === "matched" || scanPhase === "scanning"
      ? color
      : "rgba(255,255,255,0.35)";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "300px",
        background: "#080810",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        fontSize: "9px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#0c0c14",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <motion.div
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }}
          />
          <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
            Gate Console
          </span>
          <span
            style={{
              fontSize: "7.5px",
              padding: "1px 5px",
              borderRadius: "4px",
              background: "rgba(74,222,128,0.1)",
              color: "#4ade80",
              fontWeight: 500,
            }}
          >
            LIVE
          </span>
        </div>
        <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.25)" }}>Gate A · B</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "8px" }}>
        {/* Visitor card */}
        <div
          style={{
            borderRadius: "7px",
            border: `1px solid ${
              scanPhase === "granted"
                ? "rgba(74,222,128,0.3)"
                : scanPhase === "denied"
                ? "rgba(248,113,113,0.3)"
                : "rgba(255,255,255,0.07)"
            }`,
            background:
              scanPhase === "granted"
                ? "rgba(74,222,128,0.05)"
                : scanPhase === "denied"
                ? "rgba(248,113,113,0.05)"
                : "rgba(255,255,255,0.02)",
            padding: "8px",
            transition: "border-color 0.4s, background 0.4s",
          }}
        >
          {/* Avatar */}
          <motion.div
            animate={
              scanPhase === "scanning"
                ? { borderColor: `${color}80`, background: `${color}15` }
                : scanPhase === "granted"
                ? { borderColor: "rgba(74,222,128,0.5)", background: "rgba(74,222,128,0.1)" }
                : scanPhase === "denied"
                ? { borderColor: "rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.1)" }
                : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }
            }
            transition={{ duration: 0.35 }}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1px solid",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 700,
              color:
                scanPhase === "granted"
                  ? "#4ade80"
                  : scanPhase === "denied"
                  ? "#f87171"
                  : statusColor,
              marginBottom: "6px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {scanPhase === "scanning" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTopColor: color,
                }}
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${visitorIdx}-${scanPhase}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {scanPhase === "waiting" ? "?" : visitor.initials}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${visitorIdx}-${scanPhase}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {scanPhase !== "waiting" && scanPhase !== "scanning" ? (
                <>
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {visitor.name.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.3)" }}>
                    {visitor.ref}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.3)" }}>
                  {scanPhase === "waiting" ? "No visitor" : "Matching\u2026"}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Status */}
          <div
            style={{
              marginTop: "5px",
              fontSize: "8px",
              fontWeight: 600,
              color: statusColor,
              transition: "color 0.3s",
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Gates + log */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {/* Gate chips */}
          <div
            style={{
              borderRadius: "7px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
              padding: "7px",
            }}
          >
            <div style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.3)", marginBottom: "5px" }}>
              Gate access
            </div>
            {SECURITY_GATES.map((g, i) => {
              const lit = gatesLit[i];
              return (
                <motion.div
                  key={g}
                  animate={
                    lit
                      ? { background: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.3)" }
                      : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }
                  }
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 5px",
                    borderRadius: "5px",
                    border: "1px solid",
                    marginBottom: i < SECURITY_GATES.length - 1 ? "3px" : 0,
                  }}
                >
                  <motion.div
                    animate={
                      lit
                        ? { background: "#4ade80", borderColor: "transparent" }
                        : { background: "transparent", borderColor: "rgba(255,255,255,0.18)" }
                    }
                    transition={{ duration: 0.25 }}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      border: "1px solid",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {lit && (
                      <svg width="5" height="5" viewBox="0 0 5 5">
                        <path
                          d="M1 2.5l1 1 2-2"
                          stroke="#000"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </motion.div>
                  <span
                    style={{
                      fontSize: "7.5px",
                      color: lit ? "#4ade80" : "rgba(255,255,255,0.35)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: lit ? 600 : 400,
                    }}
                  >
                    {g}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Mini log */}
          <div
            ref={logRef}
            style={{
              borderRadius: "7px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
              padding: "7px",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}
            >
              Log
            </div>
            {log.slice(0, 3).map((e, i) => (
              <motion.div
                key={`${e.name}-${e.t}-${i}`}
                initial={i === 0 ? { opacity: 0, x: 6 } : { opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontSize: "7.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  marginBottom: i < 2 ? "4px" : 0,
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background:
                      e.action === "Entry"
                        ? color
                        : e.action === "Denied"
                        ? "#f87171"
                        : "rgba(255,255,255,0.25)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {e.name}
                </span>
                <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{e.t}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
