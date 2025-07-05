// Vercel serverless function entry point
module.exports = async (req, res) => {
  // Import the built Express app
  const app = require('../dist/api/src/server.js').default;
  
  // Handle the request with Express
  return app(req, res);
};