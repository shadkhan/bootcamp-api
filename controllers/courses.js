const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");
const Course = require("../models/Course");

// @desc Get All Courses
// @routes  GET /api/v1/courses
// @routes GET /api/v1/bootcamps/:bootcampId/courses
// @access Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    //res.status(200).json(res.advnacedResults);

    try {
      res.status(200).json(res.advancedResults);
    } catch (err) {
      console.log(err);
    }
  }
});

// @desc Get single course
// @routes  GET /api/v1/courses/:id
// @access Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Add  course
// @routes  POST /api/v1/bootcamp/:bootcampId/courses/
// @access Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp found with the id of ${req.params.bootcampId}`,
        404
      )
    );
  }

  // Make sure owner of bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to add a course ${bootcamp._id}`,
        401
      )
    );
  }

  const course = await Course.create(req.body);

  if (!course) {
    return next(
      new ErrorResponse(
        `No course posted in bootcamp with id of  ${req.params.bootcampId}`,
        404
      )
    );
  }
  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Update   course
// @routes  Put /api/v1/courses/:id
// @access Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure owner of Course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update a course ${course._id}`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Delete   course
// @routes  Delete /api/v1/courses/:id
// @access Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure owner of Course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete a course ${course._id}`,
        401
      )
    );
  }

  await course.remove();
  res.status(200).json({
    success: true,
    data: {},
  });
});
