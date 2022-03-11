const Category = require("../models/category");
const Link = require("../models/link");
const slugify = require("slugify");
const formidable = require("formidable");
const AWS = require("aws-sdk");
const uuidv4 = require("uuid/v4");
const fs = require("fs");
const path = require("path");

// s3 config
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

exports.create = (req, res) => {
  const { title, content, image } = req.body;

  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  const type = image.split(";")[0].split("/")[1];
  const slug = slugify(title);

  const category = new Category({ title, content, slug });
  const params = {
    Bucket: "nextnode.dev",
    Key: `category/${uuidv4()}.${type}`,
    Body: base64Data,
    ACL: "public-read",
    Content: "base64",
    ContentType: `image/${type}`,
  };
  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({
        error: "File upload to server failed, please try again",
      });
    }
    // console.log("AWS UPLOAD DATA RESP: ", data);
    category.image.url = data.Location;
    category.image.key = data.Key;
    // posted by

    category.postedBy = req.user._id;
    // then save to UserDb
    category.save((error, success) => {
      if (error) {
        console.log("Image save to db error: ", error);
        res.status(400).json({
          error: "Error saving category to Database, please try again",
        });
      }
      return res.json(success);
    });
  });
};
exports.list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Categories could not load",
      });
    }
    res.json(data);
  });
};

exports.read = (req, res) => {
  const { slug } = req.params;
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  Category.findOne({ slug })
    .populate("postedBy", "_id name username")
    .exec((err, category) => {
      if (err) {
        return res.status(400).json({
          error: "Temporarily unable to load category",
        });
      }
      // res.json(category);
      Link.find({ categories: category })
        .populate("postedBy", "_id name username")
        .populate("categories", "title")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, links) => {
          if (err) {
            return res.status(400).json({
              error: "Unable to load category links",
            });
          }
          res.json({ category, links });
        });
    });
};

exports.update = (req, res) => {
  const { slug } = req.params;
  const { title, image, content } = req.body;
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  const type = image.split(";")[0].split("/")[1];

  Category.findOneAndUpdate({ slug }, { title, content }, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: "Unable to update category",
        });
      }
      console.log("Updated category", updated);
      // if admin wants to update image, remove existing image for s3 before uploading new one
      if (image) {
        const deleteParams = {
          Bucket: "nextnode.dev",
          Key: `${updated.image.key}`,
        };
        s3.deleteObject(deleteParams, (err, data) => {
          if (err) {
            console.log("image update failed", err);
          } else {
            console.log("Image update success", data);
          }
        });

        // Update and Upload new image
        const params = {
          Bucket: "nextnode.dev",
          Key: `category/${uuidv4()}.${type}`,
          Body: base64Data,
          ACL: "public-read",
          Content: "base64",
          ContentType: `image/${type}`,
        };
        s3.upload(params, (err, data) => {
          if (err) {
            console.log(err);
            res.status(400).json({
              error: "File upload to server failed, please try again",
            });
          }
          console.log("AWS UPLOAD DATA RESP: ", data);
          updated.image.url = data.Location;
          updated.image.key = data.Key;

          // then save to UserDb
          updated.save((error, success) => {
            if (error) {
              console.log("Image save to db error: ", error);
              res
                .status(400)
                .json({ error: "Error saving category to Database" });
            }
            res.json(success);
          });
        });
      } else {
        res.json(updated);
      }
    }
  );
};
exports.remove = (req, res) => {
  const { slug } = req.params;
  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      console.log("Couldn't delete category ", err);
      res.status(400).json({ error: "Error deleting category" });
    }
    // remove the existing image from s3 before uploading new/updated one
    const deleteParams = {
      Bucket: "nextnode.dev",
      Key: `${data.image.key}`,
    };
    s3.deleteObject(deleteParams, (err, data) => {
      if (err) console.log("image delete failed", err);
      else console.log("Image delete success", data);
    });

    res.json({
      message: "Category deleted successfully",
    });
  });
};

exports.clickCount = (req, res) => {
  const { linkId } = req.body;
  Link.findByIdAndUpdate(
    linkId,
    { $inc: { clicks: 1 } },
    { upsert: true, new: true }
  ).exec((err, result) => {
    if (err)
      return res.status(400).json({
        error: "Could not update views count",
      });
    res.json(result);
  });
};

