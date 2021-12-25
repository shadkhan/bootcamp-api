const express = require("express");
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamps,
  deleteBootcamps,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps");

const Bootcamp = require("../models/Bootcamp");
const advancedResults = require("../middleware/advancedResult");

// Include other resource router
const courseRouter = require("./courses");
const reviewRouter = require("./reviews");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

// Re route
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewRouter);

router.route("/:zipcode/:distance").get(getBootcampsInRadius);
router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps)
  .post(protect, authorize("publisher", "admin"), createBootcamp);
router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamps)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamps);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), bootcampPhotoUpload);
module.exports = router;
