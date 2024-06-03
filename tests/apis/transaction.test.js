const { execSync } = require('child_process');
const request = require('supertest');
const { startServer, stopServer } = require('../../server')
const { prepareTestingApp } = require('../libs/server')
const prismaClient = require('../../prisma/client')
const { TYPE, deposit, withdraw } = require('../../models/transaction')

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
    expect(response.status).toStrictEqual(400);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['userId']);
    expect(response.body.errors[0].message).toStrictEqual('User not found');
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

  test('transfer 100 from user, POST /api/transactions', async () => {
    const transferData = {userId: 1, amount: 100, toId:2, type: 'TRANSFER'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(transferData);

    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('type', TYPE.TRANSFER);
    expect(response.body.data).toHaveProperty('type', TYPE[transferData.type]);
    expect(response.body.data).toHaveProperty('fromId', transferData.userId);
    expect(response.body.data).toHaveProperty('toId', transferData.toId);
    expect(response.body.data).toHaveProperty('amount', transferData.amount);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('id', transferData.userId);
    expect(response.body.data.user).toHaveProperty('name', usersData[0].name);
    expect(response.body.data.user).toHaveProperty('balance', usersData[0].balance - transferData.amount);
    expect(response.body.data.user).toHaveProperty('createdAt');
    expect(response.body.data.user).toHaveProperty('updatedAt');
    expect(response.body.data).toHaveProperty('fromId');
    expect(response.body.data.from).toHaveProperty('id', transferData.userId);
    expect(response.body.data.from).toHaveProperty('name', usersData[0].name);
    expect(response.body.data.from).toHaveProperty('balance', usersData[0].balance - transferData.amount);
    expect(response.body.data.from).toHaveProperty('createdAt');
    expect(response.body.data.from).toHaveProperty('updatedAt');
    expect(response.body.data).toHaveProperty('toId');
    expect(response.body.data.to).toHaveProperty('id', transferData.toId);
    expect(response.body.data.to).toHaveProperty('name', usersData[1].name);
    expect(response.body.data.to).toHaveProperty('balance', usersData[1].balance + transferData.amount);
    expect(response.body.data.to).toHaveProperty('createdAt');
    expect(response.body.data.to).toHaveProperty('updatedAt');
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
  });

  test('transfer missing toId, POST /api/transactions', async () => {
    const transferData = {userId: 1, amount: 100, type: 'TRANSFER'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(transferData);

    expect(response.status).toStrictEqual(422);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['toId']);
    expect(response.body.errors[0].message).toContain('toId is required for TRANSFER type');
  });

  test('transfer to not exist user, POST /api/transactions', async () => {
    const transferData = {userId: 1, amount: 100, toId: 3, type: 'TRANSFER'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(transferData);

    expect(response.status).toStrictEqual(400);
    expect(response.body).toHaveProperty('errors');
    response.body.errors.forEach(error => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(response.body.errors[0].path).toStrictEqual(['toId']);
    expect(response.body.errors[0].message).toContain('User not found');
  });

  test('transfer insufficient balance, POST /api/transactions', async () => {
    const transferData = {userId: 1, amount: 101, toId: 2, type: 'TRANSFER'};
    const response = await request(testingServer)
      .post('/api/transactions')
      .send(transferData);

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
