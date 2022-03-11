const Express = require("express");
const router = Express.Router();

// validators
const {
  linkCreateValidator,
  linkUpdateValidator,
} = require("../validators/link");
const { runValidation } = require("../validators");
// controllers
const {
  requireSignin,
  userMiddleware,
  adminMiddleware,
  canUpdateDeleteLink,
} = require("../controllers/auth");

const { create, update, list, read, remove } = require("../controllers/link");

// routes
router.post(
  "/link",
  linkCreateValidator,
  runValidation,
  requireSignin,
  userMiddleware,
  create
);
router.post("/links", requireSignin, adminMiddleware, list);

router.get("/link", list);

router.get("/link/:id", read);
router.put(
  "/link/:id",
  linkUpdateValidator,
  runValidation,
  requireSignin,
  userMiddleware,
  canUpdateDeleteLink,
  update
);
router.delete(
  "/link/:id",
  requireSignin,
  userMiddleware,
  canUpdateDeleteLink,
  remove
);

// admin update link route
router.put(
  "/link/admin/:id",
  linkUpdateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  update
);
// admin delete link route
router.delete("/link/admin/:id", requireSignin, adminMiddleware, remove);

module.exports = router;
