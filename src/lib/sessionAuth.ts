/**
 * Browser-side session handling for the three sign-in modes:
 * - demo: shared demo user, data stays in this browser
 * - local: device-only account (hashed password in localStorage)
 * - supabase: cloud account; Supabase persists its own tokens, we only
 *   remember which mode is active.
 */

export const DEMO_EMAIL = "demo@emosense.local";
export const DEMO_PASSWORD = "demo1234";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const KEY_SESSION = "emosense-session";
const KEY_ACCOUNTS = "emosense-local-accounts";
const LEGACY_KEYS = [
  "emosense-demo-session",
  "emosense-local-session",
  "emosense-supabase-session",
  "emosense-auth-kind",
];

const PBKDF2_ITERATIONS = 150_000;
export const MIN_PASSWORD_LENGTH = 8;

export type AuthKind = "demo" | "local" | "supabase";

export type BrowserSession = {
  kind: AuthKind;
  id: string;
  email?: string;
  displayName?: string;
};

function storages(): Storage[] {
  if (typeof window === "undefined") return [];
  const out: Storage[] = [];
  try {
    out.push(window.localStorage);
  } catch {
    /* blocked */
  }
  try {
    out.push(window.sessionStorage);
  } catch {
    /* blocked */
  }
  return out;
}

function isSession(v: unknown): v is BrowserSession {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    (s.kind === "demo" || s.kind === "local" || s.kind === "supabase") &&
    typeof s.id === "string" &&
    s.id.length > 0
  );
}

export function getSession(): BrowserSession | null {
  for (const store of storages()) {
    const raw = store.getItem(KEY_SESSION);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSession(parsed)) return parsed;
    } catch {
      /* ignore corrupt value */
    }
  }
  return null;
}

/**
 * Persist the active session. `remember` keeps it across browser restarts;
 * otherwise it lasts until this tab closes.
 */
export function saveSession(session: BrowserSession, remember = true): void {
  clearSession();
  const [local, tab] = storages();
  const target = remember ? local : (tab ?? local);
  target?.setItem(KEY_SESSION, JSON.stringify(session));
}

/** Patch the stored session in place, keeping its storage (remembered or tab-only). */
export function updateSession(patch: Partial<Omit<BrowserSession, "kind" | "id">>): void {
  for (const store of storages()) {
    const raw = store.getItem(KEY_SESSION);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSession(parsed)) store.setItem(KEY_SESSION, JSON.stringify({ ...parsed, ...patch }));
    } catch {
      /* ignore */
    }
  }
}

export function clearSession(): void {
  for (const store of storages()) {
    store.removeItem(KEY_SESSION);
    for (const key of LEGACY_KEYS) store.removeItem(key);
  }
}

export function getAuthKind(): AuthKind | null {
  return getSession()?.kind ?? null;
}

export function tryDemoLogin(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function demoUser(): BrowserSession {
  return {
    kind: "demo",
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    displayName: "Demo user",
  };
}

export function isDemoUserId(id: string | undefined): boolean {
  return id === DEMO_USER_ID;
}

/* ---------- device-only accounts ---------- */

type StoredLocalAccount = {
  id: string;
  email: string;
  displayName?: string;
  passwordHash?: string;
  salt?: string;
  /** Legacy plaintext field from earlier versions; migrated on next sign-in. */
  password?: string;
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

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Use at least one letter and one number in your password.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : "Enter a valid email address.";
}

export function hasLocalAccount(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return readAccounts().some((a) => a.email === normalized);
}

export async function registerLocalAccount(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ ok: true; session: BrowserSession } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const emailError = validateEmail(normalized);
  if (emailError) return { ok: false, error: emailError };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const accounts = readAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    return {
      ok: false,
      error: "That email is already registered on this device. Sign in instead.",
    };
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account: StoredLocalAccount = {
    id: crypto.randomUUID(),
    email: normalized,
    displayName: displayName?.trim() || undefined,
    salt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
  };
  writeAccounts([...accounts, account]);
  return {
    ok: true,
    session: {
      kind: "local",
      id: account.id,
      email: account.email,
      displayName: account.displayName,
    },
  };
}

export async function verifyLocalLogin(
  email: string,
  password: string,
): Promise<BrowserSession | null> {
  const normalized = email.trim().toLowerCase();
  const accounts = readAccounts();
  const acc = accounts.find((a) => a.email === normalized);
  if (!acc) return null;

  let ok = false;
  if (acc.passwordHash && acc.salt) {
    ok = constantTimeEqual(await hashPassword(password, fromBase64(acc.salt)), acc.passwordHash);
  } else if (typeof acc.password === "string") {
    ok = constantTimeEqual(acc.password, password);
    if (ok) {
      // Upgrade legacy plaintext storage to a salted hash.
      const salt = crypto.getRandomValues(new Uint8Array(16));
      acc.salt = toBase64(salt);
      acc.passwordHash = await hashPassword(password, salt);
      delete acc.password;
      writeAccounts(accounts);
    }
  }
  if (!ok) return null;

  return {
    kind: "local",
    id: acc.id,
    email: acc.email,
    displayName: acc.displayName,
  };
}

export async function changeLocalPassword(
  id: string,
  currentPassword: string,
  nextPassword: string,
): Promise<string | null> {
  const accounts = readAccounts();
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return "Account not found on this device.";
  const verified = await verifyLocalLogin(acc.email, currentPassword);
  if (!verified) return "Current password is incorrect.";
  const passwordError = validatePassword(nextPassword);
  if (passwordError) return passwordError;

  const fresh = readAccounts();
  const target = fresh.find((a) => a.id === id);
  if (!target) return "Account not found on this device.";
  const salt = crypto.getRandomValues(new Uint8Array(16));
  target.salt = toBase64(salt);
  target.passwordHash = await hashPassword(nextPassword, salt);
  delete target.password;
  writeAccounts(fresh);
  return null;
}

export function updateLocalDisplayName(id: string, displayName: string): void {
  const accounts = readAccounts();
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return;
  acc.displayName = displayName.trim() || undefined;
  writeAccounts(accounts);
}

export function deleteLocalAccount(id: string): void {
  writeAccounts(readAccounts().filter((a) => a.id !== id));
}
