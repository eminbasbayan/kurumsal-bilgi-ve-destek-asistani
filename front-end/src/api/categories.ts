import type { CategoryItem } from "../types";
import { api } from "./client";

export function listCategories(): Promise<{ categories: CategoryItem[] }> {
  return api<{ categories: CategoryItem[] }>("/api/categories");
}
