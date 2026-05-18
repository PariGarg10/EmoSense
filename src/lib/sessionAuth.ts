/**
 * Browser-only auth for demos and local accounts (no confirmation email).
 * Not for production security — passwords stored in plain text for local accounts.
 */

export const DEMO_EMAIL = "demo@emosense.local";
export const DEMO_PASSWORD = "demo1234";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const KEY_DEMO = "emosense-demo-session";
const KEY_LOCAL = "emosense-local-session";
const KEY_ACCOUNTS = "emosense-local-accounts";

export type LocalSession = {
  kind: "local";
  id: string;
  email: string;
  displayName?: string;
};

export function isDemoSession(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(KEY_DEMO) === "1";
}

export function setDemoSession(): void {
  sessionStorage.setItem(KEY_DEMO, "1");
}

export function getLocalSession(): LocalSession | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY_LOCAL);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as LocalSession;
    if (v?.kind === "local" && v.email && v.id) return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setLocalSession(session: LocalSession): void {
  sessionStorage.setItem(KEY_LOCAL, JSON.stringify(session));
}

export function clearBrowserAuth(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY_DEMO);
  sessionStorage.removeItem(KEY_LOCAL);
}

export function tryDemoLogin(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function demoUser() {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    displayName: "Demo user",
  };
}

type StoredLocalAccount = {
  id: string;
  email: string;
  password: string;
  displayName?: string;
};

function readAccounts(): StoredLocalAccount[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_ACCOUNTS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredLocalAccount[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredLocalAccount[]) {
  localStorage.setItem(KEY_ACCOUNTS, JSON.stringify(accounts));
}

export function registerLocalAccount(
  email: string,
  password: string,
  displayName?: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password.length < 6) {
    return { ok: false, error: "Email and password (6+ characters) are required." };
  }
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    return { ok: false, error: "That email is already registered on this device. Sign in instead." };
  }
  const id = crypto.randomUUID();
  accounts.push({
    id,
    email: normalized,
    password,
    displayName: displayName?.trim() || undefined,
  });
  writeAccounts(accounts);
  return { ok: true };
}

export function verifyLocalLogin(
  email: string,
  password: string,
): StoredLocalAccount | null {
  const normalized = email.trim().toLowerCase();
  const acc = readAccounts().find((a) => a.email === normalized);
  if (!acc || acc.password !== password) return null;
  return acc;
}
