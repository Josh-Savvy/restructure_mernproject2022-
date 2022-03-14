const Category = require("../models/category");
const Link = require("../models/link");
const slugify = require("slugify");
const uuid = require("uuid/v4");
const fs = require("fs");

exports.create = async (req, res) => {
  const { title, content, image, imageUploadText } = req.body;

  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  // Slug
  const slug = slugify(title);

  // Image Processing
  function saveImage(base64Data) {
    const filename = `${slug}-` + uuid() + imageUploadText;
    fs.access("./uploads/images", (err) => {
      if (err) fs.mkdirSync("./uploads/images");
    });
    fs.writeFileSync(`uploads/images/${filename}`, base64Data, {
      encoding: "base64",
    });
    return filename;
  }

  const imageUrl = saveImage(base64Data);

  const category = new Category({ title, content, slug });

  category.image.url = `${process.env.API}/category/uploads/image/${imageUrl}`;

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
};

exports.list = async (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Categories could not load",
      });
    }
    res.json(data);
  });
};

exports.read = async (req, res) => {
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

exports.update = async (req, res) => {
  const { slug } = req.params;
  const { title, image, content, imagePreview, imageUploadText } = req.body;
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  // if admin wants to update image, remove existing image uploading new one
  // Remove exisiting image
  if (imagePreview) {
    Category.findOne({ slug }).exec((err, category) => {
      if (err) {
        return res.status(400).json({
          error: "Temporarily unable to load category",
        });
      }

      const imagePath = `./uploads/images/${
        category.image.url.split("/", 20)[7]
      }`;
      fs.readFile(`./uploads/images/${imagePath}`, (err, data) => {
        if (err) {
          // Image Processing
          function saveImage(base64Data) {
            const filename = `${slug}-` + uuid() + imageUploadText;
            fs.access("./uploads/images", (err) => {
              if (err) fs.mkdirSync("./uploads/images");
            });
            fs.writeFileSync(`uploads/images/${filename}`, base64Data, {
              encoding: "base64",
            });
            return filename;
          }
          const imageUrl = saveImage(base64Data);

          Category.findOneAndUpdate(
            { slug },
            {
              title,
              content,
              image: {
                url: `${process.env.API}/api/category/uploads/image/${imageUrl}`,
                key: `category/uploads/image/${imageUrl}`,
              },
            },
            { new: true }
          ).exec((err, updated) => {
            if (err) {
              return res.status(400).json({
                error: "Unable to update category",
              });
            }
            console.log(`Category -${slug}- updated successfully`);
            return res.status(200).json(updated);
          });
        }
        if (data) {
          fs.unlink(imagePath, function (err) {
            if (err) {
              console.log(`${slug} - Image could not be deleted`);
              throw err;
            }
            console.log(`${slug} - Image deleted!`);
          });
        }
      });
    });
  }
};
exports.remove = async (req, res) => {
  const { slug } = req.params;
  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      console.log("Couldn't delete category ", err);
      res.status(400).json({ error: "Error deleting category" });
    }

    res.json({
      message: "Category deleted successfully",
    });
  });
};

exports.clickCount = async (req, res) => {
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
