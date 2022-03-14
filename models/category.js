const mongoose = require("mongoose");
const crypto = require("crypto");

const { ObjectId } = mongoose.Schema;

const categorySchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      max: 20,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    image: {
      url: String,
    },
    content: {
      type: {},
      min: 20,
      max: 200000,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
