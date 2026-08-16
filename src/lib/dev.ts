export const DEV_ADMIN_ID = "dev-admin-001";
export const DEV_ADMIN_NAME = "Dev Admin";

/** Sadece development + DEV_BYPASS=1 iken açık. Production'da asla. */
export function isDevBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_BYPASS === "1" || process.env.DEV_BYPASS === "true")
  );
}
