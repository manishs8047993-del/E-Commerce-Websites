// Vercel Serverless Entry Point
// This file re-exports the Express app so Vercel can use it as a serverless function.
// The vercel.json routes all requests to server.js, but having this file in /api/
// ensures Vercel recognizes the project as a serverless Node.js application.

const app = require('../server');

module.exports = app;
