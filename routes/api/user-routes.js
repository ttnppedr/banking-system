const Express = require('express')
const Router = Express.Router()
const UserController = require('../../controllers/user-controller')

Router.post('/', UserController.store);
Router.get('/:id', UserController.show);
Router.get('/', UserController.index);
Router.put('/:id', UserController.update);

module.exports = Router
