const Express = require('express')
const Router = Express.Router()
const UserController = require('../../controllers/user-controller')

Router.post('/', UserController.store);
Router.get('/:id', UserController.show);

module.exports = Router
