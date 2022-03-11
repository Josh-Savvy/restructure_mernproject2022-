const { check } = require("express-validator");

exports.categoryCreateValidator = [
  check("title").not().isEmpty().withMessage("Title is required"),
  check("image").not().isEmpty().withMessage("Image is required"),
  check("content")
    .isLength({ min: 20 })
    .withMessage("Content is too few,it shouldn't be less than 20"),
];

exports.categoryUpdateValidator = [
  check("title").not().isEmpty().withMessage("Title is required"),
  check("content")
    .isLength({ min: 20 })
    .withMessage("Content is too few, it shouldn't be less than 20"),
];
