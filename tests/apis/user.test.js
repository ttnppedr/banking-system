const { execSync } = require('child_process');
const request = require('supertest');
const { startServer, stopServer } = require('../../server')
const { prepareTestingApp } = require('../libs/server')

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
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data.name).toStrictEqual(newUserData.name);
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data.balance).toStrictEqual(newUserData.balance);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });
});

