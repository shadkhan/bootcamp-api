const path = require("path");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const errorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

dotenv.config({ path: "./config/config.env" });

// Route file load
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

// Connect to Data base

connectDB();

const app = express();

// Body Parser
app.use(express.json());

// Add cookie handle middleware

app.use(cookieParser());

// Dev logger miffleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File upload
app.use(fileupload());

// Sanitize clean the input data from client
app.use(mongoSanitize());

// Add security headers
app.use(helmet());

// Prevent xss attack
app.use(xss());

// Prevent brute force , storming the network
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});
app.use(limiter);

// Prevent query params pollution
app.use(hpp());

// Enable cors
app.use(cors());

// Add static folder to server

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `App listening on port ${process.env.NODE_ENV} mode on port ${PORT} !`
      .yellow.bold
  )
);

// Handle unhandled rejection error
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close the server and exit
  server.close(() => process.exit(1));
});
