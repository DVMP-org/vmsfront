import { motion } from "framer-motion";

/**
 * QRScanIllustration
 * Mobile-first: renders as a 100% wide SVG that scales with its container.
 * Shows a QR code with scan-frame corners and an animated sweep line.
 */
export function QRScanIllustration() {
    // QR data cells — simplified 7x7 finder + module pattern
    const cells: Array<{ x: number; y: number; w: number; h: number }> = [
        // Top-left finder
        { x: 2, y: 2, w: 7, h: 7 },
        // Top-right finder
        { x: 19, y: 2, w: 7, h: 7 },
        // Bottom-left finder
        { x: 2, y: 19, w: 7, h: 7 },
        // Data modules (scattered)
        { x: 11, y: 2, w: 2, h: 2 },
        { x: 14, y: 2, w: 2, h: 2 },
        { x: 11, y: 5, w: 3, h: 2 },
        { x: 15, y: 5, w: 1, h: 1 },
        { x: 17, y: 4, w: 2, h: 2 },
        { x: 11, y: 9, w: 2, h: 2 },
        { x: 14, y: 9, w: 3, h: 2 },
        { x: 18, y: 9, w: 2, h: 2 },
        { x: 11, y: 12, w: 2, h: 3 },
        { x: 14, y: 12, w: 2, h: 2 },
        { x: 17, y: 12, w: 2, h: 2 },
        { x: 20, y: 12, w: 2, h: 2 },
        { x: 11, y: 16, w: 3, h: 2 },
        { x: 15, y: 16, w: 2, h: 2 },
        { x: 18, y: 16, w: 3, h: 2 },
        { x: 2, y: 10, w: 2, h: 2 },
        { x: 5, y: 10, w: 3, h: 2 },
        { x: 2, y: 13, w: 3, h: 2 },
        { x: 6, y: 13, w: 2, h: 2 },
        { x: 2, y: 16, w: 2, h: 3 },
        { x: 5, y: 16, w: 3, h: 2 },
        { x: 8, y: 19, w: 2, h: 2 },
    ];

    // Inner white squares for finder pattern (hollow effect)
    const finderInner = [
        { x: 3, y: 3, w: 5, h: 5 },
        { x: 20, y: 3, w: 5, h: 5 },
        { x: 3, y: 20, w: 5, h: 5 },
    ];

    // Center dots of finder patterns
    const finderDot = [
        { x: 4, y: 4, w: 3, h: 3 },
        { x: 21, y: 4, w: 3, h: 3 },
        { x: 4, y: 21, w: 3, h: 3 },
    ];

    const UNIT = 28; // each cell is 28x28 pixels in the viewBox
    const PAD = 20;
    const GRID = 28;
    const VB_W = GRID * UNIT + PAD * 2; // 28 * 28 + 40 = 824
    const VB_H = VB_W;

    return (
        <div
            style={{
                width: "100%",
                borderRadius: "18px",
                background: "#080810",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                overflow: "hidden",
            }}
        >
            {/* Top label */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "rgba(124,169,255,0.8)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                }}
            >
                <span
                    style={{
                        display: "inline-block",
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "rgba(84,255,148,0.9)",
                        boxShadow: "0 0 6px rgba(84,255,148,0.6)",
                    }}
                />
                Scan to verify
            </div>

            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                width="100%"
                style={{ maxWidth: "220px", display: "block" }}
                aria-label="QR code scanning illustration"
                role="img"
            >
                <defs>
                    <linearGradient id="scanLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(84,132,255,0)" />
                        <stop offset="40%" stopColor="rgba(84,132,255,0.7)" />
                        <stop offset="60%" stopColor="rgba(124,169,255,0.9)" />
                        <stop offset="100%" stopColor="rgba(84,132,255,0)" />
                    </linearGradient>
                    <linearGradient id="scanGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(84,132,255,0.15)" />
                        <stop offset="100%" stopColor="rgba(84,132,255,0)" />
                    </linearGradient>
                    <clipPath id="qrClip">
                        <rect x={PAD} y={PAD} width={GRID * UNIT} height={GRID * UNIT} />
                    </clipPath>
                </defs>

                {/* Background tile */}
                <rect
                    x={PAD}
                    y={PAD}
                    width={GRID * UNIT}
                    height={GRID * UNIT}
                    rx="12"
                    fill="rgba(255,255,255,0.04)"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                />

                {/* QR cells */}
                {cells.map((c, i) => (
                    <rect
                        key={i}
                        x={PAD + c.x * UNIT}
                        y={PAD + c.y * UNIT}
                        width={c.w * UNIT - 3}
                        height={c.h * UNIT - 3}
                        rx="4"
                        fill="#ffffff"
                    />
                ))}

                {/* Finder inner (white to create hollow) */}
                {finderInner.map((c, i) => (
                    <rect
                        key={`fi-${i}`}
                        x={PAD + c.x * UNIT}
                        y={PAD + c.y * UNIT}
                        width={c.w * UNIT - 3}
                        height={c.h * UNIT - 3}
                        rx="3"
                        fill="rgba(18,18,24,1)"
                    />
                ))}

                {/* Finder center dots */}
                {finderDot.map((c, i) => (
                    <rect
                        key={`fd-${i}`}
                        x={PAD + c.x * UNIT}
                        y={PAD + c.y * UNIT}
                        width={c.w * UNIT - 3}
                        height={c.h * UNIT - 3}
                        rx="3"
                        fill="#ffffff"
                    />
                ))}

                {/* Scan line sweep */}
                <motion.g clipPath="url(#qrClip)">
                    <motion.rect
                        x={PAD}
                        width={GRID * UNIT}
                        height={8}
                        fill="url(#scanLine)"
                        initial={{ y: PAD + 10 }}
                        animate={{ y: PAD + GRID * UNIT - 20 }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                    {/* Glow trail below scan line */}
                    <motion.rect
                        x={PAD}
                        width={GRID * UNIT}
                        height={60}
                        fill="url(#scanGlow)"
                        initial={{ y: PAD + 10 }}
                        animate={{ y: PAD + GRID * UNIT - 20 }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                </motion.g>

                {/* Corner scan brackets */}
                {[
                    { cx: PAD - 2, cy: PAD - 2, rx: 1, ry: 1 },
                    { cx: PAD + GRID * UNIT + 2, cy: PAD - 2, rx: -1, ry: 1 },
                    { cx: PAD - 2, cy: PAD + GRID * UNIT + 2, rx: 1, ry: -1 },
                    { cx: PAD + GRID * UNIT + 2, cy: PAD + GRID * UNIT + 2, rx: -1, ry: -1 },
                ].map((c, i) => {
                    const arm = 36;
                    const t = 3;
                    return (
                        <g key={`corner-${i}`}>
                            <rect
                                x={c.cx - (t / 2) * Math.sign(c.rx)}
                                y={c.cy + (t / 2) * Math.sign(c.ry) * -1}
                                width={arm * Math.abs(c.rx)}
                                height={t}
                                rx="2"
                                fill="rgba(124,169,255,0.9)"
                            />
                            <rect
                                x={c.cx - (t / 2) * Math.sign(c.rx)}
                                y={c.cy - (t / 2) * Math.sign(c.ry) * -1}
                                width={t}
                                height={arm * Math.abs(c.ry)}
                                rx="2"
                                fill="rgba(124,169,255,0.9)"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Bottom status row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-tertiary)",
                    fontSize: "0.7rem",
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(84,255,148,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
                Access granted · Ref #VE-00841
            </div>
        </div>
    );
}
