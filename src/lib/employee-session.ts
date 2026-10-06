import { supabase } from "@/integrations/supabase/client";

export const EMPLOYEE_SESSION_KEY = "boutikbf-employee-session";

export type EmployeeRole =
  "caissier" | "gerant" | "comptable" | "magasinier" | "commercial" | "superviseur";

export type EmployeeSession = {
  token: string;
  employeeId: string;
  name: string;
  role: EmployeeRole;
  shopId: string;
  expiresAt: string;
};

/** Anciens noms de rôles (cashier, manager, accountant) → noms actuels. */
export function normalizeRole(role: string | null | undefined): EmployeeRole {
  switch ((role ?? "").toLowerCase()) {
    case "gerant":
    case "manager":
      return "gerant";
    case "comptable":
    case "accountant":
      return "comptable";
    case "magasinier":
      return "magasinier";
    case "commercial":
      return "commercial";
    case "superviseur":
      return "superviseur";
    default:
      return "caissier";
  }
}

/** Session employé valide (non expirée) ou null. Efface les sessions invalides / anciennes. */
export function getEmployeeSession(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EMPLOYEE_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<EmployeeSession>;
    if (!s.token || !s.name || !s.shopId || !s.expiresAt || new Date(s.expiresAt) <= new Date()) {
      localStorage.removeItem(EMPLOYEE_SESSION_KEY);
      return null;
    }
    return { ...(s as EmployeeSession), role: normalizeRole(s.role) };
  } catch {
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    return null;
  }
}

export type EmployeeLoginResult =
  | { ok: true; session: EmployeeSession }
  | { ok: false; error: "invalid_credentials" | "too_many_attempts" | "network" };

export async function employeeLogin(name: string, pin: string): Promise<EmployeeLoginResult> {
  const { data, error } = await (supabase as any).rpc("employee_login", {
    p_name: name,
    p_pin: pin,
  });
  if (error || !data) return { ok: false, error: "network" };
  if (!data.ok) {
    return {
      ok: false,
      error: data.error === "too_many_attempts" ? "too_many_attempts" : "invalid_credentials",
    };
  }
  const session: EmployeeSession = {
    token: data.token,
    employeeId: data.employee.id,
    name: data.employee.name,
    role: normalizeRole(data.employee.role),
    shopId: data.employee.shop_id,
    expiresAt: data.expires_at,
  };
  localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export async function employeeLogout(): Promise<void> {
  const s = getEmployeeSession();
  localStorage.removeItem(EMPLOYEE_SESSION_KEY);
  if (s) {
    try {
      await (supabase as any).rpc("employee_logout", { p_token: s.token });
    } catch {
      // le jeton expirera de toute façon
    }
  }
}
