"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  useCreateOrganization,
  useCheckSlugAvailability,
  generateSlugFromName,
} from "@/hooks/use-organization";

export default function CreateOrganizationPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const { createOrganization, isLoading, error, fieldErrors } = useCreateOrganization();
  const { checkSlug, isChecking } = useCheckSlugAvailability();

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      const generatedSlug = generateSlugFromName(formData.name);
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, slugManuallyEdited]);

  // Check slug availability when it changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.slug && formData.slug.length >= 2) {
        const available = await checkSlug(formData.slug);
        setSlugAvailable(available);
      } else {
        setSlugAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.slug, checkSlug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    if (errors.name) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.name;
        return updated;
      });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setFormData({ ...formData, slug: value });
    setSlugManuallyEdited(true);
    if (errors.slug) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.slug;
        return updated;
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Organization name is required";
    if (!formData.slug.trim()) newErrors.slug = "URL slug is required";
    if (formData.slug.length < 2) newErrors.slug = "Slug must be at least 2 characters";
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }
    if (slugAvailable === false) {
      newErrors.slug = "This slug is already taken";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    createOrganization({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
    });
  };

  const combinedErrors = { ...errors, ...fieldErrors };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-[rgb(var(--brand-primary,#213928))]/5 rounded-full blur-3xl pointer-events-none" />

      <Header type="select" />

      <main className="flex-1 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-lg mx-auto py-12 px-6 sm:py-20 lg:px-8 space-y-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/organizations"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Organizations
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50">
              <Building2 className="h-8 w-8 text-[rgb(var(--brand-primary,#213928))]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Create Organization
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium">
                Set up your new organization workspace
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  role="alert"
                  aria-live="assertive"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" aria-hidden="true" />
                  {error}
                </motion.div>
              )}

              {/* Organization Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Organization Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={handleNameChange}
                  error={combinedErrors.name}
                  disabled={isLoading}
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  URL Slug
                </label>
                <div className="relative">
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="acme-corp"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    error={combinedErrors.slug}
                    disabled={isLoading}
                    className="pr-10"
                    aria-describedby="slug-help"
                  />
                  {isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Checking slug availability">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    </div>
                  )}
                  {!isChecking && slugAvailable === true && formData.slug.length >= 2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Slug is available">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                  )}
                  {!isChecking && slugAvailable === false && formData.slug.length >= 2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Slug is already taken">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400" id="slug-help">
                  Your organization will be accessible at{" "}
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {formData.slug || "your-slug"}.{process.env.NEXT_PUBLIC_BASE_DOMAIN || "yourdomain.com"}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Description{" "}
                  <span id="description-help" className="text-zinc-400 dark:text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of your organization..."
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  disabled={isLoading}
                  rows={3}
                  aria-describedby="description-help"
                  className={cn(
                    "w-full rounded-xl border border-zinc-200 dark:border-zinc-800",
                    "bg-white dark:bg-zinc-950 px-4 py-3",
                    "text-sm text-zinc-900 dark:text-zinc-100",
                    "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary,#213928))]/50 focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "resize-none"
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || slugAvailable === false}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-600 relative z-10">
        <p>&copy; {new Date().getFullYear()} VMS Core. Enterprise Estate Management.</p>
      </footer>
    </div>
  );
}
