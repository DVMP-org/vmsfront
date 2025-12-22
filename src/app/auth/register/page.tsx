"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { Home } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isRegistering, registerError, registerFieldErrors, clearAuthErrors } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[e.target.name];
        return updated;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    clearAuthErrors();
    const { confirmPassword, ...registerData } = formData;
    register(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-var(--brand-primary)/10 via-background to-var(--brand-secondary)/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Home className="h-8 w-8 text-var(--brand-primary)" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {registerError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {registerError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="first_name"
                label="First Name"
                placeholder="John"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name || registerFieldErrors.first_name}
              />
              <Input
                type="text"
                name="last_name"
                label="Last Name"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name || registerFieldErrors.last_name}
              />
            </div>
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email || registerFieldErrors.email}
            />
            <Input
              type="tel"
              name="phone"
              label="Phone (Optional)"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
              error={registerFieldErrors.phone}
            />
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password || registerFieldErrors.password}
            />
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={
                errors.confirmPassword ||
                registerFieldErrors.confirmPassword ||
                registerFieldErrors.password
              }
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={isRegistering}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-var(--brand-primary) hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
