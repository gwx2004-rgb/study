// Local-only user profile store (MVP, no backend).

export type AgeGroup = "under18" | "18-25" | "26-35" | "36+";
export type Gender = "male" | "female" | "na";
export type CEFR = "beginner" | "intermediate" | "advanced";
export type DifficultyPref = "auto" | "beginner" | "intermediate" | "advanced";

export type ExamKind =
  | "TOEFL"
  | "IELTS"
  | "CET-4"
  | "CET-6"
  | "TEM-4"
  | "TEM-8"
  | "GRE"
  | "QUICK_TEST"
  | "NONE";

export interface UserProfile {
  userId: string;
  username: string;
  ageGroup: AgeGroup;
  gender: Gender;
  englishLevel: CEFR;
  originalScore: ExamKind;
  originalScoreDetail?: string;
  learningGoals: string[];
  customDifficulty: DifficultyPref;
  createdAt: number;
}

const LEGACY_USER_KEY = "ial.user";
const SESSION_KEY = "ial.session";

export function isBrowser() {
  return typeof window !== "undefined";
}

/** 用于存储 key，忽略大小写与首尾空格 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function profileStorageKey(username: string): string {
  return `ial.user.v1.${normalizeUsername(username)}`;
}

/** 登录态仅保存在当前标签页，关闭浏览器后需重新登录 */
function sessionStore(): Storage | null {
  if (!isBrowser()) return null;
  return window.sessionStorage;
}

function clearLegacySession() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getSession(): { username: string } | null {
  clearLegacySession();
  const store = sessionStore();
  if (!store) return null;
  try {
    const raw = store.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getActiveUsername(): string | null {
  return getSession()?.username?.trim() ?? null;
}

export function setSession(username: string) {
  const store = sessionStore();
  if (!store) return;
  clearLegacySession();
  store.setItem(SESSION_KEY, JSON.stringify({ username: username.trim() }));
}

export function clearSession() {
  const store = sessionStore();
  if (!store) return;
  store.removeItem(SESSION_KEY);
  clearLegacySession();
}

function readProfileFromKey(key: string): UserProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function migrateLegacyProfile(username: string): UserProfile | null {
  const legacy = readProfileFromKey(LEGACY_USER_KEY);
  if (!legacy) return null;
  if (normalizeUsername(legacy.username) !== normalizeUsername(username)) return null;
  const key = profileStorageKey(username);
  try {
    localStorage.setItem(key, JSON.stringify(legacy));
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    return legacy;
  }
  return legacy;
}

export function getProfileForUsername(username: string): UserProfile | null {
  const trimmed = username.trim();
  if (!trimmed) return null;
  const key = profileStorageKey(trimmed);
  const stored = readProfileFromKey(key);
  if (stored) return stored;
  return migrateLegacyProfile(trimmed);
}

export function hasStoredProfile(username: string): boolean {
  return getProfileForUsername(username) !== null;
}

export function getProfile(): UserProfile | null {
  const username = getActiveUsername();
  if (!username) return null;
  const profile = getProfileForUsername(username);
  if (!profile) return null;
  if (normalizeUsername(profile.username) !== normalizeUsername(username)) {
    return null;
  }
  return profile;
}

export function saveProfile(profile: UserProfile) {
  if (!isBrowser()) return;
  const key = profileStorageKey(profile.username);
  try {
    localStorage.setItem(key, JSON.stringify(profile));
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (err) {
    console.error("saveProfile failed", err);
    throw new Error("无法保存用户资料，请检查浏览器存储权限");
  }
}

export function updateProfile(patch: Partial<UserProfile>) {
  const current = getProfile();
  if (!current) return;
  saveProfile({ ...current, ...patch });
}

export function effectiveDifficulty(p: UserProfile): CEFR {
  if (p.customDifficulty !== "auto") return p.customDifficulty;
  return p.englishLevel;
}
