function sanitizeSemantic(results, lang) {
  if (!results) {
    return [];
  }

  // Keep only valid results
  let truthyResults = results.filter((e) => e);

  // For each result, get the properties and coordinates
  let features = truthyResults.map((x) => {
    let properties = x.features[0].properties;
    let coords = x.features[0].geometry.coordinates;
    properties.coordinates = coords;
    return properties;
  });

  return features;
}

export { sanitizeSemantic };
