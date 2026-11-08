"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Cpu,
  DoorClosed,
  DoorOpen,
  Gauge,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Siren,
  TimerReset,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { parseApiError } from "@/lib/error-utils";
import { adminGateService } from "@/services/admin-gate-service";
import {
  AccessCommand,
  AccessCommandStatus,
  AccessDecisionOutcome,
  AccessLane,
  AccessLaneAvailability,
  AccessLaneState,
  AccessSimulationResponse,
  accessControlService,
} from "@/services/access-control-service";

const laneAvailabilityOptions: AccessLaneAvailability[] = [
  "online",
  "offline",
  "fault",
];
const laneStateOptions: AccessLaneState[] = ["closed", "open", "unknown"];

function commandLabel(status?: AccessCommandStatus) {
  const labels: Record<AccessCommandStatus, string> = {
    pending: "Dispatched, waiting for acknowledgement",
    acknowledged: "Acknowledged by the device adapter",
    completed: "Observed state reached",
    timed_out: "Command expired before acknowledgement",
    rejected: "Command rejected by the device",
    offline: "Lane unavailable; command was not delivered",
  };
  return status ? labels[status] : "No hardware command";
}

function commandVariant(status?: AccessCommandStatus) {
  if (status === "completed") return "success" as const;
  if (status === "pending" || status === "acknowledged")
    return "warning" as const;
  if (status === "offline" || status === "timed_out") return "danger" as const;
  if (status === "rejected") return "danger" as const;
  return "secondary" as const;
}

function availabilityVariant(availability: AccessLaneAvailability) {
  if (availability === "online") return "success" as const;
  if (availability === "fault") return "warning" as const;
  if (availability === "offline") return "danger" as const;
  return "secondary" as const;
}

function timestamp(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString() : "—";
}

function CommandHistory({ commands }: { commands: AccessCommand[] }) {
  if (commands.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hardware commands have been dispatched for this lane.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {commands.slice(0, 8).map((command) => (
        <div
          key={command.id}
          className="flex flex-col gap-2 rounded-lg border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-md bg-background p-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {command.action === "open" ? "Open barrier" : "Close barrier"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {command.id} · expires {timestamp(command.expires_at)}
              </p>
            </div>
          </div>
          <Badge variant={commandVariant(command.status)}>
            {command.status.replaceAll("_", " ")}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function SiteSetupModal({
  isPending,
  onClose,
  onSave,
}: {
  isPending: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("A site name is required.");
      return;
    }
    onSave(name.trim());
  };

  return (
    <Modal isOpen onClose={onClose} title="Create a simulated site">
      <form className="space-y-5" onSubmit={submit}>
        <Input
          label="Site name"
          aria-label="Site name"
          showAsterisk
          value={name}
          error={error}
          placeholder="North Campus"
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        <p className="text-sm text-muted-foreground">
          A site groups logical gates and physical doors or barriers for one
          organization.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Create site
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function LaneSetupModal({
  sites,
  gates,
  isPending,
  onClose,
  onSave,
}: {
  sites: { id: string; name: string }[];
  gates: { id: string; name: string }[];
  isPending: boolean;
  onClose: () => void;
  onSave: (values: {
    siteId: string;
    gateId: string;
    name: string;
    kind: "barrier" | "door" | "turnstile";
  }) => void;
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id || "");
  const [gateId, setGateId] = useState(gates[0]?.id || "");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"barrier" | "door" | "turnstile">("barrier");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!siteId || !gateId || !name.trim()) {
      setError("Select a site and gate, then enter a lane name.");
      return;
    }
    onSave({ siteId, gateId, name: name.trim(), kind });
  };

  return (
    <Modal isOpen onClose={onClose} title="Add a door or barrier">
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="site-id">
              Site
            </label>
            <select
              id="site-id"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
              className="h-10 w-full rounded border bg-background px-3 text-sm"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="gate-id">
              Logical gate
            </label>
            <select
              id="gate-id"
              value={gateId}
              onChange={(event) => setGateId(event.target.value)}
              className="h-10 w-full rounded border bg-background px-3 text-sm"
            >
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Lane name"
          aria-label="Lane name"
          showAsterisk
          value={name}
          placeholder="Entry barrier"
          error={error}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="lane-kind">
            Device type
          </label>
          <select
            id="lane-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
            className="h-10 w-full rounded border bg-background px-3 text-sm"
          >
            <option value="barrier">Barrier</option>
            <option value="door">Door</option>
            <option value="turnstile">Turnstile</option>
          </select>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          The <strong>simulator</strong> driver records commands and
          acknowledgements without operating physical hardware.
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            Add lane
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AccessControlSimulatorPage() {
  const queryClient = useQueryClient();
  const [selectedLaneId, setSelectedLaneId] = useState("");
  const [reasonCode, setReasonCode] = useState("visitor_pass_valid");
  const [timeoutSeconds, setTimeoutSeconds] = useState(15);
  const [lastSimulation, setLastSimulation] =
    useState<AccessSimulationResponse | null>(null);
  const [showSiteSetup, setShowSiteSetup] = useState(false);
  const [showLaneSetup, setShowLaneSetup] = useState(false);
  const initialSelectionDone = useRef(false);

  const topologyQuery = useQuery({
    queryKey: ["access-control", "topology"],
    queryFn: accessControlService.getTopology,
  });
  const gatesQuery = useQuery({
    queryKey: ["access-control", "gates"],
    queryFn: async () => {
      const response = await adminGateService.getGates({
        page: 1,
        pageSize: 100,
      });
      return response.data.items;
    },
  });

  const sites = topologyQuery.data?.places || [];
  const lanes = useMemo(
    () =>
      sites.flatMap((site) =>
        site.gates.flatMap((gate) =>
          gate.lanes.map((lane) => ({
            ...lane,
            site: site.site,
            gateName: gate.name,
          })),
        ),
      ),
    [sites],
  );
  const selectedLane = lanes.find((lane) => lane.id === selectedLaneId);

  useEffect(() => {
    if (initialSelectionDone.current || lanes.length === 0) return;
    setSelectedLaneId(
      lanes.find((lane) => lane.availability === "online")?.id || lanes[0].id,
    );
    initialSelectionDone.current = true;
  }, [lanes]);

  useEffect(() => {
    if (selectedLaneId && lanes.length > 0 && !selectedLane) {
      setSelectedLaneId(lanes[0].id);
    }
  }, [lanes, selectedLane, selectedLaneId]);

  const commandsQuery = useQuery({
    queryKey: ["access-control", "commands", selectedLaneId],
    queryFn: () =>
      accessControlService.listCommands({ laneId: selectedLaneId }),
    enabled: Boolean(selectedLaneId),
    refetchInterval: lastSimulation ? 5000 : false,
  });

  const currentCommand = useMemo(() => {
    if (!lastSimulation) return undefined;
    return (
      commandsQuery.data?.find(
        (command) => command.decision_id === lastSimulation.decision.id,
      ) || lastSimulation.command
    );
  }, [commandsQuery.data, lastSimulation]);

  const refreshLaneData = (laneId = selectedLaneId) => {
    queryClient.invalidateQueries({ queryKey: ["access-control", "topology"] });
    queryClient.invalidateQueries({
      queryKey: ["access-control", "commands", laneId],
    });
  };

  const createSiteMutation = useMutation({
    mutationFn: accessControlService.createSite,
    onSuccess: (site) => {
      setShowSiteSetup(false);
      queryClient.invalidateQueries({
        queryKey: ["access-control", "topology"],
      });
      toast.success(`${site.name} was created.`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const createLaneMutation = useMutation({
    mutationFn: (values: {
      siteId: string;
      gateId: string;
      name: string;
      kind: "barrier" | "door" | "turnstile";
    }) =>
      accessControlService.createLane(values.siteId, {
        gate_id: values.gateId,
        name: values.name,
        kind: values.kind,
        driver_name: "simulator",
      }),
    onSuccess: (lane) => {
      setShowLaneSetup(false);
      setSelectedLaneId(lane.id);
      refreshLaneData(lane.id);
      toast.success(`${lane.name} was added.`);
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      laneId,
      outcome,
    }: {
      laneId: string;
      outcome: AccessDecisionOutcome;
    }) =>
      accessControlService.simulateDecision(laneId, {
        idempotency_key: crypto.randomUUID(),
        outcome,
        reason_code:
          reasonCode.trim() ||
          (outcome === "allowed"
            ? "visitor_pass_valid"
            : "visitor_pass_invalid"),
        command_action: "open",
        timeout_seconds: timeoutSeconds,
      }),
    onSuccess: (simulation) => {
      setLastSimulation(simulation);
      refreshLaneData(simulation.lane.id);
      toast.success(
        simulation.decision.outcome === "allowed"
          ? "Access decision allowed. Hardware dispatch is tracked separately."
          : "Access decision denied. No hardware command was created.",
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const laneStateMutation = useMutation({
    mutationFn: (payload: {
      availability?: AccessLaneAvailability;
      observed_state?: AccessLaneState;
      error_code?: string | null;
    }) => accessControlService.updateLaneState(selectedLaneId, payload),
    onSuccess: () => refreshLaneData(),
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({
      commandId,
      accepted,
    }: {
      commandId: string;
      accepted: boolean;
    }) =>
      accessControlService.acknowledgeCommand(commandId, {
        accepted,
        message: accepted
          ? "Simulator device accepted the barrier command."
          : "Simulator device rejected the barrier command.",
      }),
    onSuccess: (command) => {
      queryClient.setQueryData<AccessCommand[]>(
        ["access-control", "commands", selectedLaneId],
        (current) =>
          current
            ? current.map((item) => (item.id === command.id ? command : item))
            : [command],
      );
      refreshLaneData();
      toast.success(
        command.status === "acknowledged"
          ? "Device acknowledged the command."
          : "Device rejected the command.",
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  const expireMutation = useMutation({
    mutationFn: accessControlService.expireCommands,
    onSuccess: ({ expired }) => {
      refreshLaneData();
      toast.info(
        expired
          ? `${expired} command${expired === 1 ? "" : "s"} expired.`
          : "No commands have exceeded their deadline.",
      );
    },
    onError: (error) => toast.error(parseApiError(error).message),
  });

  if (topologyQuery.isLoading || gatesQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (topologyQuery.isError || gatesQuery.isError) {
    return (
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Access-control topology could not be loaded"
          description={
            parseApiError(topologyQuery.error || gatesQuery.error).message
          }
          action={{
            label: "Try again",
            onClick: () => {
              topologyQuery.refetch();
              gatesQuery.refetch();
            },
          }}
        />
      </Card>
    );
  }

  const gates = gatesQuery.data || [];
  const commandStatus = currentCommand?.status;
  const decisionAllowed = lastSimulation?.decision.outcome === "allowed";
  const barrierOpen = selectedLane?.observed_state === "open";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-sm sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">
                Policy decision
              </Badge>
              <Badge className="border-white/15 bg-white/10 text-white">
                Hardware command
              </Badge>
              <Badge className="border-white/15 bg-white/10 text-white">
                Observed state
              </Badge>
            </div>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <RadioTower className="h-7 w-7 text-emerald-300" />
              Access control simulator
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Exercise access decisions, command dispatch, acknowledgement,
              timeout, offline behavior, and the physical state reported by a
              device adapter.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="light-outlined"
              leftNode={<Plus className="h-4 w-4" />}
              onClick={() => setShowSiteSetup(true)}
            >
              New site
            </Button>
            <Button
              variant="light"
              leftNode={<Plus className="h-4 w-4" />}
              onClick={() => setShowLaneSetup(true)}
              disabled={sites.length === 0 || gates.length === 0}
            >
              Add lane
            </Button>
          </div>
        </div>
      </div>

      {lanes.length === 0 ? (
        <Card>
          <EmptyState
            icon={DoorClosed}
            title="Create a site and lane to begin"
            description="A physical lane connects one logical gate to a door, barrier, or turnstile through a driver."
            action={{
              label: sites.length === 0 ? "Create site" : "Add lane",
              onClick: () =>
                sites.length === 0
                  ? setShowSiteSetup(true)
                  : setShowLaneSetup(true),
            }}
          />
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap gap-2 py-4">
              {lanes.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => {
                    setSelectedLaneId(lane.id);
                    setLastSimulation(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                    lane.id === selectedLaneId
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "bg-background hover:bg-muted/40"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {lane.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {lane.site.name} · {lane.gateName}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedLane && (
            <>
              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {barrierOpen ? (
                            <DoorOpen className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <DoorClosed className="h-5 w-5 text-slate-600" />
                          )}
                          {selectedLane.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedLane.site.name} · {selectedLane.gateName} ·{" "}
                          {selectedLane.kind} · {selectedLane.driver_name}{" "}
                          driver
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={availabilityVariant(
                            selectedLane.availability,
                          )}
                        >
                          {selectedLane.availability}
                        </Badge>
                        <Badge variant="outline">
                          Observed: {selectedLane.observed_state}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-56 overflow-hidden rounded-2xl border bg-slate-900">
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-slate-800" />
                      <div className="absolute inset-x-0 bottom-16 flex justify-center">
                        <div className="h-1 w-full bg-amber-400/30" />
                      </div>
                      <div className="absolute bottom-14 left-[18%] h-28 w-5 rounded-t-md bg-slate-600 shadow-lg" />
                      <div
                        className={`absolute bottom-[6.3rem] left-[20%] h-3 w-[58%] origin-left rounded-full bg-white shadow-2xl transition-transform duration-700 ${
                          barrierOpen ? "-rotate-[52deg]" : "rotate-0"
                        }`}
                      >
                        <div className="h-full w-full rounded-full bg-[repeating-linear-gradient(90deg,#fff_0_28px,#ef4444_28px_56px)]" />
                      </div>
                      <div className="absolute bottom-20 left-[17%] h-16 w-7 rounded-md bg-slate-500" />
                      <div className="absolute bottom-24 left-[17.7%] h-2 w-6 rounded bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.9)]" />
                      <div className="absolute bottom-8 right-5 rounded-lg bg-black/40 px-3 py-2 text-xs text-slate-200 backdrop-blur">
                        Physical state:{" "}
                        <strong className="text-white">
                          {selectedLane.observed_state}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <Button
                        className="flex-1"
                        leftNode={<ShieldCheck className="h-4 w-4" />}
                        onClick={() =>
                          decisionMutation.mutate({
                            laneId: selectedLane.id,
                            outcome: "allowed",
                          })
                        }
                        isLoading={decisionMutation.isPending}
                      >
                        Simulate allowed access
                      </Button>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        leftNode={<ShieldX className="h-4 w-4" />}
                        onClick={() =>
                          decisionMutation.mutate({
                            laneId: selectedLane.id,
                            outcome: "denied",
                          })
                        }
                        disabled={decisionMutation.isPending}
                      >
                        Simulate denied access
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Gauge className="h-5 w-5 text-emerald-600" />
                      Scenario controls
                    </CardTitle>
                    <CardDescription>
                      Set the inputs used by the next policy decision.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Decision reason code"
                      aria-label="Decision reason code"
                      value={reasonCode}
                      onChange={(event) => setReasonCode(event.target.value)}
                    />
                    <Input
                      label="Command timeout (seconds)"
                      aria-label="Command timeout (seconds)"
                      type="number"
                      min={1}
                      max={300}
                      value={timeoutSeconds}
                      onChange={(event) =>
                        setTimeoutSeconds(
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                    />
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Lane availability
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {laneAvailabilityOptions.map((availability) => (
                          <Button
                            key={availability}
                            size="sm"
                            variant={
                              selectedLane.availability === availability
                                ? "primary"
                                : "outline"
                            }
                            onClick={() =>
                              laneStateMutation.mutate({ availability })
                            }
                            disabled={laneStateMutation.isPending}
                          >
                            {availability}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Observed physical state
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {laneStateOptions.map((observed_state) => (
                          <Button
                            key={observed_state}
                            size="sm"
                            variant={
                              selectedLane.observed_state === observed_state
                                ? "primary"
                                : "outline"
                            }
                            onClick={() =>
                              laneStateMutation.mutate({ observed_state })
                            }
                            disabled={laneStateMutation.isPending}
                          >
                            {observed_state}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full"
                      leftNode={<TimerReset className="h-4 w-4" />}
                      onClick={() => expireMutation.mutate()}
                      isLoading={expireMutation.isPending}
                    >
                      Advance clock / expire commands
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-4 w-4" />
                      1. Policy decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        lastSimulation
                          ? decisionAllowed
                            ? "success"
                            : "danger"
                          : "secondary"
                      }
                    >
                      {lastSimulation
                        ? decisionAllowed
                          ? "Allowed"
                          : "Denied"
                        : "Not simulated"}
                    </Badge>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {lastSimulation
                        ? `Reason: ${lastSimulation.decision.reason_code}`
                        : "No policy decision has been recorded in this session."}
                    </p>
                    {lastSimulation && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {timestamp(lastSimulation.decision.created_at)}
                        {lastSimulation.replayed
                          ? " · replayed idempotently"
                          : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cpu className="h-4 w-4" />
                      2. Hardware command
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={commandVariant(commandStatus)}>
                      {commandStatus?.replaceAll("_", " ") || "none"}
                    </Badge>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {commandLabel(commandStatus)}
                    </p>
                    {currentCommand && (
                      <>
                        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                          {currentCommand.id}
                        </p>
                        {currentCommand.status === "pending" && (
                          <div className="mt-4 flex flex-col gap-2">
                            <Button
                              size="sm"
                              leftNode={<CheckCircle2 className="h-4 w-4" />}
                              disabled={acknowledgeMutation.isPending}
                              onClick={() =>
                                acknowledgeMutation.mutate({
                                  commandId: currentCommand.id,
                                  accepted: true,
                                })
                              }
                            >
                              Acknowledge command
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              leftNode={<XCircle className="h-4 w-4" />}
                              disabled={acknowledgeMutation.isPending}
                              onClick={() =>
                                acknowledgeMutation.mutate({
                                  commandId: currentCommand.id,
                                  accepted: false,
                                })
                              }
                            >
                              Reject command
                            </Button>
                          </div>
                        )}
                        {currentCommand.status === "acknowledged" && (
                          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                            Waiting for the lane to report the requested
                            physical state.
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {selectedLane.availability === "online" ? (
                        <Wifi className="h-4 w-4" />
                      ) : (
                        <WifiOff className="h-4 w-4" />
                      )}
                      3. Observed state
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">
                      {selectedLane.observed_state}
                    </Badge>
                    <p className="mt-3 text-sm text-muted-foreground">
                      This value comes from the device adapter and is not
                      inferred from an API response.
                    </p>
                    {selectedLane.last_error_code && (
                      <p className="mt-3 rounded bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-200">
                        {selectedLane.last_error_code}
                      </p>
                    )}
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      Last observed {timestamp(selectedLane.last_seen_at)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Siren className="h-5 w-5 text-amber-600" />
                        Command audit
                      </CardTitle>
                      <CardDescription>
                        Only allowed decisions create commands. Command
                        acknowledgement never changes the access decision.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leftNode={<RefreshCw className="h-4 w-4" />}
                      onClick={() => commandsQuery.refetch()}
                      isLoading={commandsQuery.isFetching}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CommandHistory commands={commandsQuery.data || []} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {showSiteSetup && (
        <SiteSetupModal
          isPending={createSiteMutation.isPending}
          onClose={() => setShowSiteSetup(false)}
          onSave={(name) => createSiteMutation.mutate({ name })}
        />
      )}
      {showLaneSetup && sites.length > 0 && gates.length > 0 && (
        <LaneSetupModal
          sites={sites.map(({ site }) => site)}
          gates={gates}
          isPending={createLaneMutation.isPending}
          onClose={() => setShowLaneSetup(false)}
          onSave={(values) => createLaneMutation.mutate(values)}
        />
      )}
    </div>
  );
}
