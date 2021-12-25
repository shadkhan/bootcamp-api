const mongoose = require("mongoose");
const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please enter the course title"],
  },
  description: {
    type: String,
    required: [true, "Please add the description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add the weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add the tution cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add the minimum required skills"],
    enum: ["beginner", "intermediate", "advance"],
  },

  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

// Static method to calculate and update average cost,of tuitoin
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },

    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);
  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (err) {
    console.log(err);
  }
};

// Middleware hook trigger for avarage Cost calculation
CourseSchema.post("save", function () {
  this.constructor.getAverageCost(this.bootcamp);
});

// Calculate the avearage cost again while removing the course
CourseSchema.pre("remove", function () {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
