import type { Role } from "../api/auth";

export const homeForRole = (role: Role) =>
  role === "ADMIN" ? "/admin" : role === "EMPLOYER" ? "/employer" : "/worker";
