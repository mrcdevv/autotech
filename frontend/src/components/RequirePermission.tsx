import { Outlet } from "react-router";

import { NoAccess } from "@/components/NoAccess";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { PermissionCode } from "@/features/auth/permissions";

interface RequirePermissionProps {
  /** A single code, or a list where any one of them grants access. */
  permission: PermissionCode | PermissionCode[];
}

/** Route guard: renders the nested routes only when the user holds the permission. */
export function RequirePermission({ permission }: RequirePermissionProps) {
  const { hasAnyPermission } = useAuth();
  const required = Array.isArray(permission) ? permission : [permission];

  return hasAnyPermission(required) ? <Outlet /> : <NoAccess />;
}
