import Head from "next/head";
import { Footer } from "@/page-components/Footer";
import { Nav } from "@/page-components/Nav";

export default function PricingPage() {
    const plans = [
        {
            name: "Starter",
            price: "$49",
            period: "/month",
            description: "For smaller communities or sites that need a cleaner visitor process without a heavy rollout.",
            badge: "Best for one location",
            features: [
                "Visitor invitations and approvals",
                "Front-desk and gate workflow",
                "Resident coordination",
                "Basic activity records",
                "Email support",
            ],
            cta: "Start with Starter",
        },
        {
            name: "Growth",
            price: "$149",
            period: "/month",
            description: "For growing properties and operations teams that need better visibility, consistency, and team coordination.",
            badge: "Most practical",
            features: [
                "Everything in Starter",
                "Multi-user admin workflows",
                "Expanded reporting visibility",
                "Multi-site operational controls",
                "Priority support",
            ],
            cta: "Choose Growth",
            featured: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "pricing",
            description: "For larger portfolios, higher-control environments, and organizations that need tailored deployment and onboarding.",
            badge: "For complex operations",
            features: [
                "Everything in Growth",
                "Enterprise rollout support",
                "Advanced deployment options",
                "Custom onboarding and training",
                "Commercial support and planning",
            ],
            cta: "Talk to Sales",
        },
    ];

    const faqs = [
        ["Can we start small and upgrade later?", "Yes. The pricing structure is designed to let teams begin with a smaller rollout and expand as more sites, staff, or workflow needs are introduced."],
        ["Do you support self-hosted deployments?", "Yes. For teams that need more infrastructure control, deployment options can be scoped as part of the commercial discussion."],
        ["Is onboarding included?", "Guided setup is included in the rollout process, with deeper support and planning available on larger plans."],
    ];

    return (
        <>
            <Head>
                <title>Pricing | VMS Core</title>
                <meta
                    name="description"
                    content="Compare VMS Core pricing plans for visitor management, approvals, gate operations, resident coordination, and enterprise rollout support."
                />
            </Head>
            <Nav />
            <main>
                <section className="section pricing-hero-section" style={{ paddingTop: "152px", paddingBottom: "72px", overflow: "hidden" }}>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ top: "-18%", left: "8%", width: "420px", height: "420px", opacity: 0.55 }}
                    ></div>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ top: "-8%", right: "4%", left: "auto", width: "360px", height: "360px", opacity: 0.42 }}
                    ></div>
                    <div className="container" style={{ textAlign: "center" }}>
                        <div
                            aria-hidden="true"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "120px",
                                marginBottom: "18px",
                                opacity: 0.65,
                            }}
                        >
                            <span style={{ color: "rgba(124,169,255,0.7)", fontSize: "1.4rem" }}>✦</span>
                            <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.9rem", marginTop: "10px" }}>✦</span>
                            <span style={{ color: "rgba(124,169,255,0.6)", fontSize: "1.1rem" }}>✦</span>
                        </div>
                        <span className="section-label">Pricing</span>
                        <h1 className="section-headline pricing-hero-headline" style={{ margin: "0 auto 16px auto", maxWidth: "760px" }}>
                            Simple pricing. No enterprise games.
                        </h1>
                        <p className="section-desc pricing-hero-desc" style={{ margin: "0 auto 28px auto", maxWidth: "700px" }}>
                            Monthly plans that scale with your community. Start small, expand
                            when you need to. No long lock-in contracts — we earn your
                            business every month.
                        </p>
                        <div className="pricing-hero-pills" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                            {[
                                "Visitor approvals",
                                "Gate operations",
                                "Resident coordination",
                                "Leadership visibility",
                            ].map((item) => (
                                <span
                                    key={item}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: "999px",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        background: "rgba(255,255,255,0.02)",
                                        color: "var(--text-secondary)",
                                        fontSize: "0.82rem",
                                    }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section" style={{ paddingTop: "28px", overflow: "hidden" }}>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: "14% auto auto 50%",
                            transform: "translateX(-50%)",
                            width: "72%",
                            height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                            zIndex: 0,
                        }}
                    ></div>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ bottom: "-18%", right: "6%", left: "auto", width: "420px", height: "420px", opacity: 0.28 }}
                    ></div>
                    <div className="container">
                        <div
                            className="pricing-plans-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                gap: "20px",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            {plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className="card"
                                    style={{
                                        padding: "26px",
                                        minHeight: "100%",
                                        background: plan.featured
                                            ? "linear-gradient(180deg, rgba(84,132,255,0.11), rgba(255,255,255,0.02))"
                                            : undefined,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            padding: "7px 10px",
                                            borderRadius: "999px",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            background: "rgba(255,255,255,0.03)",
                                            color: "var(--text-secondary)",
                                            fontSize: "0.76rem",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        {plan.badge}
                                    </div>

                                    <h2 className="font-display pricing-plan-name" style={{ fontSize: "1.24rem", marginBottom: "8px", color: "var(--text-primary)" }}>
                                        {plan.name}
                                    </h2>
                                    <p className="pricing-plan-desc" style={{ color: "var(--text-secondary)", fontSize: "0.94rem", lineHeight: 1.7, minHeight: "72px" }}>
                                        {plan.description}
                                    </p>

                                    <div style={{ margin: "20px 0 22px 0", display: "flex", alignItems: "flex-end", gap: "6px" }}>
                                        <span className="pricing-plan-price" style={{ color: "var(--text-primary)", fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>
                                            {plan.price}
                                        </span>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>{plan.period}</span>
                                    </div>

                                    <div style={{ display: "grid", gap: "10px", marginBottom: "22px" }}>
                                        {plan.features.map((feature) => (
                                            <div key={feature} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                                <span
                                                    style={{
                                                        width: "8px",
                                                        height: "8px",
                                                        borderRadius: "50%",
                                                        background: "var(--accent-primary)",
                                                        boxShadow: "0 0 0 6px rgba(84,132,255,0.08)",
                                                        marginTop: "7px",
                                                        flexShrink: 0,
                                                    }}
                                                ></span>
                                                <span className="pricing-plan-feature" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className={plan.featured ? "btn-primary" : "btn-secondary"}
                                        style={{ textDecoration: "none", display: "flex", width: "100%", justifyContent: "center" }}
                                    >
                                        {plan.cta}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section" style={{ overflow: "hidden" }}>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ top: "12%", left: "-6%", width: "320px", height: "320px", opacity: 0.22 }}
                    ></div>
                    <div className="container">
                        <div className="card pricing-included-card" style={{ padding: "30px" }}>
                            <div className="pricing-included-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)", gap: "28px" }}>
                                <div>
                                    <span className="section-label">What is included</span>
                                    <h2 className="section-headline pricing-included-headline" style={{ marginBottom: "14px", maxWidth: "560px" }}>
                                        Pricing should be easier to understand than the problem you are fixing.
                                    </h2>
                                    <p className="section-desc pricing-included-desc" style={{ marginBottom: 0, maxWidth: "560px" }}>
                                        Every plan is built around the same goal: reduce arrival friction, improve
                                        approval clarity, and give teams a more reliable operating system for site access.
                                    </p>
                                </div>

                                <div style={{ display: "grid", gap: "14px" }}>
                                    {faqs.map(([title, answer]) => (
                                        <div
                                            key={title}
                                            style={{
                                                padding: "18px",
                                                borderRadius: "18px",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                background: "rgba(255,255,255,0.02)",
                                            }}
                                        >
                                            <div className="pricing-faq-title" style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "8px", fontSize: "0.98rem" }}>
                                                {title}
                                            </div>
                                            <div className="pricing-faq-answer" style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                                                {answer}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}