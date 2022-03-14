const Express = require("express");
const router = Express.Router();

// validators
const {
  categoryUpdateValidator,
  categoryCreateValidator,
} = require("../validators/category");
const { runValidation } = require("../validators");
// controllers
const { requireSignin, adminMiddleware } = require("../controllers/auth");
const {
  create,
  update,
  list,
  read,
  remove,
  clickCount,
} = require("../controllers/category");

// routes
// Create new Category

router.post(
  "/category",
  categoryCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
);
// List all categories
router.get("/categories", list);
// List only one category
router.post("/category/:slug", read);
// Number of views
router.put("/click-count", clickCount);
// Update only one category
router.put(
  "/category/:slug",
  categoryUpdateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  update
);
// Delete only one category
router.delete("/category/:slug", requireSignin, adminMiddleware, remove);

module.exports = router;
