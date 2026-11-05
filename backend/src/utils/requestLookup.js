import mongoose from 'mongoose';
import ServiceRequest from '../models/ServiceRequest.js';

/**
 * Safely look up a ServiceRequest by either its MongoDB _id or human-readable requestId (e.g. RR-XXXXXX)
 * Prevents Mongoose CastError exceptions from being thrown when non-ObjectId strings are supplied.
 */
export const findServiceRequestByIdOrRequestId = async (identifier, populateOptions = null) => {
  if (!identifier || typeof identifier !== 'string') {
    return null;
  }

  const trimmed = identifier.trim();
  const isObjectId = mongoose.isValidObjectId(trimmed);

  const query = isObjectId
    ? { $or: [{ _id: trimmed }, { requestId: trimmed }] }
    : { requestId: trimmed };

  let queryBuilder = ServiceRequest.findOne(query);

  if (populateOptions) {
    if (Array.isArray(populateOptions)) {
      populateOptions.forEach((pop) => {
        queryBuilder = queryBuilder.populate(pop);
      });
    } else {
      queryBuilder = queryBuilder.populate(populateOptions);
    }
  }

  return await queryBuilder;
};

export default findServiceRequestByIdOrRequestId;