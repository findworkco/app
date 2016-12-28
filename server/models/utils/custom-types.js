// Load in our dependencies
var Sequelize = require('sequelize');

// Define an ID property
// DEV: ID is a STRING/VARCHAR due to PostgreSQL rejecting non-UUID queries, we want to 404 more gracefully
// https://github.com/sequelize/sequelize/blob/v3.28.0/lib/data-types.js#L103-L136
// https://github.com/sequelize/sequelize/blob/v3.28.0/lib/data-types.js#L702-L720
// https://github.com/sequelize/sequelize/blob/v3.28.0/lib/dialects/postgres/data-types.js#L48-L59
// DEV: We must use UUIDV4 for default value due to it being hardcoded in default value resolver
//   https://github.com/sequelize/sequelize/blob/v3.28.0/lib/utils.js#L279-L298
exports.ID = Sequelize.STRING.inherits(function () {
  if (!(this instanceof exports.ID)) { return new exports.ID(); }
  // 36 = UUID length
  Sequelize.STRING.call(this, 36);
});
exports.ID.prototype.key = exports.ID.key = 'ID';
// DEV: While we have type validation it's unused due to type validation only running on queries
//   which undoes the work for moving to VARCHAR so we can query and get a 404 easily
exports.ID.prototype.validate = Sequelize.UUIDV4.prototype.validate;
