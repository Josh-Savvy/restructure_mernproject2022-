const fs = require("fs");

exports.getSingleImage = (req, res) => {
  const { id } = req.params;
  fs.readFile(`./uploads/images/${id}`, (err, data) => {
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(data);
  });
};
exports.getAllImages = () => {
  //
};
