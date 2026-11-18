/**
 * Request Validation Middleware
 */

export function validatePredictionInput(req, res, next) {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({
      success: false,
      errors: ['Request body is empty or invalid JSON.'],
    });
  }

  const errors = [];

  const parseNum = (val, fieldName, min, max) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      errors.push(`${fieldName} is required.`);
      return null;
    }
    const num = parseFloat(val);
    if (isNaN(num) || !isFinite(num)) {
      errors.push(`${fieldName} must be a valid number.`);
      return null;
    }
    if (min !== undefined && num < min) {
      errors.push(`${fieldName} must be at least ${min}.`);
    }
    if (max !== undefined && num > max) {
      errors.push(`${fieldName} cannot exceed ${max}.`);
    }
    return num;
  };

  const medInc = parseNum(data.MedInc ?? data.median_income, 'Median Income', 0.1, 25.0);
  const houseAge = parseNum(data.HouseAge ?? data.housing_median_age ?? data.house_age, 'House Age', 0, 120);
  const aveRooms = parseNum(data.AveRooms ?? data.average_rooms, 'Average Rooms', 0.5, 50.0);
  const aveBedrms = parseNum(data.AveBedrms ?? data.average_bedrooms, 'Average Bedrooms', 0.5, 25.0);
  const population = parseNum(data.Population ?? data.population, 'Population', 1, 100000);
  const aveOccup = parseNum(data.AveOccup ?? data.average_occupancy, 'Average Occupancy', 0.5, 50.0);
  const latitude = parseNum(data.Latitude ?? data.latitude, 'Latitude', 32.0, 42.5);
  const longitude = parseNum(data.Longitude ?? data.longitude, 'Longitude', -124.5, -114.0);

  const ocean = String(data.OceanProximity ?? data.ocean_proximity ?? data.location ?? '').trim().toUpperCase();
  const validOceans = ['NEAR BAY', 'INLAND', 'NEAR OCEAN', '1H OCEAN', '<1H OCEAN', 'ISLAND'];

  let matchedOcean = null;
  for (const vo of validOceans) {
    if (ocean.includes(vo)) {
      matchedOcean = vo === '<1H OCEAN' ? '1H OCEAN' : vo;
      break;
    }
  }

  if (!matchedOcean) {
    errors.push('Please select a valid Ocean Proximity (NEAR BAY, INLAND, NEAR OCEAN, 1H OCEAN, ISLAND).');
  }

  if (aveBedrms && aveRooms && aveBedrms > aveRooms) {
    errors.push('Average Bedrooms cannot exceed Average Rooms.');
  }
  if (aveOccup && population && aveOccup > population) {
    errors.push('Average Occupancy cannot exceed Population.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  // Attach sanitized payload
  req.validatedFeatures = {
    MedInc: medInc,
    HouseAge: houseAge,
    AveRooms: aveRooms,
    AveBedrms: aveBedrms,
    Population: population,
    AveOccup: aveOccup,
    Latitude: latitude,
    Longitude: longitude,
    OceanProximity: matchedOcean,
    property_type: String(data.property_type || 'Single Family Home'),
    area_sqft: data.area_sqft ? parseFloat(data.area_sqft) : Math.round(aveRooms * 380),
    bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : Math.max(1, Math.round(aveBedrms * 1.1)),
  };

  next();
}

