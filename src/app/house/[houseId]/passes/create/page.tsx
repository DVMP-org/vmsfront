"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCreateGatePass } from "@/hooks/use-resident";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useResident } from "@/hooks/use-resident";
import { useProfile } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Trash2, Home as HomeIcon } from "lucide-react";

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

  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([
    { name: "", email: "", phone: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!validFrom) newErrors.validFrom = "Start date is required";
    if (!validTo) newErrors.validTo = "End date is required";
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      newErrors.validTo = "End date must be after start date";
    }

    visitors.forEach((visitor, index) => {
      if (!visitor.name) newErrors[`visitor_${index}_name`] = "Name is required";
      if (!visitor.email) newErrors[`visitor_${index}_email`] = "Email is required";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!houseId || !user || !resident) {
      return;
    }

    createPassMutation.mutate(
      {
        resident_id: resident.id,
        house_id: houseId,
        valid_from: new Date(validFrom).toISOString(),
        valid_to: new Date(validTo).toISOString(),
        max_uses: maxUses ? parseInt(maxUses) : undefined,
        visitors: visitors.filter(v => v.name && v.email),
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
      <DashboardLayout type="resident">
        <Card>
          <CardContent className="p-10">
            <EmptyState
              icon={HomeIcon}
              title="Select a house to continue"
              description="Choose a house from the dashboard selector before creating a pass."
              action={{
                label: "Choose House",
                onClick: () => router.push("/select"),
              }}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="resident">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Visitor Pass</h1>
          <p className="text-muted-foreground">
            Generate a new pass for your visitors
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Pass Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  label="Valid From"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  error={errors.validFrom}
                />
                <Input
                  type="datetime-local"
                  label="Valid To"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  error={errors.validTo}
                />
              </div>

              {/* Max Uses */}
              <Input
                type="number"
                label="Max Uses (Optional)"
                placeholder="Unlimited if not specified"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />

              {/* Visitors */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Visitors</h3>
                  <Button type="button" size="sm" onClick={addVisitor}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Visitor
                  </Button>
                </div>

                {visitors.map((visitor, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Visitor {index + 1}</h4>
                        {visitors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVisitor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        label="Name"
                        placeholder="John Doe"
                        value={visitor.name}
                        onChange={(e) =>
                          updateVisitor(index, "name", e.target.value)
                        }
                        error={errors[`visitor_${index}_name`]}
                      />
                      <Input
                        type="email"
                        label="Email"
                        placeholder="john@example.com"
                        value={visitor.email}
                        onChange={(e) =>
                          updateVisitor(index, "email", e.target.value)
                        }
                        error={errors[`visitor_${index}_email`]}
                      />
                      <Input
                        type="tel"
                        label="Phone (Optional)"
                        placeholder="+1234567890"
                        value={visitor.phone}
                        onChange={(e) =>
                          updateVisitor(index, "phone", e.target.value)
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createPassMutation.isPending}>
                  Create Pass
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
