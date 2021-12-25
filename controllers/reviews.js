const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");
const Review = require("../models/Review");

// @desc Get reviews
// @routes  GET /api/v1/reviews
// @routes GET /api/v1/bootcamps/:bootcampId/reviews
// @access Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    try {
      res.status(200).json(res.advancedResults);
    } catch (err) {
      console.log(err);
    }
  }
});

// @desc Get review
// @routes  GET /api/v1/review/:id
// @access Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Add review
// @routes  Post /api/v1/bootcamps/:bootcampId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const review = await Review.create(req.body);

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Update review
// @routes  Put /api/v1/reviews/id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(
      new ErrorResponse(`Review doesn't exist with id of ${req.params.id}`, 401)
    );
  }

  // Check if current user is the owner review or admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        ` You are not authorized to update this review  ${req.params.id}`,
        401
      )
    );
  }

  // Update the review
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Delete review
// @routes  Delete /api/v1/reviews/id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  // Check if user is the creator of review or an admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        ` You are not authorized to delete this  ${req.params.id}`,
        401
      )
    );
  }
  await Review.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
