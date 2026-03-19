import Head from "next/head";
import { useEffect } from "react";
import { Nav } from "@/page-components/Nav";
import { Hero } from "@/page-components/Hero";
import { SolutionStatement } from "@/page-components/SolutionStatement";
import { Capabilities } from "@/page-components/Capabilities";
import { PersonaTabs } from "@/page-components/PersonaTabs";
import { TrustStrip } from "@/page-components/TrustStrip";
import { ArchitectureStatement } from "@/page-components/ArchitectureStatement";
import { MultiTenantArchitecture } from "@/page-components/MultiTenantArchitecture";
import { PluginEcosystem } from "@/page-components/PluginEcosystem";
import { IdentityWorkflow } from "@/page-components/IdentityWorkflow";
import { ComplianceAndAudit } from "@/page-components/ComplianceAndAudit";
import { Flow } from "@/page-components/Flow";
import { ZeroTrust } from "@/page-components/ZeroTrust";
import { Infrastructure } from "@/page-components/Infrastructure";
import { IndustryContexts } from "@/page-components/IndustryContexts";
import { SocialProof } from "@/page-components/SocialProof";
import { ClosingCTA } from "@/page-components/ClosingCTA";
import { Footer } from "@/page-components/Footer";
import { useAppContext } from "@/lib/app_context";
export default function Home() {
  const { appName } = useAppContext();
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      document.querySelectorAll(".parallax-number").forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || "0.3");
        const offset = scrolled * speed;
        (el as HTMLElement).style.transform = `translateY(-${offset}px)`;
      });
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>

      <Nav />
      {/* Distinctive geometric background layer */}
      <div className="landing-geometric-bg" aria-hidden="true" />

      <main style={{ position: "relative", overflow: "hidden" }}>
        {/* Floating geometric shapes for visual interest */}
        <div
          className="geo-ring geo-shape"
          aria-hidden="true"
          style={{ width: "400px", height: "400px", top: "10%", left: "-5%", opacity: 0.8 }}
        />
        <div
          className="geo-ring geo-shape"
          aria-hidden="true"
          style={{ width: "200px", height: "200px", top: "40%", right: "8%", opacity: 0.6, animationDelay: "-10s" }}
        />
        <div
          className="geo-diamond geo-shape"
          aria-hidden="true"
          style={{ width: "60px", height: "60px", top: "25%", left: "15%", opacity: 0.8 }}
        />
        <div
          className="geo-diamond geo-shape"
          aria-hidden="true"
          style={{ width: "40px", height: "40px", bottom: "30%", right: "20%", opacity: 0.7, animationDelay: "-15s" }}
        />

        {/* Dot grid accent near hero */}
        <div
          className="dot-grid-accent"
          aria-hidden="true"
          style={{ width: "300px", height: "300px", top: "5%", right: "5%", opacity: 0.9 }}
        />

        {/* Organic glow orbs */}
        <div
          className="glow-orb glow-orb--primary"
          aria-hidden="true"
          style={{ width: "600px", height: "400px", top: "-100px", left: "-150px" }}
        />
        <div
          className="glow-orb glow-orb--secondary"
          aria-hidden="true"
          style={{ width: "400px", height: "500px", top: "200px", right: "-100px", animationDelay: "-4s" }}
        />

        <Hero />
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "4%", left: "-10%", width: "360px", height: "360px", opacity: 0.22 }}
          ></div>
          <SolutionStatement />
          <Capabilities />
          <PersonaTabs />
        </div>

        {/* Section divider */}
        <div className="section-divider" aria-hidden="true" />

        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="geo-cross geo-shape"
            style={{ top: "10%", left: "8%", opacity: 0.8 }}
          />
          <div
            aria-hidden="true"
            className="geo-cross geo-shape"
            style={{ top: "60%", right: "12%", opacity: 0.7, animationDelay: "-8s" }}
          />
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "26%", right: "-12%", left: "auto", width: "420px", height: "420px", opacity: 0.25 }}
          ></div>
          <MultiTenantArchitecture />
          <PluginEcosystem />
        </div>

        <TrustStrip />

        {/* Section divider */}
        <div className="section-divider" aria-hidden="true" />

        <ArchitectureStatement />
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="glow-orb glow-orb--accent"
            style={{ width: "350px", height: "350px", top: "20%", left: "0" }}
          />
          <div
            aria-hidden="true"
            className="dot-grid-accent"
            style={{ width: "200px", height: "200px", bottom: "10%", left: "5%", opacity: 0.8 }}
          />
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "14%", left: "8%", width: "300px", height: "300px", opacity: 0.22 }}
          ></div>
          <IdentityWorkflow />
          <ComplianceAndAudit />
          <Flow />
        </div>

        {/* <ZeroTrust /> */}

        {/* Section divider */}
        <div className="section-divider" aria-hidden="true" />

        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="geo-ring geo-shape"
            style={{ width: "300px", height: "300px", bottom: "20%", left: "-5%", opacity: 0.5 }}
          />
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ bottom: "10%", right: "6%", left: "auto", width: "380px", height: "380px", opacity: 0.2 }}
          ></div>
          {/* <IndustryContexts /> */}
          <Infrastructure />
          <SocialProof />
          <ClosingCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
