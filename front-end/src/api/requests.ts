import type {
  CreateRequestInput,
  RequestListItem,
  RequestStatus,
  RequestSummary,
  SupportRequest,
} from "../types";
import { api } from "./client";

export type RequestFilters = {
  q?: string;
  status?: RequestStatus | "all";
  category?: string;
  scope?: "all" | "open" | "closed";
};

export function getRequestSummary(): Promise<RequestSummary> {
  return api<RequestSummary>("/api/requests/summary");
}

export function listRequests(filters: RequestFilters = {}): Promise<{ requests: RequestListItem[] }> {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.scope && filters.scope !== "all") params.set("scope", filters.scope);
  const query = params.toString();
  return api<{ requests: RequestListItem[] }>(`/api/requests${query ? `?${query}` : ""}`);
}

export function getRequest(id: number): Promise<SupportRequest> {
  return api<SupportRequest>(`/api/requests/${id}`);
}

export function createRequest(input: CreateRequestInput): Promise<SupportRequest> {
  return api<SupportRequest>("/api/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function addRequestMessage(id: number, text: string): Promise<SupportRequest> {
  return api<SupportRequest>(`/api/requests/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
