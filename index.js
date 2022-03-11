const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const app = express();

// DB conn
mongoose
  .connect(process.env.DATABASE_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Import Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const linkRoutes = require("./routes/link");

// App Middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb", type: "application/json" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors({ origin: process.env.CLIENT_URL }));

// Middlewares
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", linkRoutes);

// app.use(express.static(path.join(__dirname, "build")));

// app.get("*", (req, res) => {
// res.sendFile(path.join(__dirname, "./build"));
// });

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});
