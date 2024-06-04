const { execSync } = require('child_process');
const request = require('supertest');
const { startServer, stopServer } = require('../../server')
const { prepareTestingApp } = require('../libs/server')
const prismaClient = require('../../prisma/client')
const { TYPE, deposit, withdraw, DEFAULT_PAGE, DEFAULT_PER_PAGE } = require('../../models/transaction')

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

  test('get transactions list, GET /api/transactions', async () => {
    const userId = 1;
    const anotherUserId = 2;
    const transactionsData = [
      {type: TYPE.TRANSFER, amount: 100, userId: userId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 100, userId: anotherUserId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 200, userId: userId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 200, userId: anotherUserId, fromId: userId, toId: anotherUserId},
    ];
    const userTransactions = transactionsData.filter(transaction => transaction.userId === userId);

    await prismaClient.transaction.createMany({ data: transactionsData });

    const queryData = {userId};
    const response = await request(testingServer)
      .get('/api/transactions')
      .query(queryData);

    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveLength(userTransactions.length);
    const transactions = response.body.data;
    for (let i = 0; i < transactions.length - 1 ; i++) {
      expect(transactions[i]).toHaveProperty('id');
      expect(transactions[i]).toHaveProperty('userId', userId);
      expect(transactions[i]).toHaveProperty('type', TYPE.TRANSFER);
      expect(transactions[i]).toHaveProperty('amount');
      expect(transactions[i]).toHaveProperty('user');
      expect(transactions[i].user).toHaveProperty('id', userId);
      expect(transactions[i].user).toHaveProperty('name');
      expect(transactions[i].user).toHaveProperty('balance');
      expect(transactions[i].user).toHaveProperty('createdAt');
      expect(transactions[i].user).toHaveProperty('updatedAt');
      expect(transactions[i]).toHaveProperty('fromId');
      expect(transactions[i].from).toHaveProperty('id');
      expect(transactions[i].from).toHaveProperty('name');
      expect(transactions[i].from).toHaveProperty('balance');
      expect(transactions[i].from).toHaveProperty('createdAt');
      expect(transactions[i].from).toHaveProperty('updatedAt');
      expect(transactions[i]).toHaveProperty('toId');
      expect(transactions[i].to).toHaveProperty('id');
      expect(transactions[i].to).toHaveProperty('name');
      expect(transactions[i].to).toHaveProperty('balance');
      expect(transactions[i].to).toHaveProperty('createdAt');
      expect(transactions[i].to).toHaveProperty('updatedAt');
      expect(transactions[i]).toHaveProperty('createdAt');
      expect(transactions[i]).toHaveProperty('updatedAt');

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page', DEFAULT_PAGE);
      expect(response.body.meta).toHaveProperty('perPage', DEFAULT_PER_PAGE);
      expect(response.body.meta).toHaveProperty('total', userTransactions.length);
    }
  });

  test('get not exist transactions list, GET /api/transactions', async () => {
    const userId = 1;
    const anotherUserId = 2;
    const transactionsData = [
      {type: TYPE.TRANSFER, amount: 100, userId: userId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 100, userId: anotherUserId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 200, userId: userId, fromId: userId, toId: anotherUserId},
      {type: TYPE.TRANSFER, amount: 200, userId: anotherUserId, fromId: userId, toId: anotherUserId},
    ];

    await prismaClient.transaction.createMany({ data: transactionsData });

    const queryData = {userId, timeFrom: '2100-01-01T00:00:00.000Z'};
    const response = await request(testingServer)
      .get('/api/transactions')
      .query(queryData);

    expect(response.status).toStrictEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveLength(0);
    expect(response.body.data).toStrictEqual([]);
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('page', DEFAULT_PAGE);
    expect(response.body.meta).toHaveProperty('perPage', DEFAULT_PER_PAGE);
    expect(response.body.meta).toHaveProperty('total', 0);
  });
});
