export function Footer() {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "VMS Core";
    return (
        <footer style={{ padding: "88px 0 34px 0" }}>
            <div className="container">
                <div className="card" style={{ padding: "34px", marginBottom: "24px" }}>
                    <div className="footer-columns" style={{ display: "flex", flexWrap: "wrap", gap: "64px" }}>
                        <div style={{ flex: "1 1 320px" }}>
                            <div
                                className="font-display"
                                style={{ fontSize: "1.45rem", fontWeight: 800, marginBottom: "14px" }}
                            >
                                {appName}
                            </div>
                            <p
                                style={{
                                    color: "var(--text-secondary)",
                                    fontSize: "0.95rem",
                                    maxWidth: "380px",
                                    lineHeight: 1.75,
                                    margin: 0,
                                }}
                            >
                                A more polished system for visitor access, resident operations,
                                and site visibility across modern communities and enterprise
                                properties.
                            </p>
                        </div>

                        <div style={{ flex: "1 1 170px" }}>
                            <h4 style={{ fontSize: "0.98rem", marginBottom: "20px", color: "var(--text-primary)" }}>
                                Explore
                            </h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                                <li><a href="/features" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Features</a></li>
                                <li><a href="/solutions" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Solutions</a></li>
                                <li><a href="/pricing" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Pricing</a></li>
                                <li><a href="/#platform" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Core features</a></li>
                                <li><a href="/#contact" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Book a demo</a></li>
                            </ul>
                        </div>

                        <div style={{ flex: "1 1 200px" }}>
                            <h4 style={{ fontSize: "0.98rem", marginBottom: "20px", color: "var(--text-primary)" }}>
                                Focus areas
                            </h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                                <li><a href="/#security" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Executive visibility</a></li>
                                <li><a href="/#platform" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Operational consistency</a></li>
                                <li><a href="/#deployment" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Enterprise deployment</a></li>
                                <li><a href="/#platform" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.92rem" }}>Extensible workflows</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                        padding: "0 6px",
                    }}
                >
                    <p style={{ color: "var(--text-tertiary)", fontSize: "0.85rem", margin: 0 }}>
                        &copy; {new Date().getFullYear()} {appName}. All rights reserved.
                    </p>
                    <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
                        <a href="#" style={{ color: "var(--text-tertiary)", textDecoration: "none", fontSize: "0.85rem" }}>Privacy Policy</a>
                        <a href="#" style={{ color: "var(--text-tertiary)", textDecoration: "none", fontSize: "0.85rem" }}>Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
