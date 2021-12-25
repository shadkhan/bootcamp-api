const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");
const geocoder = require("../utils/geocoder");
const path = require("path");

// @desc Get All bootcamps
// @routes /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc Get single bootcamps
// @routes /api/v1/bootcamps/id
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  //  try {
  const bootcamp = await Bootcamp.findById(req.params.id).populate("courses");
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
  /* } catch (error) {
         // res.status(400).json({success: false});
         // next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
         next(error);
     } */
});

// @desc   Create bootcamps
// @routes /api/v1/bootcamps/id
// @access Public
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  //Add user to req.body from logged in user obj
  req.body.user = req.user.id;

  // Check for published bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // if the user is not admin they can add only one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with id ${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

// @desc update bootcamps
// @routes /api/v1/bootcamps/id
// @access Public
exports.updateBootcamps = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    //    return res.status(400).json({success: false});
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure owner of bootcamp can update the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update`,
        401
      )
    );
  }
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});

// @desc Delete bootcamps
// @routes /api/v1/bootcamps/id
// @access Public
exports.deleteBootcamps = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    //return res.status(400).json({success: false});
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure owner of bootcamp can delete the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete`,
        401
      )
    );
  }

  bootcamp.remove();

  res.status(200).json({ success: true, data: {} });

  //    res.status(200).json({ success: true, msg: `Delete bootcamps ${req.params.id}`});
});

// @desc Get bootcamps with in radius
// @routes /api/v1/bootcamps/radius/:zipcode/:distance
// @access Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat and lang from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius
  // Divide distance by radius of earth
  // Earth radius is 3963 mi / 6378.1 km

  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

// @desc Upload photo for bootcamp
// @routes /api/v1/bootcamps/id/photo
// @access Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    //return res.status(400).json({success: false});
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure owner of bootcamp can upload the photo to the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to upload photo`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload a image file only`, 400));
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload the file less than the size ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Generating the file name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  // Saving file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(
        new ErrorResponse(`Problem with saving the file on server`, 500)
      );
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({ success: true, data: file.name });
  });
});
