// Standard success response
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

// Standard error response
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  return res.status(statusCode).json(response);
};

// Pagination response
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination
  };

  return res.json(response);
};

export { successResponse, errorResponse, paginatedResponse };