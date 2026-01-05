"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAdminHouses, useAdminUsers, useCreateResident } from "@/hooks/use-admin";
import { toast } from "sonner";
import { Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateResidentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    user_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    email: "",
  });
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedHouseSlugs, setselectedHouseSlugs] = useState<string[]>([]);

  const { data: housesData, isLoading: housesLoading } = useAdminHouses({
    page: 1,
    pageSize: 100,
  });
  const createResident = useCreateResident();
  const { data: users, isLoading: usersLoading } = useAdminUsers();

  const handleHouseToggle = (houseSlug: string) => {
    setselectedHouseSlugs((prev) =>
      prev.includes(houseSlug)
        ? prev.filter((slug) => slug !== houseSlug)
        : [...prev, houseSlug]
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "existing" && !form.user_id.trim()) {
      toast.error("Select an existing user.");
      return;
    }

    if (mode === "new" && !form.email.trim()) {
      toast.error("Email is required for a new resident.");
      return;
    }

    if (selectedHouseSlugs.length === 0) {
      toast.error("Select at least one house.");
      return;
    }

    const payload = {
      ...form,
      user_id: mode === "existing" ? form.user_id.trim() : "",
      email:
        mode === "existing"
          ? sortedUsers.find((user) => user.id === form.user_id)?.email
          : form.email.trim(),
      house_slugs: selectedHouseSlugs,
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    };

    createResident.mutate(
      payload,
      {
        onSuccess: () => {
          router.push("/admin/residents");
        },
      }
    );
  };

  const houses = useMemo(
    () => housesData?.items ?? [],
    [housesData?.items]
  );
  const sortedHouses = useMemo(
    () =>
      houses.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [houses]
  );

  const sortedUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    return [...users].sort((a, b) => {
      const nameA =
        [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email;
      const nameB =
        [b.first_name, b.last_name].filter(Boolean).join(" ") || b.email;
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  const selectedUser = useMemo(() => {
    if (!form.user_id) return null;
    return sortedUsers.find((user) => user.id === form.user_id) || null;
  }, [form.user_id, sortedUsers]);

  useEffect(() => {
    if (mode === "existing" && selectedUser) {
      setForm((prev) => ({
        ...prev,
        first_name: selectedUser.first_name || "",
        last_name: selectedUser.last_name || "",
        email: selectedUser.email || "",
      }));
    } else if (mode === "new") {
      setForm((prev) => ({
        ...prev,
        user_id: "",
        first_name: "",
        last_name: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, mode]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Link href="/admin/residents" className="text-primary hover:underline">
                Residents
              </Link>
              <span>/</span>
              <span>Create</span>
            </p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Add Resident
            </h1>
            <p className="text-muted-foreground">
              Promote an existing user into a resident profile and link their homes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/residents")}
          >
            Back to residents
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resident details</CardTitle>
            <CardDescription>
              Provide the user identifier and optional profile updates. Houses will determine their access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-wrap gap-3">
                  {(["existing", "new"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                        mode === value
                          ? "border-[var(--brand-primary,#213928)] bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {value === "existing" ? "Use existing user" : "Create new user"}
                    </button>
                  ))}
                </div>

                {mode === "existing" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Select user
                    </label>
                    {usersLoading ? (
                      <p className="text-sm text-muted-foreground">Loading users...</p>
                    ) : sortedUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No users available. Onboard a user first.
                      </p>
                    ) : (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={form.user_id}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, user_id: event.target.value }))
                        }
                        required
                      >
                        <option value="" disabled>
                          Choose an existing user
                        </option>
                        {sortedUsers.map((userOption) => (
                          <option key={userOption.id} value={userOption.id}>
                            {([userOption.first_name, userOption.last_name]
                              .filter(Boolean)
                              .join(" ") || userOption.email) +
                              " • " +
                              userOption.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : null}
              </div>

              {mode === "new" && (
                <Input
                  label="Resident email"
                  type="email"
                  placeholder="resident@example.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />

              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="First name"
                  placeholder="Optional override"
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, first_name: event.target.value }))
                  }
                />
                <Input
                  label="Last name"
                  placeholder="Optional override"
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, last_name: event.target.value }))
                  }
                />
              </div>


              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Phone"
                  placeholder="+234 810 000 0000"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                <Input
                  label="Address"
                  placeholder="Apartment 5B, Riverside"
                  value={form.address}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Associate houses</p>
                    <p className="text-xs text-muted-foreground">
                      Select one or more houses that the resident should belong to.
                    </p>
                  </div>
                </div>
                {housesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading houses...</p>
                ) : sortedHouses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No houses found. Create a house first.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sortedHouses.map((house) => {
                      const slug = house.slug;
                      const isSelectable = Boolean(slug);
                      return (
                        <Checkbox
                          key={house.id}
                          label={house.name}
                          description={house.address}
                          checked={slug ? selectedHouseSlugs.includes(slug) : false}
                          disabled={!isSelectable}
                          onChange={() => slug && handleHouseToggle(slug)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/residents")}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createResident.isPending}>
                  Create resident
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
