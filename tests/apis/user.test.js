const { execSync } = require('child_process');
const request = require('supertest');
const { startServer, stopServer } = require('../../server')
const { prepareTestingApp } = require('../libs/server')
const { createUser } = require('../../models/user')
const prismaClient = require('../../prisma/client')
const { DEFAULT_PAGE, DEFAULT_PER_PAGE } = require('../../models/user')

const app = prepareTestingApp();
let testingServer;

beforeAll(() => {
  execSync('npm run migrate:test');
  testingServer = startServer(app, process.env.PORT, () => {});
});

beforeEach(() => {
  execSync('npm run reset:test');
});

afterAll(() => {
  stopServer(testingServer, () => {});
});

describe("Test user API", () => {
  test('create a new user, POST /api/users', async () => {
    const newUserData = {name: 'test1', balance: 100};
    const response = await request(testingServer)
      .post('/api/users')
      .set('Accept', 'application/json')
      .send(newUserData);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data.name).toStrictEqual(newUserData.name);
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data.balance).toStrictEqual(newUserData.balance);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('create a the same name user, POST /api/users', async () => {
    const newUserData = {name: 'test1', balance: 100};
    const successfulRes = await request(testingServer)
      .post('/api/users')
      .set('Accept', 'application/json')
      .send(newUserData);
    const failureRes = await request(testingServer)
      .post('/api/users')
      .set('Accept', 'application/json')
      .send(newUserData);

    expect(successfulRes.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(successfulRes.status).toStrictEqual(200);
    expect(successfulRes.body).toHaveProperty('data');
    expect(successfulRes.body.data).toHaveProperty('id');
    expect(successfulRes.body.data).toHaveProperty('name');
    expect(successfulRes.body.data.name).toStrictEqual(newUserData.name);
    expect(successfulRes.body.data).toHaveProperty('balance');
    expect(successfulRes.body.data.balance).toStrictEqual(newUserData.balance);
    expect(successfulRes.body.data).toHaveProperty('createdAt');
    expect(successfulRes.body.data).toHaveProperty('updatedAt');

    expect(failureRes.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(failureRes.status).toStrictEqual(400);
    expect(failureRes.body).toHaveProperty('errors');
    failureRes.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(failureRes.body.errors[0].path).toStrictEqual(['name']);
    expect(failureRes.body.errors[0].message).toStrictEqual('User already exists');
  });

  test('create a user by invalid balance, POST /api/users', async () => {
    const newUserData = {name: 'test1', balance: -100};
    const response = await request(testingServer)
      .post('/api/users')
      .set('Accept', 'application/json')
      .send(newUserData);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(422);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['balance']);
    expect(response.body.errors[0].message).toStrictEqual('Number must be greater than or equal to 0');
  });

  test('get a user by id, GET /api/users/:id', async () => {
    const newUserData = {name: 'test1', balance: 100};
    const newUser = await createUser(newUserData);
    const response = await request(testingServer)
      .get(`/api/users/${newUser.id}`);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.id).toStrictEqual(newUser.id);
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data.name).toStrictEqual(newUser.name);
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data.balance).toStrictEqual(newUser.balance);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('get a not exist user by id, GET /api/users/:id', async () => {
    const newUserData = {name: 'test1', balance: 100};
    await createUser(newUserData);
    const response = await request(testingServer)
      .get(`/api/users/99`);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(404);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual([]);
    expect(response.body.errors[0].message).toStrictEqual('Not found');
  });

  test('get users list, GET /api/users', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200}
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const response = await request(testingServer)
      .get(`/api/users`);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    for (let i = 0; i < response.body.data.length - 1 ; i++) {
      const user = response.body.data[i];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user.name).toStrictEqual(newUsersData[i].name);
      expect(user).toHaveProperty('balance');
      expect(user.balance).toStrictEqual(newUsersData[i].balance);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    }
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta.page).toStrictEqual(DEFAULT_PAGE);
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta.perPage).toStrictEqual(DEFAULT_PER_PAGE);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta.total).toStrictEqual(newUsersData.length);
  });

  test('get users list by pagination, GET /api/users?page=2&perPage=1', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200}
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const page = 2;
    const perPage = 1;
    const response = await request(testingServer)
      .get(`/api/users`).query({page, perPage});

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    for (let i = 0; i < response.body.data.length - 1 ; i++) {
      const user = response.body.data[i];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user.name).toStrictEqual(newUsersData[i].name);
      expect(user).toHaveProperty('balance');
      expect(user.balance).toStrictEqual(newUsersData[i].balance);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    }
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta.page).toStrictEqual(page);
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta.perPage).toStrictEqual(perPage);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta.total).toStrictEqual(newUsersData.length);
  });

  test('get users list by query name, GET /api/users?name=found', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200},
      {name: 'found', balance: 300}
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const name = 'found';
    const foundUsers = newUsersData.filter(user => user.name === name);
    const response = await request(testingServer)
      .get(`/api/users`).query({name});

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    for (let i = 0; i < response.body.data.length - 1 ; i++) {
      const user = response.body.data[i];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user.name).toStrictEqual(foundUsers[i].name);
      expect(user).toHaveProperty('balance');
      expect(user.balance).toStrictEqual(foundUsers[i].balance);
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    }
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta.page).toStrictEqual(DEFAULT_PAGE);
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta.perPage).toStrictEqual(DEFAULT_PER_PAGE);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta.total).toStrictEqual(foundUsers.length);
  });

  test('update user name, PUT /api/users/:id', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const newName = 'available name';
    const response = await request(testingServer)
      .put(`/api/users/${newUsersData.length}`).send({name: newName});

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.id).toStrictEqual(newUsersData.length);
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data.name).toStrictEqual(newName);
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data.balance).toStrictEqual(newUsersData[1].balance);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('update not existed user, PUT /api/users/:id', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const newName = 'available name';
    const response = await request(testingServer)
      .put(`/api/users/${newUsersData.length+1}`).send({name: newName});

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(404);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual([]);
    expect(response.body.errors[0].message).toStrictEqual('Not found');
  });

  test('update user by same name, PUT /api/users/:id', async () => {
    const newUsersData = [
      {name: 'test1', balance: 100},
      {name: 'test2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: newUsersData });
    const newName = 'test1';
    const response = await request(testingServer)
      .put(`/api/users/${newUsersData.length}`).send({name: newName});

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(400);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['name']);
    expect(response.body.errors[0].message).toStrictEqual('User already exists');
  });
});

