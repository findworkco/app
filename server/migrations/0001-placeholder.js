// Load in our dependencies
var multiline = require('multiline');

// Define our migrations
// http://docs.sequelizejs.com/en/v3/docs/migrations/
// http://docs.sequelizejs.com/en/v3/docs/raw-queries/
exports.up = function (queryInterface, Sequelize) {
  return queryInterface.sequelize.query(multiline(function () {/*
    BEGIN; -- Start our transaction
    ; -- SQL goes here
    COMMIT; -- End our transaction
  */}));
};
exports.down = function (queryInterface, Sequelize) {
  return queryInterface.sequelize.query(multiline(function () {/*
    BEGIN; -- Start our transaction
    ; -- SQL goes here
    COMMIT; -- End our transaction
  */}));
};
