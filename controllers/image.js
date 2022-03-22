const fs = require("fs");
const Category = require("../models/category");

exports.getSingleImage = (req, res) => {
  const { id } = req.params;
  // Category.findOne({image})
  console.log(id);

  // fs.readFile(`./uploads/images/${id}`, (err, data) => {
  //   res.writeHead(200, { "Content-Type": "image/jpeg" });
  //   res.end(data);
  // });
};
exports.getAllImages = () => {
  //
};
