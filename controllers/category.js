const Category = require("../models/category");
const Link = require("../models/link");
const Image = require("../models/image");
const slugify = require("slugify");
const uuid = require("uuid/v4");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.create = async (req, res) => {
  const { title, content, image, imageUploadText } = req.body;

  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  // Slug
  const slug = slugify(title);

  // Saving Image Locally
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

  cloudinary.uploader
    .upload(`./uploads/images/${imageUrl}`, {
      resource_type: "image",
      public_id: imageUrl,
    })
    .then((result) => {
      let imageUrl;
      let imageUrlId;
      for (var url in result) {
        if (url == "url") {
          imageUrl = result[url];
        }
      }
      for (var public_id in result) {
        if (public_id == "public_id") {
          imageUrlId = result[public_id];
        }
      }
      category.image.url = imageUrl;
      category.image.key = imageUrlId;

      // posted by
      category.postedBy = req.user._id;
      // then save to Database
      category.save((error, success) => {
        if (error) {
          console.log("Image save to db error: ", error);
          res.status(400).json({
            error: "Error saving category to Database, please try again",
          });
        }
        return res.json(success);
      });
    })
    .catch((err) => {
      console.log("Error uploading image to cloudinary", err);
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
          error: "Temporarily unable to load category. Please try again.",
        });
      }

      const cutImagePath = `${category.image.url.split("/", 20)[7]}`;
      const imagePath = cutImagePath.substring(0, cutImagePath.length - 4);
      fs.readFile(`./uploads/images/${imagePath}`, (err, data) => {
        if (data) {
          fs.unlink(`./uploads/images/${imagePath}`, function (err) {
            if (err) {
              console.log(
                `${slug} - Image could not be deleted. Reason: ${err}`
              );
            }
            console.log(`Image - ${slug} - deleted!`);
            if (category.image.key) {
              cloudinary.uploader.destroy(
                category.image.key,
                function (result) {
                  console.log("Deleted from cloudinary", result);
                }
              );
            }
          });
        }

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

          cloudinary.uploader
            .upload(`./uploads/images/${imageUrl}`, {
              resource_type: "image",
              public_id: imageUrl,
            })
            .then((result) => {
              let updateImageUrl;
              let updateImageUrlId;
              for (var url in result) {
                if (url == "url") {
                  updateImageUrl = result[url];
                }
              }
              for (var public_id in result) {
                if (public_id == "public_id") {
                  updateImageUrlId = result[public_id];
                }
              }
              // posted by
              category.postedBy = req.user._id;
              // then update in Database
              Category.findOneAndUpdate(
                { slug },
                {
                  title,
                  content,
                  image: {
                    url: `${updateImageUrl}`,
                    key: `${updateImageUrlId}`,
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
            })
            .catch((err) => {
              console.log("Error uploading image to cloudinary", err);
            });
        }
      });
    });
  }
};

exports.remove = async (req, res) => {
  const { slug } = req.params;
  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      console.log("Couldn't find category ", err);
      res.status(400).json({ error: "Error deleting category index." });
    }
    if (category.image.key) {
      cloudinary.uploader.destroy(category.image.key, function (result) {
        console.log("Deleted from cloudinary", result);
      });
      Category.findOneAndRemove({ slug: category.slug }).exec((err, data) => {
        if (err) {
          console.log("Couldn't find category ", err);
          res.status(400).json({ error: "Error deleting category." });
        }
        res.json({
          message: "Category deleted successfully",
        });
      });
    }
  });
};
