// Fake auth: just a localStorage-backed username. No passwords, no sync.

export type SavedPlan = {
  id: string;
  cafe: string;
  hood: string;
  photo: string;
  date: string;
  time: string;
  group: string;
  inviteUrl: string;
  createdAt: number;
};

const USER_KEY = "hw:user";
const PLANS_KEY_PREFIX = "hw:plans:";

export function getUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function setUser(name: string) {
  localStorage.setItem(USER_KEY, name);
}

export function signOut() {
  localStorage.removeItem(USER_KEY);
}

export function getPlans(user: string): SavedPlan[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PLANS_KEY_PREFIX + user);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePlan(user: string, plan: SavedPlan) {
  const existing = getPlans(user);
  const next = [plan, ...existing].slice(0, 20); // cap at 20
  localStorage.setItem(PLANS_KEY_PREFIX + user, JSON.stringify(next));
}
