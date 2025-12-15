/**
 * Leave Management Types
 * Aligned with backend v2.0 API
 */

export type LeaveStatus =
  | "PENDING" // Initial status when employee applies
  | "PROCESSING" // Approved by Line Manager (Step 1), awaiting HR approval (Step 2)
  | "APPROVED" // Final approval by HR (Step 2), balance deducted
  | "REJECTED" // Rejected at any step
  | "HOLD" // On hold status
  | "CANCELLED"; // Cancelled after approval

export type LeaveApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveAmendmentType = "AMEND" | "CANCEL";

export type AccrualFrequency =
  | "WEEKLY"
  | "SEMI_MONTHLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export type AccrualStrategy = "FIXED" | "TENURE_BASED";

/**
 * Get user-friendly status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PROCESSING: "In Progress",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    HOLD: "On Hold",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

/**
 * Get status badge variant for UI
 */
export function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default";
    case "PROCESSING":
      return "secondary";
    case "REJECTED":
    case "CANCELLED":
      return "destructive";
    case "PENDING":
    case "HOLD":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get status description for UI
 */
export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    PENDING: "Awaiting Line Manager approval (Step 1)",
    PROCESSING: "Approved by Line Manager, awaiting HR approval (Step 2)",
    APPROVED: "Approved by HR, balance deducted",
    REJECTED: "Request rejected",
    HOLD: "Request on hold",
    CANCELLED: "Request cancelled",
  };
  return descriptions[status] || "";
}

/**
 * Check if status can be approved/rejected by manager
 */
export function canManagerApprove(status: string): boolean {
  return status === "PENDING";
}

/**
 * Check if status can be approved/rejected by HR
 */
export function canHRApprove(status: string): boolean {
  return status === "PROCESSING";
}

/**
 * Get next status after manager approval
 */
export function getNextStatusAfterManagerApproval(): LeaveStatus {
  return "PROCESSING";
}

/**
 * Get next status after HR approval
 */
export function getNextStatusAfterHRApproval(): LeaveStatus {
  return "APPROVED";
}
