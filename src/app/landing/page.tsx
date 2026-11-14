import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  DoorOpen,
  Hotel,
  KeyRound,
  Layers3,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  Wrench,
} from "lucide-react";

import { VmsWordmark } from "@/components/brand/VmsBrand";

export const metadata: Metadata = {
  title: "VMS Core — One operating system for every property",
  description:
    "Model every site, give every team the right workspace, and run access, billing, maintenance and community operations from one property platform.",
};

const domains = [
  { label: "Residential", detail: "Estates, apartments and communities", icon: Building2 },
  { label: "Commercial", detail: "Offices, retail and business parks", icon: Store },
  { label: "Mixed-use", detail: "Many uses, one operating model", icon: Layers3 },
  { label: "Hospitality", detail: "Rooms, stays and guest operations", icon: Hotel },
] as const;

const capabilities = [
  {
    eyebrow: "Structure",
    title: "Model the place as it really exists.",
    detail:
      "Create organizations, parent and child sites, buildings, units, rooms and shared spaces without flattening them into one generic property list.",
    icon: Layers3,
  },
  {
    eyebrow: "Access",
    title: "Turn the gate into a live operating surface.",
    detail:
      "Issue invitations, operate checkpoints, inspect movement history and connect credentials to the people and places that authorize them.",
    icon: ScanLine,
  },
  {
    eyebrow: "Money",
    title: "Make charges visible and payable.",
    detail:
      "Define recurring or one-off charges, assign them to the right places and let occupants see what they owe from their own workspace.",
    icon: CircleDollarSign,
  },
  {
    eyebrow: "Operations",
    title: "Keep service work close to context.",
    detail:
      "Track maintenance, contractors, announcements and operational handoffs against the exact site or place where the work happens.",
    icon: Wrench,
  },
] as const;

const workspaceRows = [
  { label: "Main gate", detail: "12 expected arrivals", tone: "coral" },
  { label: "Maintenance", detail: "4 requests need triage", tone: "amber" },
  { label: "Collections", detail: "8 payments reconciled today", tone: "green" },
] as const;

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px] lg:mx-0 lg:ml-auto">
      <div className="absolute -left-8 top-16 hidden h-28 w-28 rounded-full bg-[var(--vms-coral)]/10 blur-3xl sm:block" />
      <div className="absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#10171d] p-2 shadow-[0_32px_90px_rgba(8,15,20,0.36)] sm:p-3">
        <div className="overflow-hidden rounded-[18px] bg-[#f4f6f5]">
          <div className="flex h-12 items-center justify-between border-b border-black/5 bg-white px-4 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#171f26] text-[9px] font-bold text-white">VM</span>
              <span className="text-[11px] font-semibold text-[#1d2730] sm:text-xs">Northbank Properties</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-black/10 bg-white px-2.5 py-1 text-[9px] font-medium text-[#69737c] sm:inline">All systems normal</span>
              <span className="h-7 w-7 rounded-full bg-[#d9e0dc]" />
            </div>
          </div>
          <div className="grid min-h-[370px] grid-cols-[54px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)]">
            <aside className="border-r border-black/5 bg-white p-2.5 sm:p-4">
              <p className="hidden text-[8px] font-semibold uppercase tracking-[0.18em] text-[#98a0a6] sm:block">Current site</p>
              <div className="mt-1.5 flex h-9 items-center justify-center rounded-lg bg-[#eef1ef] px-2 sm:justify-start sm:gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#303b44]" />
                <span className="hidden truncate text-[9px] font-semibold text-[#303b44] sm:inline">Palm Court Estate</span>
              </div>
              <div className="mt-5 space-y-1.5">
                {["Overview", "Places", "People", "Access", "Charges"].map((item, index) => (
                  <div
                    key={item}
                    className={`flex h-8 items-center justify-center rounded-lg px-2 sm:justify-start sm:gap-2 ${index === 0 ? "bg-[#171f26] text-white" : "text-[#77818a]"}`}
                  >
                    <span className={`h-2 w-2 rounded-[3px] ${index === 0 ? "bg-[#ff806f]" : "bg-[#c7ceca]"}`} />
                    <span className="hidden text-[9px] font-medium sm:inline">{item}</span>
                  </div>
                ))}
              </div>
            </aside>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8d969d]">Friday, 14 November</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#202a32] sm:text-xl">Good morning, Ada.</h2>
                  <p className="mt-1 text-[9px] text-[#7f8991] sm:text-[10px]">Here is what needs attention across this site.</p>
                </div>
                <button className="hidden rounded-lg bg-[#171f26] px-3 py-2 text-[9px] font-semibold text-white sm:block">Open command menu</button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {[
                  ["94%", "Occupied"],
                  ["18", "Visitors today"],
                  ["₦2.4m", "Collected"],
                ].map(([value, label], index) => (
                  <div key={label} className={`${index === 2 ? "col-span-2 sm:col-span-1" : ""} rounded-xl border border-black/[0.06] bg-white p-3.5`}>
                    <p className="text-lg font-semibold tracking-[-0.04em] text-[#202a32]">{value}</p>
                    <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.12em] text-[#90989e]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-black/[0.06] bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-[#26313a]">Priority queue</p>
                  <span className="text-[8px] font-semibold text-[#6f7880]">View all</span>
                </div>
                <div className="mt-2 divide-y divide-black/[0.05]">
                  {workspaceRows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3 py-2.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          row.tone === "coral" ? "bg-[#ff806f]" : row.tone === "amber" ? "bg-[#e3a83d]" : "bg-[#4d9b72]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold text-[#303a42]">{row.label}</p>
                        <p className="truncate text-[8px] text-[#8a939a]">{row.detail}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-[#aab0b5]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-black/5 bg-white px-3.5 py-3 shadow-[0_14px_40px_rgba(20,28,34,0.14)] sm:flex">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f5ee] text-[#397b5a]"><Check className="h-4 w-4" /></span>
        <span><span className="block text-[10px] font-semibold text-[#26313a]">Visitor approved</span><span className="mt-0.5 block text-[9px] text-[#7f8991]">Gate team notified instantly</span></span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f6] text-[#172129]">
      <header className="relative z-20 mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/landing" aria-label="VMS Core product home"><VmsWordmark size="md" /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#637078] md:flex" aria-label="Primary navigation">
          <a href="#platform" className="transition hover:text-[#172129]">Platform</a>
          <a href="#workspaces" className="transition hover:text-[#172129]">Workspaces</a>
          <a href="#properties" className="transition hover:text-[#172129]">Property types</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden min-h-11 items-center rounded-lg px-3.5 text-sm font-semibold text-[#38434b] transition hover:bg-white sm:inline-flex">Sign in</Link>
          <Link href="/auth/register" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172129] px-4 text-sm font-semibold text-white transition hover:bg-[#2a353d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff806f] focus-visible:ring-offset-2">
            Start your organization <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-[1440px] gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,0.88fr)_minmax(520px,1.12fr)] lg:items-center lg:px-12 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e6971] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#ef705f]" /> Property operations, finally in context
          </span>
          <h1 className="mt-7 text-[clamp(3.2rem,7vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.075em] text-[#111a20]">
            Every place.<br /><span className="text-[#ef705f]">One clear pulse.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#647078] sm:text-lg sm:leading-8">
            Build a digital twin of your real estate organization, then give managers, residents, tenants, employees and gate teams the exact workspace they need to run it.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#172129] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2a353d] hover:shadow-lg">
              Create your organization <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#platform" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-[#26313a] transition hover:border-black/20 hover:bg-[#fbfcfb]">
              See how it fits together <DoorOpen className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#6d777e]">
            {["Portfolio to front gate", "Role-aware workspaces", "Four property domains"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#39805b]" />{item}</span>
            ))}
          </div>
        </div>
        <ProductPreview />
      </section>

      <section id="platform" className="bg-[#121a20] px-5 py-24 text-white sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1344px]">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff8b7c]">A model that matches reality</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">Your portfolio is a living system, not a spreadsheet.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/58 lg:ml-auto lg:text-lg lg:leading-8">A large estate can contain a smaller estate. A mixed-use site can contain homes, offices and hospitality. VMS Core preserves those boundaries while giving leadership one place to see the whole operation.</p>
          </div>

          <div className="mt-16 grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-4 sm:p-4">
            {[
              ["01", "Organization", "Owns the portfolio and its operating standards"],
              ["02", "Site", "Runs operations with its own managers and identity"],
              ["03", "Place", "Represents buildings, units, rooms and spaces"],
              ["04", "Workspace", "Shows each person only what their role needs"],
            ].map(([number, title, detail], index) => (
              <div key={title} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.045] p-5 sm:min-h-52">
                <span className="text-[10px] font-bold tracking-[0.16em] text-[#ff8b7c]">{number}</span>
                <h3 className="mt-12 text-xl font-semibold tracking-[-0.03em]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">{detail}</p>
                {index < 3 ? <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-[#ff8b7c] sm:block" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workspaces" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1344px]">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d95f50]">One platform, many jobs</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1] tracking-[-0.055em] sm:text-6xl">Give everyone a workspace that feels made for them.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#69747b]">Leadership sees the portfolio. Site teams run the day. Occupants handle the things that touch their place. Security keeps people moving safely.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {capabilities.map(({ eyebrow, title, detail, icon: Icon }, index) => (
              <article key={title} className={`group relative overflow-hidden rounded-[22px] border border-black/[0.07] p-7 sm:p-9 ${index === 0 ? "bg-[#e9efe9]" : index === 1 ? "bg-[#f3e9e6]" : "bg-white"}`}>
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#172129] text-white"><Icon className="h-5 w-5" /></span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b858b]">{eyebrow}</span>
                </div>
                <h3 className="mt-14 max-w-lg text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">{title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#667179] sm:text-base sm:leading-7">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="properties" className="border-y border-black/[0.06] bg-white px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[1344px]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d95f50]">Built for property complexity</p><h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl">Different properties. Shared operational truth.</h2></div>
            <p className="max-w-lg text-sm leading-6 text-[#69747b] sm:text-base">Use a domain-specific experience without splitting your organization across disconnected tools.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] border border-black/[0.07] bg-black/[0.07] sm:grid-cols-2 lg:grid-cols-4">
            {domains.map(({ label, detail, icon: Icon }) => (
              <div key={label} className="bg-white p-6 sm:min-h-52">
                <Icon className="h-6 w-6 text-[#2e3a43]" />
                <h3 className="mt-14 text-lg font-semibold tracking-[-0.025em]">{label}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#778087]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1344px] overflow-hidden rounded-[28px] bg-[#172129] text-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff8b7c]"><ShieldCheck className="h-4 w-4" /> Permission by real responsibility</span>
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">The right person. The right place. The right action.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/58">Organization administrators, site managers and occupants are separate roles. That distinction keeps powerful operations available without turning every user into a super-admin.</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {[
                [KeyRound, "Managers", "Operate only the sites they are responsible for"],
                [UsersRound, "Occupants", "Invite, pay and request service from their place"],
                [ScanLine, "Gate teams", "Verify arrivals and record movement in real time"],
                [MessageSquareText, "Communities", "Stay informed through notices and discussion"],
              ].map(([Icon, title, detail]) => {
                const ItemIcon = Icon as typeof KeyRound;
                return <div key={String(title)} className="rounded-xl border border-white/10 bg-white/[0.045] p-4"><ItemIcon className="h-4 w-4 text-[#ff8b7c]" /><p className="mt-5 text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-white/48">{String(detail)}</p></div>;
              })}
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden bg-[#e5ebe6] p-8 text-[#172129] sm:p-12 lg:min-h-0">
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(to right,rgba(23,33,41,.08) 1px,transparent 1px),linear-gradient(to bottom,rgba(23,33,41,.08) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
            <div className="relative flex h-full flex-col justify-center">
              <div className="mx-auto w-full max-w-sm space-y-3">
                {[
                  ["Organization admin", "Portfolio & policy", "OA"],
                  ["Site manager", "Palm Court Estate", "SM"],
                  ["Resident", "Building A · Unit 12", "RE"],
                ].map(([title, detail, initials], index) => (
                  <div key={title} className={`flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white p-4 shadow-sm ${index === 1 ? "translate-x-3" : index === 2 ? "translate-x-6" : ""}`}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#172129] text-[10px] font-bold text-white">{initials}</span>
                    <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block truncate text-xs text-[#748087]">{detail}</span></span>
                    <Check className="ml-auto h-4 w-4 text-[#3b815d]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1344px] rounded-[28px] bg-[#ef7565] px-6 py-16 text-center text-[#172129] sm:px-12 sm:py-20">
          <BedDouble className="mx-auto h-7 w-7" />
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">Run the whole place, not another pile of tools.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#172129]/70 sm:text-base">Start with one organization and one site. Add every building, team and operating module as your portfolio grows.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#172129] px-5 text-sm font-semibold text-white transition hover:bg-[#2a353d]">Create your organization <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/auth/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#172129]/20 px-5 text-sm font-semibold transition hover:bg-white/20">Sign in to your workspace</Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-10 text-xs text-[#778087] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <VmsWordmark size="sm" />
        <p>Property operations, access and community — kept in context.</p>
        <div className="flex gap-5"><Link href="/auth/login" className="hover:text-[#172129]">Sign in</Link><Link href="/auth/register" className="hover:text-[#172129]">Create account</Link></div>
      </footer>
    </main>
  );
}
