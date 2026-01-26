import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import {
  LoginRequest,
  RegisterRequest,
  UserProfile,
  DashboardSelect,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
} from "@/types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/error-utils";

function getRedirectFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("redirect_to");
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      if (parsed.origin !== window.location.origin) {
        return null;
      }
      return parsed.pathname + parsed.search + parsed.hash;
    }

    return raw.startsWith("/") ? raw : null;
  } catch {
    return null;
  }
}

function clearRedirectQueryParam() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("redirect_to");
  const sanitized = url.pathname + (url.search || "") + (url.hash || "");
  window.history.replaceState(null, "", sanitized);
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginFieldErrors, setLoginFieldErrors] = useState<
    Record<string, string>
  >({});
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerFieldErrors, setRegisterFieldErrors] = useState<
    Record<string, string>
  >({});

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      setLoginError(null);
      setLoginFieldErrors({});
    },
    onSuccess: (response) => {
      const { user, token } = response.data;

      // Set auth state
      setAuth(user, token);
      toast.success("Login successful!");
      setLoginError(null);
      setLoginFieldErrors({});

      // Navigate immediately without setTimeout
      const redirectTarget = getRedirectFromQuery();
      if (redirectTarget) {
        clearRedirectQueryParam();
        router.refresh();
        router.replace(redirectTarget);
      } else {
        router.replace("/select");
      }
      console.log("router.push called");
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      const parsedError = parseApiError(error);
      setLoginError(parsedError.message);
      setLoginFieldErrors(parsedError.fieldErrors);
      toast.error(parsedError.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onMutate: () => {
      setRegisterError(null);
      setRegisterFieldErrors({});
    },
    onSuccess: (response) => {
      console.log("Register response:", response);
      const { user, token } = response.data;

      // Set auth state
      setAuth(user, token);
      console.log("Auth state set after registration");

      toast.success("Registration successful!");
      setRegisterError(null);
      setRegisterFieldErrors({});

      // Navigate immediately
      console.log("Attempting to navigate to /select...");
      router.replace("/select");
      console.log("router.replace called");
    },
    onError: (error: any) => {
      console.error("Register error:", error);
      const parsedError = parseApiError(error);
      setRegisterError(parsedError.message);
      setRegisterFieldErrors(parsedError.fieldErrors);
      toast.error(parsedError.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      apiClient.clearToken();
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("vms_admin_profile");
      }
      toast.success("Logged out successfully");
      router.push("/auth/login");
    },
    onError: () => {
      // Still clear local state even if server logout fails
      clearAuth();
      apiClient.clearToken();
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("vms_admin_profile");
      }
      router.push("/auth/login");
    },
  });

  const login = (data: LoginRequest) => loginMutation.mutate(data);
  const register = (data: RegisterRequest) => registerMutation.mutate(data);
  const logout = () => logoutMutation.mutate();

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError,
    loginFieldErrors,
    registerError,
    registerFieldErrors,
    clearAuthErrors: () => {
      setLoginError(null);
      setLoginFieldErrors({});
      setRegisterError(null);
      setRegisterFieldErrors({});
    },
  };
}

export function useProfile() {
  const { setAuth, token } = useAuthStore();
  return useQuery<AuthResponse["user"]>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const response = await authService.getUser();
      const user = response.data;
      if (user && token) {
        setAuth(user, token);
      }
      return user;
    },
    enabled: !!token,
  });
}

export function useVerifyToken() {
  return useQuery<AuthResponse>({
    queryKey: ["auth", "verify"],
    queryFn: async () => {
      const response = await authService.verifyToken();
      return response.data;
    },
    enabled: useAuthStore.getState().isAuthenticated,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      authService.forgotPassword(data),
    onSuccess: () => {
      toast.success(
        "If an account exists for that email, a reset link has been sent.",
      );
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Unable to send reset link");
    },
  });
}

export function useResetPassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      onSuccess?.();
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Unable to reset password");
    },
  });
}

export function useOnboard() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => authService.onboard(data),
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      apiClient.setToken(token);
      queryClient.invalidateQueries({ queryKey: ["resident", "me"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "select"] });

      toast.success("Onboarding complete! Welcome.");
      router.push("/select");
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Failed to complete onboarding");
    },
  });
}

export function useSocialLogin() {
  return useMutation({
    mutationFn: (provider: string) => authService.getSocialLoginUrl(provider),
    onSuccess: (response) => {
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Failed to initialize social login");
    },
  });
}

export function useSocialCallback() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, code }: { provider: string; code: string }) =>
      authService.socialCallback(provider, code),
    onSuccess: (response) => {
      const { user, token } = response.data;
      setAuth(user, token);
      apiClient.setToken(token);
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });

      toast.success("Login successful!");
      router.replace("/select");
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Social login failed");
      router.replace("/auth/login");
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => authService.resendVerification(),
    onSuccess: (response) => {
      toast.success(response.message || "Verification email sent!");
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Failed to resend verification email");
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: ({ token }: { token: string }) =>
      authService.verifyEmail(token),
    onSuccess: (response) => {
      toast.success(response.message || "Email verified successfully!");
    },
    onError: (error: any) => {
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || "Failed to verify email");
    },
  });


}

