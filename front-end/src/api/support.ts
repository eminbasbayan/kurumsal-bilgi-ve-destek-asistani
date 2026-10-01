import type {
  Priority,
  RequestStatus,
  StaffMember,
  SupportRequestDetail,
  SupportRequestListItem,
  SupportSummary,
} from "../types";
import { api } from "./client";

export type SupportQueue = "team" | "mine";

export type SupportRequestFilters = {
  queue?: SupportQueue;
  scope?: "all" | "open" | "closed";
  status?: RequestStatus | "all";
  priority?: Priority | "all";
  unassigned?: boolean;
  q?: string;
};

export function getSupportSummary(): Promise<SupportSummary> {
  return api<SupportSummary>("/api/support/summary");
}

export function listSupportRequests(
  filters: SupportRequestFilters = {},
): Promise<{ requests: SupportRequestListItem[] }> {
  const params = new URLSearchParams();
  if (filters.queue) params.set("queue", filters.queue);
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  } else if (filters.scope) {
    params.set("scope", filters.scope);
  }
  if (filters.priority && filters.priority !== "all") {
    params.set("priority", filters.priority);
  }
  if (filters.unassigned) params.set("unassigned", "true");
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  const query = params.toString();
  return api<{ requests: SupportRequestListItem[] }>(
    `/api/support/requests${query ? `?${query}` : ""}`,
  );
}

export function getSupportRequest(id: number): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}`);
}

export function listSupportStaff(): Promise<{ staff: StaffMember[] }> {
  return api<{ staff: StaffMember[] }>("/api/support/staff");
}

export function claimSupportRequest(id: number): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}/claim`, {
    method: "POST",
  });
}

export function assignSupportRequest(
  id: number,
  assigneeId: number,
  expectedUpdatedAt: string,
): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ assigneeId, expectedUpdatedAt }),
  });
}

export function changeSupportRequestStatus(
  id: number,
  input: {
    status: RequestStatus;
    reason?: string;
    expectedUpdatedAt: string;
  },
): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}/status`, {
    method: "POST",
    body: JSON.stringify({
      status: input.status,
      expectedUpdatedAt: input.expectedUpdatedAt,
      ...(input.status === "Kapatıldı" ? { reason: input.reason } : {}),
    }),
  });
}

export function addSupportMessage(
  id: number,
  text: string,
): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function addSupportNote(
  id: number,
  text: string,
): Promise<SupportRequestDetail> {
  return api<SupportRequestDetail>(`/api/support/requests/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
