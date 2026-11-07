import { createCookieUtilities } from "@vms/api-client/cookies";

const cookies = createCookieUtilities({
  baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN || "",
});

export const setCookie = cookies.setCookie;
export const getCookie = cookies.getCookie;
export const deleteCookie = cookies.deleteCookie;
