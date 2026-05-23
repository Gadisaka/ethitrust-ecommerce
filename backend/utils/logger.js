const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "apiKey",
      "webhookSecret",
      "signature",
      "headers.authorization",
      "headers['x-api-key']",
    ],
    remove: true,
  },
});

module.exports = logger;
