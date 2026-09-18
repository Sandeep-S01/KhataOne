export type FirmRole = string | null | undefined;

const operationalMutationRoles = ["owner", "admin", "staff"];

export function canMutateFirmData(role: FirmRole) {
  return Boolean(role && operationalMutationRoles.includes(role));
}

export const canManageClients = canMutateFirmData;
export const canReviewTransactions = canMutateFirmData;
export const canCorrectLedgerEntries = canMutateFirmData;
export const canGenerateGstSummaries = canMutateFirmData;
export const canCreateExports = canMutateFirmData;
export const canRunOperationsJobs = canMutateFirmData;

export function canManageFirmProfile(role: FirmRole) {
  return role === "owner" || role === "admin";
}

export const canManageFirmMembers = canManageFirmProfile;

export const readOnlyRoleMessage =
  "Your workspace role is read-only. You can inspect records, but owner, admin or staff access is required for changes.";
