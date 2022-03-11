const { check } = require("express-validator");

exports.userRegisterValidator = [
  check("name").not().isEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Please enter a valid Email address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("categories")
    .isLength({ min: 6 })
    .withMessage("Pick at least one topic category"),
];

exports.userLoginValidator = [
  check("email").isEmail().withMessage("Please enter a valid Email address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

exports.forgotPasswordValidator = [
  check("email").isEmail().withMessage("Please enter a valid Email address"),
];

exports.resetPasswordValidator = [
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("resetPasswordLink").not().isEmpty().withMessage("Invalid Link"),
];

exports.userUpdateValidator = [
  check("name").not().isEmpty().withMessage("Name is required")
];
