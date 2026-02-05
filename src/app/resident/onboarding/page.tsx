"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Home, Plus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth-service";
import { apiClient } from "@/lib/api-client";
import { useResidentOnboarding } from "@/hooks/use-resident";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfile } from "@/types";
import { useAllResidencies } from "@/hooks/use-general";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/layout/Header";

const onboardingSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function ResidentOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const storedToken = useAuthStore((state) => state.token);
  const [profile, setProfile] = useState<{ user: UserProfile } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(
    storedToken || null,
  );
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [slugInput, setSlugInput] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      address: "",
    },
  });

  const tokenFromQuery = searchParams?.get("token");
  const effectiveToken = tokenFromQuery || storedToken;

  const residenciesQuery = useAllResidencies();
  const onboardingMutation = useResidentOnboarding();

  const handleSwitchAccount = () => {
    clearAuth();
    apiClient.clearToken();
    queryClient.clear();
    router.replace("/auth/login");
  };

  useEffect(() => {
    if (!effectiveToken) {
      setInitializing(false);
      return;
    }
    if (profileLoaded) {
      setInitializing(false);
      return;
    }

    let active = true;
    setInitializing(true);

    if (tokenFromQuery) {
      clearAuth();
    }

    const syncProfile = async () => {
      try {
        apiClient.setToken(effectiveToken);
        const response = await authService.getUser();
        const userProfile = response.data;
        if (!active) return;
        setAuth(userProfile, effectiveToken);
        setProfile({ user: userProfile });
        setAuthToken(effectiveToken);
        setProfileLoaded(true);
        queryClient.setQueryData(["dashboard", "select"], {
          user: userProfile,
        });
      } catch (error: any) {
        if (!active) return;
        const message =
          error?.response?.data?.detail ||
          "We were unable to verify your invitation. Please login again.";
        toast.error(message);
        clearAuth();
        apiClient.clearToken();
        queryClient.clear();
        router.replace("/auth/login");
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, [
    authToken,
    clearAuth,
    effectiveToken,
    profileLoaded,
    queryClient,
    router,
    setAuth,
  ]);

  useEffect(() => {
    if (!profile?.user) return;
    setValue("first_name", profile.user.first_name || "");
    setValue("last_name", profile.user.last_name || "");
    setValue("phone", profile.user.phone || "");
    setValue("address", profile.user.address || "");
  }, [profile, setValue]);

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const resolveResidencySlugs = () => {
    if (!selectedSlugs.length) {
      throw new Error("Add at least one residency slug to continue.");
    }

    const available = residenciesQuery.data || [];

    const unresolved: string[] = [];
    const slugs = selectedSlugs.map((slug) => {
      const trimmed = slug.trim();
      if (!trimmed) {
        throw new Error("Residency slugs cannot be empty.");
      }
      if (uuidPattern.test(trimmed)) {
        return trimmed;
      }
      const normalized = trimmed.toLowerCase();
      const match = available.find((residency) => {
        if (!residency) return false;
        const nameMatch = residency.name?.toLowerCase() === normalized;
        const slugMatch = residency.slug?.toLowerCase() === normalized;
        return slugMatch || nameMatch;
      });
      if (!match) {
        unresolved.push(trimmed);
        return trimmed;
      }
      return match.slug || "";
    });
    return { slugs, unresolved };
  };

  const alreadyOnboarded =
    profile?.user?.resident && profile.user.resident.onboarded;

  const suggestedResidencies = useMemo(() => {
    if (!residenciesQuery.data?.length) return [];
    return residenciesQuery.data.slice(0, 3);
  }, [residenciesQuery.data]);

  const handleAddSlug = () => {
    if (!slugInput.trim()) return;
    const entries = slugInput
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!entries.length) return;

    setSelectedSlugs((prev) => {
      const next = [...prev];
      for (const entry of entries) {
        const exists = next.some(
          (value) => value.toLowerCase() === entry.toLowerCase(),
        );
        if (!exists) {
          next.push(entry);
        }
      }
      return next;
    });
    setSlugInput("");
  };

  const onSubmit = (data: OnboardingFormData) => {
    if (!profile?.user?.id) {
      toast.error("We couldn't verify your account. Please login again.");
      router.replace("/auth/login");
      return;
    }

    try {
      const { slugs: residencySlugs, unresolved } = resolveResidencySlugs();
      if (unresolved.length > 0) {
        toast.info(
          `We'll submit ${unresolved.join(
            ", ",
          )} as provided. Your admin will still be able to validate the request.`,
        );
      }
      onboardingMutation.mutate(
        {
          user_id: profile.user.id,
          residency_slugs: residencySlugs,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address: data.address,
          email: profile.user.email,
        },
        {
          onSuccess: () => {
            toast.success(
              "Onboarding complete! Redirecting to your dashboard.",
            );
            router.refresh();
            router.replace("/select");
          },
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid residency data.",
      );
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/80 px-8 py-6 text-center shadow-xl">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary,#213928)]" />
          <p className="text-sm text-muted-foreground">
            Preparing your onboarding experience...
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>We need your invite link</CardTitle>
            <CardDescription>
              This page requires a valid onboarding link. Please open the link
              you received via email or request a new invitation from your
              estate admin.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push("/auth/login")}
            >
              Go to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header type="select" />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-[var(--brand-primary,#213928)]/5 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              Resident onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose the residency(s) you belong to using their public slug. We will
              link your verified account to the selected homes and unlock your
              dashboard.
            </p>
          </div>

          <Card className="border-[var(--brand-primary,#213928)]/10">
            {alreadyOnboarded ? (
              <>
                <CardHeader className="text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary,#213928)]/10 text-[var(--brand-primary,#213928)]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle>You're already onboarded</CardTitle>
                  <CardDescription>
                    Your account is linked to {profile?.user?.residencies?.length || 0}{" "}
                    residency{(profile?.user?.residencies?.length ?? 0) === 1 ? "" : "s"}.
                    Jump back into your dashboard to manage passes and visitors.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    className="w-full"
                    onClick={() => router.replace("/select")}
                  >
                    Continue to dashboard
                  </Button>
                </CardFooter>
              </>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <CardHeader className="space-y-2">
                  <CardTitle>Link your residencies</CardTitle>
                  <CardDescription>
                    Enter the slug (e.g.{" "}
                    <code className="rounded bg-muted px-1">oak-villa</code>)
                    provided by your estate admin. You can add multiple residencies if
                    needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Residency slug
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={slugInput}
                        onChange={(event) => setSlugInput(event.target.value)}
                        placeholder="eg. palm-residence"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[var(--brand-primary,#213928)] text-[var(--brand-primary,#213928)] hover:bg-[var(--brand-primary,#213928)]/10"
                        onClick={handleAddSlug}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste multiple slugs separated by commas or line breaks.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedSlugs.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No residencies added yet.
                        </span>
                      ) : (
                        selectedSlugs.map((slug) => (
                          <span
                            key={slug}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary,#213928)]/40 bg-[var(--brand-primary,#213928)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary,#213928)]"
                          >
                            {slug}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSlugs((prev) =>
                                  prev.filter(
                                    (value) =>
                                      value.toLowerCase() !== slug.toLowerCase(),
                                  ),
                                )
                              }
                              className="rounded-full bg-white/70 p-0.5 text-muted-foreground transition hover:text-foreground"
                              aria-label={`Remove ${slug}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {suggestedResidencies.length > 0 && (
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Popular residencies
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {suggestedResidencies.map((residency) => (
                          <button
                            type="button"
                            key={residency.slug}
                            className="rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-sm transition hover:border-[var(--brand-primary,#213928)] hover:bg-[var(--brand-primary,#213928)]/5"
                            onClick={() => {
                              setSelectedSlugs((prev) => {
                                const exists = prev.some(
                                  (value) =>
                                    value.toLowerCase() ===
                                    (residency.slug || residency.name).toLowerCase(),
                                );
                                if (exists) return prev;
                                return [
                                  ...prev,
                                  residency.slug || residency.name || residency.id,
                                ];
                              });
                            }}
                          >
                            <p className="font-semibold text-foreground">
                              {residency.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {residency.slug || "No slug available"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="First name"
                      {...register("first_name")}
                      error={errors.first_name?.message}
                    />
                    <Input
                      label="Last name"
                      {...register("last_name")}
                      error={errors.last_name?.message}
                    />
                    <Input
                      label="Phone number"
                      {...register("phone")}
                      error={errors.phone?.message}
                    />
                    <Input
                      label="Address"
                      {...register("address")}
                      error={errors.address?.message}
                    />
                  </div>

                  <div className="rounded-2xl border border-dashed border-[var(--brand-primary,#213928)]/40 bg-[var(--brand-primary,#213928)]/5 p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      Need your residency slug?
                    </p>
                    <p>
                      Ask your estate admin for the public slug or copy it from
                      your welcome email. It usually matches the friendly residency
                      URL (e.g.{" "}
                      <code className="rounded bg-muted px-1">green-court</code>).
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={selectedSlugs.length === 0}
                    isLoading={onboardingMutation.isPending}
                  >
                    Complete onboarding
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={handleSwitchAccount}
                  >
                    Use a different account
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>

          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 text-sm text-muted-foreground">
            <p>
              Having trouble? Contact your estate administrator and share this
              email:
            </p>
            <p className="mt-2 font-semibold text-foreground">
              {profile?.user?.email || "your-account-email"}
            </p>
          </div>
        </div>
      </div>
    </div>

  );
}
