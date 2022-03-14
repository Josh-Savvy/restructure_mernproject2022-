const Express = require("express");
const { getSingleImage, getAllImages } = require("../controllers/image");
const router = Express.Router();

router.get("/image/:id", getSingleImage);
router.get("/image/all", getAllImages);

module.exports = router;
