const { createHandler } = require("./_lib");

module.exports = createHandler({ env: process.env, fetchImpl: fetch });
