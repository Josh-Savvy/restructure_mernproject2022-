const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const favicon = require("serve-favicon");
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
const imageRoute = require("./routes/image");

// App Middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb", type: "application/json" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors({ origin: process.env.CLIENT_URL }));

// Middlewares
app.use(favicon(path.join(__dirname, "/favicon.ico")));

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", linkRoutes);
app.use("/api/category/uploads", imageRoute);

app.get("/", (req, res) => {
  res.send("Server is working fine.");
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});
