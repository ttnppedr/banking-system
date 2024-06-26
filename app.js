const express = require('express');
const app = express();
app.use(express.json());

const apiRoutes = require('./routes/api/index')
app.use('/api', apiRoutes);

const { startServer } = require('./server')
const PORT = process.env.PORT;
startServer(app, PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
});
