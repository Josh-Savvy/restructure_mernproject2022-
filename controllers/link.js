const slugify = require("slugify");
const Link = require("../models/link");

exports.create = (req, res) => {
  const { title, url, categories, type, medium } = req.body;
  //   console.table({ title, url, categories, type, medium });
  const slug = url;
  //   posted by tag
  const postedBy = req.user._id;

  let link = new Link({ title, url, categories, type, medium, slug, postedBy });

  link.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Link already exists",
      });
    }
    res.json(data);
  });
};
exports.list = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  Link.find({})
    .populate("postedBy", "name")
    .populate("categories", "title slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Error loading Links",
        });
      }
      res.json(data);
    });
};
exports.read = (req, res) => {
  const { id } = req.params;
  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Error loading link",
      });
    }
    res.json(data);
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { title, url, categories, type, medium } = req.body;

  Link.findOneAndUpdate(
    { _id: id },
    { title, url, categories, type, medium },
    { new: true }
  ).exec((err, updated) => {
    if (err) {
      return res.status(400).json({
        error:
          "Sorry, we encoutered an error while updating the link, please try again.",
      });
    }
    res.json(updated);
  });
};
exports.remove = (req, res) => {
  const { id } = req.params;
  Link.findOneAndRemove({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error:
          "Sorry, we encoutered an error while deleting the link, please try again.",
      });
    }
    res.json({ message: "Link deleted successfully" });
  });
};
