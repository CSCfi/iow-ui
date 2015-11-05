
function ensurePropertyAsArray(obj, property) {
  const propertyValue = obj[property];

  if (!Array.isArray(propertyValue)) {
    obj[property] = propertyValue ? [propertyValue] : [];
  }
}

module.exports = {
  ensurePropertyAsArray
};
