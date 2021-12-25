const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // else {
  //     if (req.cookie.token) {
  //       token = req.cookie.token;
  //     }
  //   }

  // Make sure token exists

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this rout", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorized to access this rout", 401));
  }
});

// Authorize role for endpoints

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ErrorResponse(
          "User role is not authorized to access this route",
          403
        )
      );
    }
    next();
  };
};
