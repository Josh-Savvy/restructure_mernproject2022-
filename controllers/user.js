const User = require("../models/user");
const Link = require("../models/link");
const { readFileSync } = require("fs");

exports.read = (req, res) => {
  User.findOne({ _id: req.user._id }).exec((err, user) => {
    if (err)
      return res.status(400).json({
        error: "No User Found",
      });
    Link.find({ postedBy: user })
      .populate("categories", "name slug")
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .exec((err, links) => {
        if (err)
          return res.status(400).json({
            error: "No links Found",
          });
        user.hashed_password = undefined;
        user.salt = undefined;
        res.json({ user, links });
      });
  });
};

exports.update = (req, res) => {
  const { name, password, categories } = req.body;
  switch (true) {
    case password && password < 6:
      return res.status(400).json({ error: "Password is too short." });
       
  }
  User.findOneAndUpdate(
    { _id: req.user._id },
    { name, categories, password },
    { new: true }
  ).exec((updated, err) => {
    if (err) {
      return res.status(400).json({ error: "No user found" });
    }
    updated.hashed_password = undefined;
    updated.salt = undefined;

    res.json(updated);
  });
};
