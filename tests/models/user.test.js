const { execSync } = require('child_process');
const { createUser, getUserByName, getUserById } = require('../../models/user')

beforeAll(() => {
  execSync('npm run migrate:test');
});

beforeEach(() => {
  execSync('npm run reset:test');
});

describe('Test user model', () => {
  test('create a new user', async () => {
    const newUserData = {name: 'test', balance: 100};
    const user = await createUser(newUserData);

    expect(user).toHaveProperty('id', 1);
    expect(user).toHaveProperty('name', newUserData.name);
    expect(user).toHaveProperty('balance', newUserData.balance);
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });

  test('find a not existed user by name', async () => {
    const foundUser = await getUserByName({name: 'not-existed'});

    expect(foundUser).toBeNull();
  });

  test('find an existed user by name', async () => {
    const newUserData = {name: 'test', balance: 100};
    const user = await createUser(newUserData);
    const foundUser = await getUserByName({name: newUserData.name});

    expect(user).toHaveProperty('id', foundUser.id);
    expect(user).toHaveProperty('name', foundUser.name);
    expect(user.name).toStrictEqual(foundUser.name);
    expect(user).toHaveProperty('balance', foundUser.balance);
    expect(user.balance).toStrictEqual(foundUser.balance);
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });

  test('find a not existed user by id', async () => {
    const foundUser = await getUserById({id: 1});

    expect(foundUser).toBeNull();
  });

  test('find an existed user by id', async () => {
    const newUserData = {name: 'test', balance: 100};
    const user = await createUser(newUserData);
    const foundUser = await getUserById({id: 1});

    expect(user).toHaveProperty('id', foundUser.id);
    expect(user).toHaveProperty('name', foundUser.name);
    expect(user.name).toStrictEqual(foundUser.name);
    expect(user).toHaveProperty('balance', foundUser.balance);
    expect(user.balance).toStrictEqual(foundUser.balance);
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });
});

