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
        <title>VMS Core — Community Access &amp; Visitor Management</title>
        <meta name="description" content="VMS Core is the all-in-one platform for HOAs, gated communities, and apartment buildings to manage visitor access, gate events, resident coordination, and community operations." />
        <meta property="og:title" content="VMS Core — Community Access &amp; Visitor Management" />
        <meta property="og:description" content="Replace scattered approvals, gate codes, and notebooks with one clear, auditable system your whole team will use." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
          <SolutionStatement />
          <Capabilities />
          <PersonaTabs />
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

        {/* <ZeroTrust /> */}
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
