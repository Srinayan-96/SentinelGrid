const { z } = require('zod');

const validateRequest = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace request data with validated data (which might have defaults/transformations)
    req.body = validatedData.body;
    req.query = validatedData.query;
    req.params = validatedData.params;
    
    next();
  } catch (err) {
    next(err); // Passed to errorHandler
  }
};

module.exports = validateRequest;
