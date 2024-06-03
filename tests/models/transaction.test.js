const { execSync } = require('child_process');
const { getUserById } = require('../../models/user')
const prismaClient = require('../../prisma/client')
const { deposit } = require('../../models/transaction')
const { TYPE } = require('../../models/transaction')

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
});
