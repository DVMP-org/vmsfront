"use client";
import { useEffect, useState } from "react";

/* ─── Tree data ──────────────────────────────────────────────────────────── */

type NodeId = "main" | "north" | "east" | "staff" | "resident" | "visitor" | "service";

type TreeNode = {
    id: NodeId;
    label: string;
    sublabel: string;
    depth: number;
    x: number;       // 0-100 % of canvas width
    y: number;       // 0-100 % of canvas height
    color: string;
    parentId?: NodeId;
};

const NODES: TreeNode[] = [
    { id: "main", label: "Main Entrance", sublabel: "Root gate", depth: 0, x: 50, y: 8, color: "#7ca9ff" },
    { id: "north", label: "North Gate", sublabel: "Checkpoint", depth: 1, x: 24, y: 38, color: "#9b7cff", parentId: "main" },
    { id: "east", label: "East Gate", sublabel: "Checkpoint", depth: 1, x: 76, y: 38, color: "#9b7cff", parentId: "main" },
    { id: "staff", label: "Staff Exit", sublabel: "Restricted", depth: 2, x: 12, y: 70, color: "#48d8c8", parentId: "north" },
    { id: "resident", label: "Resident Lot", sublabel: "Residents only", depth: 2, x: 38, y: 70, color: "#48d8c8", parentId: "north" },
    { id: "visitor", label: "Visitor Bay", sublabel: "Open hours", depth: 2, x: 62, y: 70, color: "#48d8c8", parentId: "east" },
    { id: "service", label: "Service Ent.", sublabel: "Scheduled", depth: 2, x: 88, y: 70, color: "#48d8c8", parentId: "east" },
];

const EDGES: [NodeId, NodeId][] = [
    ["main", "north"],
    ["main", "east"],
    ["north", "staff"],
    ["north", "resident"],
    ["east", "visitor"],
    ["east", "service"],
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function nodeById(id: NodeId) {
    return NODES.find((n) => n.id === id)!;
}

function pct(v: number, total: number) {
    return (v / 100) * total;
}

const ACTIVE_SEQUENCE: NodeId[] = ["main", "north", "resident", "east", "visitor"];

/* ─── Component ──────────────────────────────────────────────────────────── */
export function GateDependencyIllustration() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [traceSet, setTraceSet] = useState<Set<NodeId>>(new Set<NodeId>(["main"]));

    // Animate through the active sequence
    useEffect(() => {
        const id = setInterval(() => {
            setActiveIdx((i) => {
                const next = (i + 1) % ACTIVE_SEQUENCE.length;
                // Build the trace path up to this node
                const targetId = ACTIVE_SEQUENCE[next];
                const path = new Set<NodeId>(["main"]);
                function buildPath(nodeId: NodeId) {
                    const node = nodeById(nodeId);
                    if (node.parentId) {
                        buildPath(node.parentId);
                    }
                    path.add(nodeId);
                }
                buildPath(targetId);
                setTraceSet(path);
                return next;
            });
        }, 1600);
        return () => clearInterval(id);
    }, []);

    const activeNodeId = ACTIVE_SEQUENCE[activeIdx];
    const W = 320;
    const H = 200;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: "#080810",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "var(--font-sans, sans-serif)",
                position: "relative",
            }}
        >
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                flexShrink: 0,
            }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" stroke="#7ca9ff" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M8 1v14M1 5l7 4 7-4" stroke="#7ca9ff" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                    Gate Dependency Tree
                </span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3dd68c", boxShadow: "0 0 4px #3dd68c" }} />
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>LIVE TRACE</span>
                </div>
            </div>

            {/* SVG tree canvas */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ width: "100%", height: "100%", display: "block" }}
                >
                    <defs>
                        <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#7ca9ff" opacity="0.5" />
                        </marker>
                        <marker id="arrowActive" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="#7ca9ff" />
                        </marker>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Ambient gradient behind root */}
                    <ellipse
                        cx={pct(50, W)} cy={pct(8, H)}
                        rx="60" ry="18"
                        fill="#7ca9ff" opacity="0.05"
                    />

                    {/* Edges */}
                    {EDGES.map(([fromId, toId]) => {
                        const from = nodeById(fromId);
                        const to = nodeById(toId);
                        const traced = traceSet.has(fromId) && traceSet.has(toId);
                        const x1 = pct(from.x, W);
                        const y1 = pct(from.y, H) + 10;
                        const x2 = pct(to.x, W);
                        const y2 = pct(to.y, H) - 10;
                        // Bezier control points
                        const cy1 = y1 + (y2 - y1) * 0.45;
                        const cy2 = y2 - (y2 - y1) * 0.45;

                        return (
                            <g key={`${fromId}-${toId}`}>
                                {/* Ghost track */}
                                <path
                                    d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
                                    stroke="rgba(255,255,255,0.07)"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                                {/* Active trace */}
                                {traced && (
                                    <path
                                        d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
                                        stroke="#7ca9ff"
                                        strokeWidth="1.5"
                                        strokeOpacity="0.7"
                                        fill="none"
                                        markerEnd="url(#arrowActive)"
                                        style={{ filter: "url(#glow)" }}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {NODES.map((node) => {
                        const cx = pct(node.x, W);
                        const cy = pct(node.y, H);
                        const isActive = node.id === activeNodeId;
                        const isTraced = traceSet.has(node.id);
                        const isRoot = node.depth === 0;
                        const r = isRoot ? 13 : 10;

                        return (
                            <g key={node.id}>
                                {/* Pulse ring on active node */}
                                {isActive && (
                                    <circle
                                        cx={cx} cy={cy}
                                        r={r + 8}
                                        fill="none"
                                        stroke={node.color}
                                        strokeWidth="1"
                                        strokeOpacity="0.3"
                                        style={{
                                            transformOrigin: `${cx}px ${cy}px`,
                                            animation: "treeNodePulse 1.4s ease-out infinite",
                                        }}
                                    />
                                )}
                                {/* Outer ring */}
                                <circle
                                    cx={cx} cy={cy}
                                    r={r + 3}
                                    fill="none"
                                    stroke={isTraced ? node.color : "rgba(255,255,255,0.06)"}
                                    strokeWidth={isTraced ? 1 : 0.5}
                                    strokeOpacity={isTraced ? 0.35 : 1}
                                    style={{ transition: "stroke 0.4s, stroke-opacity 0.4s" }}
                                />
                                {/* Fill circle */}
                                <circle
                                    cx={cx} cy={cy}
                                    r={r}
                                    fill={isTraced ? `${node.color}22` : "rgba(20,20,32,0.9)"}
                                    stroke={isTraced ? node.color : "rgba(255,255,255,0.12)"}
                                    strokeWidth={isRoot ? 1.5 : 1}
                                    style={{
                                        filter: isActive ? "url(#glow)" : "none",
                                        transition: "fill 0.4s, stroke 0.4s",
                                    }}
                                />
                                {/* Icon inside root */}
                                {isRoot && (
                                    <path
                                        d="M50 4L44 8v6l6 3 6-3V8L50 4z"
                                        fill={isTraced ? node.color : "rgba(255,255,255,0.3)"}
                                        transform={`translate(${cx - 50}, ${cy - 10})`}
                                        style={{ transition: "fill 0.4s" }}
                                    />
                                )}
                                {/* Dot inside non-root */}
                                {!isRoot && (
                                    <circle
                                        cx={cx} cy={cy}
                                        r={3}
                                        fill={isTraced ? node.color : "rgba(255,255,255,0.2)"}
                                        style={{ transition: "fill 0.4s" }}
                                    />
                                )}
                                {/* Label below */}
                                <text
                                    x={cx} y={cy + r + 8}
                                    textAnchor="middle"
                                    fontSize="6.5"
                                    fontWeight={isActive ? "700" : "500"}
                                    fill={isTraced ? node.color : "rgba(255,255,255,0.35)"}
                                    style={{ transition: "fill 0.4s", fontFamily: "var(--font-sans, sans-serif)" }}
                                >
                                    {node.label}
                                </text>
                                <text
                                    x={cx} y={cy + r + 16}
                                    textAnchor="middle"
                                    fontSize="5.5"
                                    fill="rgba(255,255,255,0.22)"
                                    style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                                >
                                    {node.sublabel}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Footer — active path breadcrumb */}
            <div style={{
                padding: "8px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
                overflowX: "auto",
            }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M4 8h8M9 5l3 3-3 3" stroke="#7ca9ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>Active path:</span>
                {Array.from(traceSet).map((id, i, arr) => (
                    <span key={id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{
                            fontSize: "0.62rem", fontWeight: 600, color: "#7ca9ff",
                            padding: "1px 6px", borderRadius: "4px",
                            background: "#7ca9ff14",
                            border: "1px solid #7ca9ff25",
                            whiteSpace: "nowrap",
                        }}>
                            {nodeById(id).label}
                        </span>
                        {i < arr.length - 1 && (
                            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>›</span>
                        )}
                    </span>
                ))}
            </div>

            <style>{`
        @keyframes treeNodePulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
