const Express = require("express");
const router = Express.Router();

// Import validators
const {
  userRegisterValidator,
  userLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth");
const { runValidation } = require("../validators");

// Import controllers
const {
  Register,
  RegisterActivate,
  Login,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");

router.post("/register", userRegisterValidator, runValidation, Register);
router.post("/register/activate", RegisterActivate);
router.post("/login", userLoginValidator, runValidation, Login);

router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
);

module.exports = router;

// joshtee28@gmail.com
