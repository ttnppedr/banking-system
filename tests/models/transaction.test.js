const { execSync } = require('child_process');
const { getUserById } = require('../../models/user')
const prismaClient = require('../../prisma/client')
const { deposit, getTransactionById, withdraw } = require('../../models/transaction')
const { TYPE } = require('../../models/transaction')
const InsufficientBalanceError = require('../../errors/InsufficientBalanceError')

const usersData = [
  {name: 'user A', balance: 100},
  {name: 'user B', balance: 200}
];

beforeAll(() => {
  execSync('npm run migrate:test');
});

beforeEach(async () => {
  execSync('npm run reset:test');
  await prismaClient.user.createMany({ data: usersData });
});

describe('Test transaction model', () => {
  test('deposit', async () => {
    let user = await getUserById({id: 1});
    const originBalance = user.balance;
    const amount = 100;
    const transaction = await deposit({userId: user.id, amount});
    user = await getUserById({id: 1});

    expect(transaction).toHaveProperty('id', 1);
    expect(transaction).toHaveProperty('type', TYPE.DEPOSIT);
    expect(transaction).toHaveProperty('userId', user.id);
    expect(transaction).toHaveProperty('amount', amount);
    expect(transaction).toHaveProperty('fromId', null);
    expect(transaction).toHaveProperty('toId', null);
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');

    expect(user).toHaveProperty('balance', originBalance + amount);
  });

  test('get transaction by id', async () => {
    let user = await getUserById({id: 1});
    const amount = 100;
    const originTransaction = await deposit({userId: user.id, amount});
    user = await getUserById({id: 1});
    const transaction = await getTransactionById({id: originTransaction.id});

    expect(transaction).toHaveProperty('id', 1);
    expect(transaction).toHaveProperty('type', TYPE.DEPOSIT);
    expect(transaction).toHaveProperty('userId', user.id);
    expect(transaction).toHaveProperty('amount', amount);
    expect(transaction).toHaveProperty('fromId', null);
    expect(transaction).toHaveProperty('toId', null);
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');
    expect(transaction).toHaveProperty('user', user);
    expect(transaction).toHaveProperty('user.id', user.id);
    expect(transaction).toHaveProperty('user.name', user.name);
    expect(transaction).toHaveProperty('from', null);
    expect(transaction).toHaveProperty('to', null);
  });

  test('insufficient balance withdraw', async () => {
    const user = await getUserById({id: 1});
    const depositData = {userId: user.id, amount: user.balance + 1};

    expect(async () => await withdraw(depositData)).rejects.toThrowError(InsufficientBalanceError);
  });

  test('withdraw', async () => {
    let user = await getUserById({id: 1});
    const originBalance = user.balance;
    const amount = 1;
    const transaction = await withdraw({userId: user.id, amount});
    user = await getUserById({id: 1});

    expect(transaction).toHaveProperty('id', 1);
    expect(transaction).toHaveProperty('type', TYPE.WITHDRAW);
    expect(transaction).toHaveProperty('userId', user.id);
    expect(transaction).toHaveProperty('amount', amount);
    expect(transaction).toHaveProperty('fromId', null);
    expect(transaction).toHaveProperty('toId', null);
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');

    expect(user).toHaveProperty('balance', originBalance - amount);
  });
});
