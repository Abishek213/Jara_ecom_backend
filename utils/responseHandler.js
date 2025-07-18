export const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

export const errorResponse = (res, message, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export const paginatedResponse = (res, data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
};