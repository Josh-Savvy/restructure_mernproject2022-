const Express = require("express");
const router = Express.Router();

// Import controllers
const { read, update } = require("../controllers/user");

// Import middlewares
const {
  requireSignin,
  userMiddleware,
  adminMiddleware,
} = require("../controllers/auth");

// import validators
const { userUpdateValidator } = require("../validators/auth");
const { runValidation } = require("../validators");

// Routes
router.get("/user", requireSignin, userMiddleware, read);
router.get("/admin", requireSignin, adminMiddleware, read);
router.put(
  "/user",
  userUpdateValidator,
  runValidation,
  requireSignin,
  userMiddleware,
  update
);

module.exports = router;
