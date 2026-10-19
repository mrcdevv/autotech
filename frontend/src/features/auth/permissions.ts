type CrudAction = "create" | "read" | "update" | "delete";

type CrudEntity =
  | "client"
  | "employee"
  | "vehicle"
  | "order"
  | "inspection"
  | "estimate"
  | "delivery_note"
  | "payment"
  | "appointment";

/** Permission codes granted by the backend (see docs/specs/14-autorizacion-roles.md). */
export type PermissionCode =
  | `${CrudAction}_${CrudEntity}`
  | "view_reports"
  | "manage_config"
  | "manage_services"
  | "manage_products"
  | "manage_roles";

/** Any of these grants access to the settings page (each card checks its own code). */
export const SETTINGS_PERMISSIONS: PermissionCode[] = ["manage_config", "manage_services", "manage_roles"];
