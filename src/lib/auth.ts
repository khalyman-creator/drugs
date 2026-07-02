import { cookies } from "next/headers";

const SESSION_COOKIE = "shop_admin_session";
const SESSION_VALUE = "authenticated_admin";

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionValue(): string {
  return SESSION_VALUE;
}
