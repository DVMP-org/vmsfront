"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCreateGatePass } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useResident } from "@/hooks/use-resident";
import { useProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Home as HomeIcon, ChevronDown, ChevronUp } from "lucide-react";

interface Visitor {
  name: string;
  email: string;
  phone: string;
}

export default function CreatePassPage() {
  const router = useRouter();
  const params = useParams<{ houseId?: string }>();
  const rawHouseId = params?.houseId;
  const routeHouseId = Array.isArray(rawHouseId) ? rawHouseId[0] : rawHouseId;
  const { selectedHouse, setSelectedHouse } = useAppStore();
  const { user } = useAuthStore();
  const { data: resident } = useResident();
  const { data: profile } = useProfile();
  const houseId = routeHouseId ?? selectedHouse?.id ?? null;
  const createPassMutation = useCreateGatePass(houseId);

  useEffect(() => {
    if (!routeHouseId || !profile?.houses) return;
    if (selectedHouse?.id === routeHouseId) return;
    const match = profile.houses.find((house) => house.id === routeHouseId);
    if (match) {
      setSelectedHouse(match);
    }
  }, [routeHouseId, profile?.houses, selectedHouse?.id, setSelectedHouse]);

  // Autofocus first field
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const [visitorName, setVisitorName] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([
    { name: "", email: "", phone: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  const addVisitor = () => {
    setVisitors([...visitors, { name: "", email: "", phone: "" }]);
  };

  const removeVisitor = (index: number) => {
    if (visitors.length > 1) {
      setVisitors(visitors.filter((_, i) => i !== index));
    }
  };

  const updateVisitor = (index: number, field: keyof Visitor, value: string) => {
    const updated = [...visitors];
    updated[index][field] = value;
    setVisitors(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!visitorName.trim()) newErrors.visitorName = "Visitor name is required";
    if (!validFrom) newErrors.validFrom = "Start date is required";
    if (!validTo) newErrors.validTo = "End date is required";
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      newErrors.validTo = "End date must be after start date";
    }

    // Advanced mode validation
    if (showAdvanced) {
      visitors.forEach((visitor, index) => {
        if (!visitor.name) newErrors[`visitor_${index}_name`] = "Name is required";
        if (!visitor.email) newErrors[`visitor_${index}_email`] = "Email is required";
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!houseId || !user || !resident) {
      return;
    }

    // Use fast mode data or advanced mode data
    const visitorData = showAdvanced
      ? visitors.filter(v => v.name && v.email)
      : [{ name: visitorName, email: "", phone: "" }];

    createPassMutation.mutate(
      {
        resident_id: resident.id,
        house_id: houseId,
        valid_from: new Date(validFrom).toISOString(),
        valid_to: new Date(validTo).toISOString(),
        max_uses: maxUses ? parseInt(maxUses) : undefined,
        visitors: visitorData,
      },
      {
        onSuccess: (response) => {
          const passId = response?.data?.id;
          if (passId) {
            router.push(`/house/${houseId}/passes/${passId}`);
          } else {
            router.push(`/house/${houseId}/passes`);
          }
        },
      }
    );
  };

  if (!houseId) {
    return (
      <>
        <div className="border border-zinc-200 rounded bg-white p-8">
          <EmptyState
            icon={HomeIcon}
            title="Select a house to continue"
            description="Choose a house from the dashboard selector before creating a pass."
            action={{
              label: "Choose House",
              onClick: () => router.push("/select"),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Compact Header */}
        <div className="border-b border-zinc-200 pb-3 mb-4">
          <h1 className="text-lg font-semibold text-zinc-900">Create Visitor Pass</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fast Mode: Essential Fields Only */}
          <div className="border border-zinc-200 rounded bg-white">
            <div className="p-4 space-y-3">
              <Input
                ref={nameInputRef}
                label="Visitor Name"
                placeholder="Enter visitor name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                error={errors.visitorName}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById("validFrom")?.focus();
                  }
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="validFrom"
                  type="datetime-local"
                  label="Valid From"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  error={errors.validFrom}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      document.getElementById("validTo")?.focus();
                    }
                  }}
                />
                <Input
                  id="validTo"
                  type="datetime-local"
                  label="Valid To"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  error={errors.validTo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      document.getElementById("submitBtn")?.click();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options (Collapsed) */}
          <div className="border border-zinc-200 rounded bg-zinc-50/30">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <span className="font-medium">Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            {showAdvanced && (
              <div className="border-t border-zinc-200 p-4 space-y-4">
                <Input
                  type="number"
                  label="Max Uses"
                  placeholder="Unlimited if empty"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  min="1"
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700">Multiple Visitors</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addVisitor}
                      className="h-7 text-xs"
                    >
                      Add Visitor
                    </Button>
                  </div>
                  {visitors.map((visitor, index) => (
                    <div key={index} className="border border-zinc-200 rounded p-3 space-y-2 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-600">Visitor {index + 1}</span>
                        {visitors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVisitor(index)}
                            className="text-xs text-zinc-400 hover:text-zinc-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <Input
                        label="Name"
                        placeholder="John Doe"
                        value={visitor.name}
                        onChange={(e) => updateVisitor(index, "name", e.target.value)}
                        error={errors[`visitor_${index}_name`]}
                      />
                      <Input
                        type="email"
                        label="Email"
                        placeholder="john@example.com"
                        value={visitor.email}
                        onChange={(e) => updateVisitor(index, "email", e.target.value)}
                        error={errors[`visitor_${index}_email`]}
                      />
                      <Input
                        type="tel"
                        label="Phone"
                        placeholder="+1234567890"
                        value={visitor.phone}
                        onChange={(e) => updateVisitor(index, "phone", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              id="submitBtn"
              type="submit"
              size="sm"
              isLoading={createPassMutation.isPending}
              className="h-9"
            >
              Create Pass
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
