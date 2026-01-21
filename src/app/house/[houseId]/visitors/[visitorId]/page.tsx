"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock3,
  QrCode,
  Check,
  Copy,
  Map as MapIcon,
  CheckCircle2,
  Circle,
  Activity,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VisitorGateStatus } from "@/types";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVisitor } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useProfile } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function VisitorDetailPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string; visitorId?: string }>();
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { data: profile } = useProfile();
  const [copiedVisitorGatePass, setVisitorCopiedGatePass] = useState(false);
  const [copiedGatePass, setCopiedGatePass] = useState(false);

  const rawHouseId = params?.houseId;
  const houseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const rawVisitorId = params?.visitorId;
  const visitorId = Array.isArray(rawVisitorId) ? rawVisitorId[0] : rawVisitorId;
  const effectiveHouseId = houseId ?? selectedHouse?.id ?? null;

  useEffect(() => {
    if (!houseId || !profile?.houses) return;
    if (selectedHouse?.id === houseId) return;
    const match = profile.houses.find((house) => house.id === houseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [houseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);


  const parseImageUrl = useMemo(() => (url: string) => {
    try {
      const parsedUrl = new URL(url);

      return parsedUrl.toString();
    } catch (error) {
      console.error("Error parsing URL:", error);
      return `https://api.vmscore.test/${url}`;
    }
  }, []);

  const copyVisitorGatePass = () => {
    if (!passCode) return;
    navigator.clipboard.writeText(passCode);
    setVisitorCopiedGatePass(true);
    toast.success("Visitor Pass code copied to clipboard");
    setTimeout(() => {
      setVisitorCopiedGatePass(false);
    }, 2000);
  };

  const copyGatePass = () => {
    if (!visitor.gate_pass?.code) return;
    navigator.clipboard.writeText(visitor.gate_pass.code);
    setCopiedGatePass(true);
    toast.success("Pass code copied to clipboard");
    setTimeout(() => {
      setCopiedGatePass(false);
    }, 2000);
  };

  const { data: visitor, isLoading } = useVisitor(effectiveHouseId, visitorId ?? null);

  const gateVisualization = useMemo(() => {
    // Handle both spelled and typoed versions from API
    const map = (visitor as any)?.dependency_gate_map || (visitor as any)?.dependecy_gate_map;
    if (!map) return { mainPath: [], branches: [] };

    const items = (Object.values(map) as VisitorGateStatus[]).filter(Boolean);
    const mainPath: VisitorGateStatus[] = [];
    const branches: Record<string, VisitorGateStatus[]> = {};
    const visited = new Set<string>();

    const processNode = (node: VisitorGateStatus) => {
      if (visited.has(node.gate.id)) return;

      if (node.status === 'unavailable') {
        visited.add(node.gate.id);
        const parentId = node.dependency_gate?.id;
        const attachId = (parentId && visited.has(parentId)) ? parentId : (mainPath.length > 0 ? mainPath[0].gate.id : 'root');
        if (!branches[attachId]) branches[attachId] = [];
        branches[attachId].push(node);
        return;
      }

      visited.add(node.gate.id);
      mainPath.push(node);

      const kids = items.filter(i => i.dependency_gate?.id === node.gate.id);
      const sortedKids = [...kids].sort((a, b) => {
        const getScore = (s: string) => ['checked_out', 'checked_in', 'pending'].includes(s) ? 0 : 1;
        return getScore(a.status) - getScore(b.status);
      });

      sortedKids.forEach(k => processNode(k));
    };

    const roots = items.filter(i => !i.dependency_gate || !map[i.dependency_gate.id]);
    roots.sort((a, b) => {
      const getScore = (s: string) => ['checked_out', 'checked_in', 'pending'].includes(s) ? 0 : 1;
      return getScore(a.status) - getScore(b.status);
    });

    roots.forEach(r => processNode(r));
    items.forEach(item => {
      if (!visited.has(item.gate.id)) processNode(item);
    });

    const result = { mainPath, branches };
    console.log("Gate Visualization Map:", map);
    console.log("Gate Visualization Result:", result);
    return result;
  }, [visitor]);



  if (!effectiveHouseId) {
    return (
      <>
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={QrCode}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector to view visitor details."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </>
    );
  }

  if (!visitor) {
    return (
      <>
        <EmptyState
          icon={QrCode}
          title="Visitor not found"
          description="We couldn't load this visitor. They might have been removed."
          action={{
            label: "Back to visitors",
            onClick: () => router.push(`/house/${effectiveHouseId}/visitors`),
          }}
        />
      </>
    );
  }

  const passId = visitor.gate_pass_id;
  const passCode = visitor?.gate_pass?.code + "-" + visitor?.pass_code_suffix;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/house/${effectiveHouseId}/visitors`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to visitors
          </Button>
        </div>

        <section className="rounded-xl border border-border/60 shadow-xl">
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase">Visitor</p>
              <h1 className="text-3xl font-semibold">{visitor.name ?? "Visitor"}</h1>
              <p className="text-white/80">{visitor.email}</p>
            </div>
            <div className="grid gap-2 text-right text-sm">
              <span className="text-white/70">Visitor Pass Code</span>
              <div className="flex items-center gap-2 cursor-pointer" onClick={copyVisitorGatePass}>
                <span className="font-mono text-lg">{passCode}</span>
                <div className="">
                  {copiedVisitorGatePass ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Movement Dependency Map */}
            {((visitor as any)?.dependency_gate_map || (visitor as any)?.dependecy_gate_map) && (
              <Card className="relative  border border-white/20 dark:border-zinc-800/50 shadow-xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl h-[calc(100vh-400px)]">
                <CardHeader className="border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 font-bold cursor-default group">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                          <MapIcon className="h-5 w-5" />
                        </div>
                        Gate Clearance Route
                      </CardTitle>
                      <CardDescription>Visualizing the verification path and branches</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
                      {visitor.status === 'checked_out' ? 'Journey Completed' : 'Path Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pb-12 overflow-auto h-full scrollbar-thin">
                  <div className="flex items-start justify-between min-w-max gap-12 relative pt-8 pb-32">
                    {/* Main Path Connection Line */}
                    <div className="hidden md:block absolute top-[60px] left-12 right-12 h-[2px] bg-gradient-to-r from-blue-500/20 via-zinc-200 dark:via-zinc-800 to-zinc-200 dark:to-zinc-800 -z-0" />

                    {gateVisualization.mainPath.map((gateStatus, idx, arr) => {
                      const status = gateStatus.status;
                      const isCleared = status === 'checked_in' || status === 'checked_out';
                      const isPending = status === 'pending';
                      const isLocked = status === 'locked';
                      const isLast = idx === arr.length - 1;
                      const nodeBranches = gateVisualization.branches[gateStatus.gate.id] || [];

                      return (
                        <div key={gateStatus.gate.id} className="flex flex-col items-center gap-4 relative z-10">
                          {/* Node Circle */}
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-[3px] shadow-sm relative",
                              isCleared
                                ? "bg-green-100 border-green-500 text-green-600 shadow-lg shadow-green-500/20"
                                : isPending
                                  ? "bg-blue-50 border-blue-400 text-blue-500 animate-pulse shadow-lg shadow-blue-500/20"
                                  : isLocked
                                    ? "bg-zinc-600 dark:bg-zinc-800 border-zinc-500 dark:border-zinc-700 dark:text-zinc-400 text-zinc-400"
                                    : "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                            )}
                          >
                            {isCleared ? <CheckCircle2 className="h-7 w-7" /> : isLocked ? <Shield className="h-6 w-6 opacity-70" /> : <Circle className="h-6 w-6" />}

                            {/* Progress Connector (Mobile) */}
                            {!isLast && (
                              <div className="md:hidden absolute -bottom-8 left-1/2 -ml-px h-8 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
                            )}
                          </motion.div>

                          {/* Info Container */}
                          <div className="text-center w-32 z-10">
                            <p className={cn(
                              "text-xs font-extrabold truncate uppercase tracking-tighter",
                              isCleared ? "text-green-700 dark:text-green-400" : isPending ? "text-blue-600" : "text-zinc-500"
                            )}>
                              {gateStatus.gate.name}
                            </p>

                            <div className="mt-1 flex flex-col items-center gap-1">
                              {gateStatus.event ? (
                                <div className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold font-mono">
                                  {format(new Date(gateStatus.event.checkin_time), "HH:mm")}
                                </div>
                              ) : (
                                <Badge variant="outline" className={cn(
                                  "text-[8px] uppercase px-1.5 py-0 border-zinc-200 dark:border-zinc-700 font-bold",
                                  isLocked ? "bg-zinc-200 text-zinc-600" : "bg-blue-50 text-blue-500 border-blue-200"
                                )}>
                                  {status}
                                </Badge>
                              )}


                              <p className="text-[8px] text-red-500 dark:text-red-400 max-w-[100px] leading-tight mt-1 italic font-medium">
                                {gateStatus.message}
                              </p>

                            </div>
                          </div>

                          {/* BRANCHING SECTION (Vertical Spine and Spurs) */}
                          <AnimatePresence>
                            {nodeBranches.length > 0 && (
                              <div className="absolute top-[120px] left-1/2 flex flex-col gap-12 py-4">
                                {nodeBranches.map((branch, bIdx) => (
                                  <motion.div
                                    key={branch.gate.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="flex items-center gap-4 relative "
                                  >
                                    {/* The Curved Spur - connecting seamlessly to the one above */}
                                    <div
                                      className="absolute -left-2 border-l-2 border-b-2 border-zinc-200 dark:border-zinc-800 rounded-bl-xl shadow-[0_2px_0_0_rgba(0,0,0,0.02)]"
                                      style={{
                                        top: bIdx === 0 ? "-80px" : "-60px",
                                        height: bIdx === 0 ? "116px" : "96px",
                                        width: "28px"
                                      }}
                                    />

                                    <div className={cn(
                                      "h-12 w-12 rounded-xl flex items-center justify-center left-4 mr-2 border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-zinc-400 relative z-10",
                                      branch.status === 'unavailable' && "opacity-60 grayscale"
                                    )}>
                                      <Activity className="h-6 w-6" />
                                    </div>

                                    <div className="flex flex-col relative z-20">
                                      <span className="text-[10px] font-black left-4 text-zinc-500 bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 leading-none whitespace-nowrap shadow-sm backdrop-blur-sm">
                                        {branch.gate.name}
                                      </span>
                                      <span className="text-[8px] text-zinc-400 mt-1 uppercase font-black tracking-widest px-1.5">
                                        {branch.status}
                                      </span>
                                      <span className="text-[8px] text-red-500/80 dark:text-red-400 mt-0.5 italic leading-tight px-1.5 max-w-[120px]">
                                        {branch.message}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Side Column: Pass & Credentials */}
            <Card className="shadow-lg border-white/20 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Pass Integrity</CardTitle>
                <CardDescription className="text-[10px]">Linked QR and security code</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="bg-zinc-100/50 dark:bg-zinc-800/30 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700/50 group transition-all duration-300 hover:border-blue-500/30">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black mb-2 px-1">Pass System Code</p>
                  <div className="flex items-center justify-between group/code cursor-pointer" onClick={copyGatePass}>
                    <p className="font-mono text-xl font-black tracking-tighter text-zinc-800 dark:text-zinc-200">{visitor.gate_pass.code}</p>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm opacity-0 group-hover/code:opacity-100 transition-all">
                      {copiedGatePass ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
                    </div>
                  </div>
                </div>

                {visitor.qr_code_url && (
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 shadow-inner flex items-center justify-center relative group/qr">
                    <Image
                      src={parseImageUrl(visitor.qr_code_url)}
                      alt="Visitor QR code"
                      width={180}
                      height={180}
                      className="rounded-xl object-contain drop-shadow-md transition-transform duration-500 group-hover/qr:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover/qr:opacity-100 transition-all">
                      <span className="text-[8px] bg-zinc-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm uppercase font-black tracking-widest">Encrypted QR</span>
                    </div>
                  </div>
                )}

                {passId && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 h-11 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    onClick={() => router.push(`/house/${effectiveHouseId}/passes/${passId}`)}
                  >
                    View Secure Registry
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-white/20 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100/50 dark:border-zinc-800/50 px-6 py-4">
                <CardTitle className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Visitor Credentials</CardTitle>
                <CardDescription className="text-[10px]">Contact and lifecycle info</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-4">
                  <CompactInfoItem icon={Mail} label="Contact Email" value={visitor.email || "UNSPECIFIED"} />
                  <CompactInfoItem icon={Phone} label="Primary Phone" value={visitor.phone || "UNSPECIFIED"} />
                </div>

                <div className="pt-4 mt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2.5">
                  <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20 p-2.5 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Entry Created</span>
                    <span className="text-[10px] font-mono font-black text-zinc-600 dark:text-zinc-400">{visitor.created_at ? format(new Date(visitor.created_at), "MMM d, HH:mm") : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20 p-2.5 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                    <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Last Modified</span>
                    <span className="text-[10px] font-mono font-black text-zinc-600 dark:text-zinc-400">{visitor.updated_at ? format(new Date(visitor.updated_at), "MMM d, HH:mm") : "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function CompactInfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-all">
      <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-black leading-none mb-1">{label}</span>
        <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-none">{value}</span>
      </div>
    </div>
  );
}
