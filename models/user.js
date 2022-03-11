const mongoose = require("mongoose");
const Crypto = require("crypto");
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      max: 12,
      index: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },

    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
    },

    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    role: {
      type: String,
      default: "subscriber",
    },
    resetPasswordLink: {
      data: String,
      default: "",
    },
    categories: [
      {
        type: ObjectId,
        ref: "Category",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

// Virtual Fields
userSchema
  .virtual("password")
  .set(function (password) {
    //   set temp variable for password
    this._password = password;

    // make salt
    this.salt = this.makeSalt();

    // encrypt password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// methods : Authenticate > Encrypt Password > makeSalt
userSchema.methods = {
  // Authenticate method to check if password match
  authenticate: function (plainText) {
    //
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  //Encrypt Password Method
  encryptPassword: function (password) {
    if (!password) {
      return "";
    }
    try {
      return Crypto.createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (error) {
      return "";
    }
  },
  //   Salt Method
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

//  Export User Model
module.exports = mongoose.model("User", userSchema);
