import Head from "next/head";
import { useEffect } from "react";
import { Nav } from "@/pages/components/Nav";
import { Hero } from "@/pages/components/Hero";
import { ProblemStatement } from "@/pages/components/ProblemStatement";
import { Capabilities } from "@/pages/components/Capabilities";
import { TrustStrip } from "@/pages/components/TrustStrip";
import { ArchitectureStatement } from "@/pages/components/ArchitectureStatement";
import { MultiTenantArchitecture } from "@/pages/components/MultiTenantArchitecture";
import { PluginEcosystem } from "@/pages/components/PluginEcosystem";
import { IdentityWorkflow } from "@/pages/components/IdentityWorkflow";
import { ComplianceAndAudit } from "@/pages/components/ComplianceAndAudit";
import { Flow } from "@/pages/components/Flow";
import { ZeroTrust } from "@/pages/components/ZeroTrust";
import { Infrastructure } from "@/pages/components/Infrastructure";
import { IndustryContexts } from "@/pages/components/IndustryContexts";
import { SocialProof } from "@/pages/components/SocialProof";
import { ClosingCTA } from "@/pages/components/ClosingCTA";
import { Footer } from "@/pages/components/Footer";

export default function Home() {
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
      <Head>
        <title>VMS Core | Enterprise Visitor Management</title>
      </Head>
      <Nav />
      <main style={{ position: "relative", overflow: "hidden" }}>
        <Hero />
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "4%", left: "-10%", width: "360px", height: "360px", opacity: 0.22 }}
          ></div>
          <ProblemStatement />
          <Capabilities />
        </div>

        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "2%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "72%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          ></div>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "26%", right: "-12%", left: "auto", width: "420px", height: "420px", opacity: 0.18 }}
          ></div>
          <MultiTenantArchitecture />
          <PluginEcosystem />
        </div>

        <TrustStrip />
        <ArchitectureStatement />
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ top: "14%", left: "8%", width: "300px", height: "300px", opacity: 0.15 }}
          ></div>
          <IdentityWorkflow />
          <ComplianceAndAudit />
          <Flow />
        </div>

        <ZeroTrust />
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "0",
              left: "50%",
              transform: "translateX(-50%)",
              width: "68%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            }}
          ></div>
          <div
            aria-hidden="true"
            className="bg-glow"
            style={{ bottom: "10%", right: "6%", left: "auto", width: "380px", height: "380px", opacity: 0.14 }}
          ></div>
          <IndustryContexts />
          <Infrastructure />
          <SocialProof />
          <ClosingCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
