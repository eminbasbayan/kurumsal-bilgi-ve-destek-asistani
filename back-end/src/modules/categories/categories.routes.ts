import { Router } from "express";
import { CATEGORIES } from "../../config/constants.js";

export function createCategoriesRouter(): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({
      categories: Object.entries(CATEGORIES).map(([name, subcategories]) => ({
        name,
        subcategories,
      })),
    });
  });
  return router;
}
