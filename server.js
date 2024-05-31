const startServer = ((app, port, callback) => {
  return app.listen(port, '0.0.0.0', () => {
    callback();
  });
});

const stopServer = ((app, callback) => {
  app.close(() => {
    callback();
  });
});

module.exports = { startServer, stopServer };
