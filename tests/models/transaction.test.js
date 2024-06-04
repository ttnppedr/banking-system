const { execSync } = require('child_process');
const { getUserById } = require('../../models/user')
const prismaClient = require('../../prisma/client')
const { deposit, getTransactionById, withdraw, transfer, getTypeLabel, TYPE_LABEL, getTransactionsList,
  getTransactionsCount
} = require('../../models/transaction')
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

  test('insufficient balance transfer', async () => {
    const user = await getUserById({id: 1});
    const toUser = await getUserById({id: 2});
    const transferData = {userId: user.id, toId:toUser.id, amount: user.balance + 1};

    expect(async () => await transfer(transferData)).rejects.toThrowError(InsufficientBalanceError);
  });

  test('transfer', async () => {
    let user = await getUserById({id: 1});
    let toUser = await getUserById({id: 2});

    const originBalance = user.balance;
    const originToBalance = toUser.balance;
    const amount = 100;
    const transaction = await transfer({userId: user.id, toId: toUser.id, amount});
    const toTransaction = await getTransactionById({id: 1});
    user = await getUserById({id: 1});
    toUser = await getUserById({id: 2});

    expect(toTransaction).toHaveProperty('id', 1);
    expect(toTransaction).toHaveProperty('type', TYPE.TRANSFER);
    expect(toTransaction).toHaveProperty('userId', toUser.id);
    expect(toTransaction).toHaveProperty('amount', amount);
    expect(toTransaction).toHaveProperty('fromId', user.id);
    expect(toTransaction).toHaveProperty('toId', toUser.id);
    expect(toTransaction).toHaveProperty('createdAt');
    expect(toTransaction).toHaveProperty('updatedAt');

    expect(transaction).toHaveProperty('id', 2);
    expect(transaction).toHaveProperty('type', TYPE.TRANSFER);
    expect(transaction).toHaveProperty('userId', user.id);
    expect(transaction).toHaveProperty('amount', amount);
    expect(transaction).toHaveProperty('fromId', user.id);
    expect(transaction).toHaveProperty('toId', toUser.id);
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');

    expect(user.balance).toStrictEqual(originBalance - amount);
    expect(toUser.balance).toStrictEqual(originToBalance + amount);
  });

  test('get type label', () => {
    Object.values(TYPE).forEach((value) => {
      expect(getTypeLabel(value)).toStrictEqual(TYPE_LABEL[value]);
    });
  });

  test('get first page transactions', async () => {
    const transactionsData = [
      {type: TYPE.DEPOSIT, amount: 100, userId: 1},
      {type: TYPE.DEPOSIT, amount: 200, userId: 1},
      {type: TYPE.WITHDRAW, amount: 100, userId: 1},
      {type: TYPE.WITHDRAW, amount: 100, userId: 1}
    ];

    await prismaClient.transaction.createMany({ data: transactionsData });

    const transactions = await getTransactionsList({ userId: 1 }, {perPage: 3, page: 1});

    expect(transactions).toHaveLength(3);
    for (let i = 0; i < transactions.length - 1 ; i++) {
      expect(transactions[i]).toHaveProperty('id');
      expect(transactions[i]).toHaveProperty('userId', transactionsData[i].userId);
      expect(transactions[i]).toHaveProperty('type', transactionsData[i].type);
      expect(transactions[i]).toHaveProperty('amount', transactionsData[i].amount);
      expect(transactions[i]).toHaveProperty('fromId', null);
      expect(transactions[i]).toHaveProperty('toId', null);
      expect(transactions[i]).toHaveProperty('createdAt');
      expect(transactions[i]).toHaveProperty('updatedAt');
    }
  });

  test('get transactions count', async () => {
    const transactionsData = [
      {type: TYPE.DEPOSIT, amount: 100, userId: 1},
      {type: TYPE.DEPOSIT, amount: 200, userId: 1},
      {type: TYPE.WITHDRAW, amount: 100, userId: 1},
      {type: TYPE.WITHDRAW, amount: 100, userId: 2}
    ];

    await prismaClient.transaction.createMany({ data: transactionsData });

    const transactionsCount = await getTransactionsCount({ userId: 1 });

    expect(transactionsCount).toStrictEqual(3);
  });
});
