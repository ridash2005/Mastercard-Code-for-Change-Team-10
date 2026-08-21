// Vercel serverless entry point. server.js already exports the configured
// Express app and only calls app.listen() when run directly
// (require.main === module), so importing it here is side-effect-safe:
// Vercel wraps the exported app as a request handler per invocation.
module.exports = require('../server.js');
