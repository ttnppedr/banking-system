const prepareTestingApp = () => {
  const express = require('express');
  const app = express();
  app.use(express.json());

  const apiRoutes = require('../../routes/api/index');
  app.use('/api', apiRoutes);

  return app;
}

module.exports = { prepareTestingApp }
