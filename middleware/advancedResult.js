const advancedResults = (model, populate) => async (req, res, next) => {
  let query;
  // Copy req qury
  const reqQuery = { ...req.query };

  //Fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];

  // Loop over removeFields to delete query param from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // console.log(reqQuery);

  let queryStr = JSON.stringify(reqQuery);
  // Create operators for mongoose syntax

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding Resource
  // Added populate to add courses into bootcamp as join
  query = model.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort fields

  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Execute the query
  const results = await query;

  // Pagination Result

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }
  res.advancedResults = {
    success: true,
    pagination: pagination,
    count: results.length,
    data: results,
  };
  next();
};

module.exports = advancedResults;
