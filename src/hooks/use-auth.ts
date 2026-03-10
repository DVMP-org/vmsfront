import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { resetAuthenticatedUserCaches } from "@/lib/client-cache";
import { getCookie } from "@/lib/cookies";
import { buildRootDomainUrl, buildSubdomainUrl, getSubdomain } from "@/lib/subdomain-utils";
import {
  LoginRequest,
  RegisterRequest,
  UserProfile,
  DashboardSelect,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  User,
  CurrentUser,
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

function getOrganizationSlugForRedirect(): string | null {
  if (typeof window === "undefined") return null;

  return getSubdomain() || getCookie("selected-organization") || null;
}

function getPostLoginDestination(): string {
  if (typeof window === "undefined") return "/organizations";

  const redirectTarget = getRedirectFromQuery();

  if (redirectTarget) {
    try {
      const redirectUrl = new URL(redirectTarget, window.location.origin);
      const orgSlug =
        redirectUrl.searchParams.get("organization_slug") ||
        getOrganizationSlugForRedirect();

      if (orgSlug) {
        redirectUrl.searchParams.delete("organization_slug");
        const path =
          redirectUrl.pathname +
          (redirectUrl.search || "") +
          (redirectUrl.hash || "");

        return buildSubdomainUrl(orgSlug, path || "/select");
      }

      return redirectUrl.pathname + redirectUrl.search + redirectUrl.hash;
    } catch {
      return redirectTarget;
    }
  }

  const orgSlug = getOrganizationSlugForRedirect();
  if (orgSlug) {
    return buildSubdomainUrl(orgSlug, "/select");
  }

  return "/organizations";
}

function navigateAfterLogin(router: ReturnType<typeof useRouter>) {
  const destination = getPostLoginDestination();

  clearRedirectQueryParam();

  if (/^https?:\/\//i.test(destination)) {
    window.location.href = destination;
    return;
  }

  router.refresh();
  router.replace(destination);
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

      resetAuthenticatedUserCaches(queryClient);
      apiClient.setToken(token);

      // Set auth state
      setAuth(user, token);
      toast.success("Login successful!");
      setLoginError(null);
      setLoginFieldErrors({});

      navigateAfterLogin(router);
    },
    onError: (error: any) => {
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
      const { user, token } = response.data;

      resetAuthenticatedUserCaches(queryClient);
      apiClient.setToken(token);

      // Set auth state
      setAuth(user, token);

      toast.success("Registration successful!");
      setRegisterError(null);
      setRegisterFieldErrors({});

      // Navigate immediately to organizations page
      router.replace("/organizations");
    },
    onError: (error: any) => {
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
      resetAuthenticatedUserCaches(queryClient);
      apiClient.clearToken();
      if (typeof window !== "undefined") {
        toast.success("Logged out successfully");
        // Always redirect to root domain auth pages
        window.location.href = buildRootDomainUrl("/auth/login");
      }
    },
    onError: () => {
      // Still clear local state even if server logout fails
      clearAuth();
      resetAuthenticatedUserCaches(queryClient);
      apiClient.clearToken();
      if (typeof window !== "undefined") {
        // Always redirect to root domain auth pages
        window.location.href = buildRootDomainUrl("/auth/login");
      }
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
  return useQuery<CurrentUser["user"]>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const response = await authService.getUser();
      const { user, resident, staff, admin } = response.data;

      console.log("Fetched user profile:", response.data);
      // Merge the profile data with flags
      const userProfile = {
        ...user,
        resident: resident ?? null,
        staff: staff ?? null,
        admin: admin ?? null,
        is_resident: !!resident,
        is_staff: !!staff,
        is_admin: !!admin,
      };
      if (userProfile && token) {
        setAuth(userProfile, token);
      }
      return userProfile;
    },
    enabled: !!token,
  });
}

export function useVerifyToken() {
  const { isAuthenticated, _hasHydrated, token } = useAuthStore();
  
  return useQuery<User>({
    queryKey: ["auth", "verify"],
    queryFn: async () => {
      const response = await authService.verifyToken();
      return response.data;
    },
    enabled: _hasHydrated && (isAuthenticated || !!token),
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
      resetAuthenticatedUserCaches(queryClient);
      setAuth(user, token);
      apiClient.setToken(token);

      toast.success("Onboarding complete! Welcome.");
      router.push("/organizations");
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
      resetAuthenticatedUserCaches(queryClient);
      setAuth(user, token);
      apiClient.setToken(token);

      toast.success("Login successful!");
      navigateAfterLogin(router);
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
