const { execSync } = require('child_process');
const request = require('supertest');
const { startServer, stopServer } = require('../../server')
const { prepareTestingApp } = require('../libs/server')
const prismaClient = require('../../prisma/client')
const { TYPE, deposit } = require('../../models/transaction')

const app = prepareTestingApp();
let testingServer;

const usersData = [
  {name: 'user A', balance: 100},
  {name: 'user B', balance: 200}
];

beforeAll(() => {
  execSync('npm run migrate:test');
  testingServer = startServer(app, process.env.PORT, () => {});
});

beforeEach(async () => {
  execSync('npm run reset:test');
  await prismaClient.user.createMany({ data: usersData });
});

afterAll(() => {
  stopServer(testingServer, () => {});
});

describe("Test transaction API", () => {
  test('deposit 100 to user, POST /api/transactions', async () => {
    const depositData = {userId: 1, amount: 100, type: 'DEPOSIT'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(depositData);

    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('type', TYPE[depositData.type]);
    expect(response.body.data).toHaveProperty('userId', depositData.userId);
    expect(response.body.data).toHaveProperty('fromId', null);
    expect(response.body.data).toHaveProperty('toId', null);
    expect(response.body.data).toHaveProperty('amount', depositData.amount);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('id', depositData.userId);
    expect(response.body.data.user).toHaveProperty('name', usersData[0].name);
    expect(response.body.data.user).toHaveProperty('balance', usersData[0].balance + depositData.amount);
    expect(response.body.data.user).toHaveProperty('createdAt');
    expect(response.body.data.user).toHaveProperty('updatedAt');
    expect(response.body.data).toHaveProperty('from', null);
    expect(response.body.data).toHaveProperty('to', null);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('deposit 100 to not exist user, POST /api/transactions', async () => {
    const depositData = {userId: usersData.length+1, amount: 100, type: 'DEPOSIT'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(depositData);

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

  test('deposit 0 to user, POST /api/transactions', async () => {
    const depositData = {userId: usersData.length+1, amount: 0, type: 'DEPOSIT'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(depositData);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(422);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['amount']);
    expect(response.body.errors[0].message).toStrictEqual('Number must be greater than or equal to 1');
  });

  test('deposit 100 to user using wrong type, POST /api/transactions', async () => {
    const depositData = {userId: usersData.length+1, amount: 100, type: 'WRONG_TYPE'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(depositData);

    expect(response.headers["Content-Type"]).toString('application/json; charset=utf-8');
    expect(response.status).toStrictEqual(422);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['type']);
    expect(response.body.errors[0].message).toContain('Invalid enum value.');
  });

  test('withdraw 100 from user, POST /api/transactions', async () => {
    const withdrawData = {userId: 1, amount: 100, type: 'WITHDRAW'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(withdrawData);

    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('type', TYPE.WITHDRAW);
    expect(response.body.data).toHaveProperty('type', TYPE[withdrawData.type]);
    expect(response.body.data).toHaveProperty('fromId', null);
    expect(response.body.data).toHaveProperty('toId', null);
    expect(response.body.data).toHaveProperty('amount', withdrawData.amount);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('id', withdrawData.userId);
    expect(response.body.data.user).toHaveProperty('name', usersData[0].name);
    expect(response.body.data.user).toHaveProperty('balance', usersData[0].balance - withdrawData.amount);
    expect(response.body.data.user).toHaveProperty('createdAt');
    expect(response.body.data.user).toHaveProperty('updatedAt');
    expect(response.body.data).toHaveProperty('from', null);
    expect(response.body.data).toHaveProperty('to', null);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('withdraw insufficient balance from user, POST /api/transactions', async () => {
    const withdrawData = {userId: 1, amount: 101, type: 'WITHDRAW'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(withdrawData);

    expect(response.status).toStrictEqual(400);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['amount']);
    expect(response.body.errors[0].message).toContain('Insufficient balance');
  });
});
