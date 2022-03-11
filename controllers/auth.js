const User = require("../models/user");
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const {
  registerEmailParams,
  forgotPasswordEmailParams,
} = require("../helpers/email");
const shortid = require("shortid");
const expressJwt = require("express-jwt");
const _ = require("lodash");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const Link = require("../models/link");

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.Register = (req, res) => {
  // console.log('REGISTER CONTROLLER', req.body);
  const { name, email, password, categories } = req.body;

  // check is user exists already in db
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      console.log(err);
      return res.status("400").json({
        error: "Email is already taken.",
      });
    }

    // If user is not in db, genearate new token consisting of hashed user details
    const token = jwt.sign(
      { name, email, password, categories },
      process.env.JWT_ACCOUNT_ACTIVATION_KEY,
      {
        expiresIn: "20m",
      }
    );

    // const params = registerEmailParams(email, token);
    // const sendEmailOnRegister = ses.sendEmail(params).promise();
    // sendEmailOnRegister
    //   .then((data) => {
    //     console.log("email submitted to SES", data);
    //
    //   })
    //   .catch((error) => {
    //     console.log("ses email on register", error);

    //   });

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_AUTH_PASS,
      },
    });

    const mailMsg = {
      from: "MERN PROJECT",
      to: `${email}`,
      subject: "Email verification",
      html: `<h1>Email Verification</h1>
  <p>Kindly follow this <a href="${process.env.CLIENT_URL}/auth/activate/${token}">LINK</a> to complete your registration:</p>
  `,
    };

    transporter.sendMail(mailMsg, (err, result) => {
      console.log(result);
      if (err) {
        console.log("Email not sent to client:error = ", err);
        return res.json({
          message: `❌ We couldn't verify your email, please try again `,
        });
      }
      if (!err) {
        console.log("Message Sent!");
        res.json({
          message: `✔ Dear ${name}, a link has been sent to <b>${email}</b> successfully, please follow further instrustions
                to complete your registration.`,
        });
      }
    });
  });
};

exports.RegisterActivate = (req, res) => {
  const { token } = req.body;
  // console.log(token);
  jwt.verify(
    token,
    process.env.JWT_ACCOUNT_ACTIVATION_KEY,
    function (err, decoded) {
      if (err) {
        return res.status(401).json({
          error: "❌ Expired Link, please register again.",
        });
      }
      // If token is not expired or no error found, then check if user exists in db

      const { name, email, password, categories } = jwt.decode(token);
      const username = shortid.generate();

      User.findOne({ email }).exec((error, checkUser) => {
        if (checkUser) {
          return res.status(401).json({
            error: "❌ Email already used.",
          });
        }

        // else create new user in db
        const newUser = new User({
          username,
          name,
          email,
          password,
          categories,
        });
        newUser.save((error, result) => {
          if (error) {
            res.status(401).json({
              error:
                "❌ Error saving user information in database, please try later.",
            });
            console.log(error);
          }
          return res.json({
            message: "✔ Registration successful.",
          });
        });
      });
    }
  );
};

exports.Login = (req, res) => {
  const { email, password } = req.body;
  // console.table({ email, password });
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "❌ This email doesn't exist! Please register your email",
      });
    }
    // check if password and email is correct
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "❌ Email and password do not match",
      });
    }
    // If Everything is in place, generate token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET_KEY,
  algorithms: ["sha1", "RS256", "HS256"],
});

exports.userMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "❌ User not found",
      });
    }
    req.profile = user;
    next();
  });
};
exports.adminMiddleware = (req, res, next) => {
  const adminId = req.user._id;
  User.findOne({ _id: adminId }).exec((err, user) => {
    if (err || user.role !== "admin") {
      return res.status(400).json({
        error: "❌ Admin resource. Access denied",
      });
    }
    req.profile = user;
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  // check if email/user exists in db
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist",
      });
    }
    // generate token and send to user email
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: "10m" }
    );
    // send email
    const params = forgotPasswordEmailParams(email, token);

    // populate the db user model reset password link
    return User.updateOne({ resetPasswordLink: token }, (error, success) => {
      // check if there's error
      if (error) {
        return res.status(400).json({
          error:
            "Password reset failed, please try later (Can't send reset link)",
        });
      }
      // if there's no error, send the email to user email address
      const sendEmail = ses.sendEmail(params).promise();
      sendEmail
        .then((data) => {
          console.log("ses reset password success");
          res.json({
            message: `Email has been sent to ${email}. Follow the link to reset your passoword`,
          });
        })
        .catch((err) => {
          console.log("reset password ses failed");
          res.json({
            error: "We could not verify your email",
          });
        });
    });
  });
};
exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    // check if link has expired
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      (err, success) => {
        if (err) {
          return res.status(400).json({
            error: "Expired Link, please try again",
          });
        }
        User.findOne({ resetPasswordLink }).exec((err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: "Invalid link, please try again later",
            });
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          user = _.extend(user, updatedFields);
          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: "Password reset failed, Try again later",
              });
            }
            res.json({
              message:
                "Password reset sucsessful, you can now login with your new password",
            });
          });
        });
      }
    );
  }
};

exports.canUpdateDeleteLink = (req, res, next) => {
  const { id } = req.params;
  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.ststau(400).json({
        error: "Error finding Link",
      });
    }
    let authorizedUser =
      data.postedBy._id.toString() === req.user._id.toString();
    if (!authorizedUser) {
      return res.status(400).json({
        error: "Unauthorized!",
      });
    }
    next();
  });
};
