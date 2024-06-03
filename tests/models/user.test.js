const { execSync } = require('child_process');
const { createUser, getUserByName, getUserById, getUsersList, getUsersCount, updateUser, isUserNameAvailable } = require('../../models/user')
const prismaClient = require('../../prisma/client')

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

  test('get users in default condition', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200}
    ];
    await prismaClient.user.createMany({ data: usersData });

    const users = await getUsersList();

    expect(users).toHaveLength(usersData.length);
    for (let i = 0; i < users.length - 1 ; i++) {
      expect(users[i]).toHaveProperty('id');
      expect(users[i]).toHaveProperty('name', usersData[i].name);
      expect(users[i].name).toStrictEqual(usersData[i].name);
      expect(users[i]).toHaveProperty('balance', usersData[i].balance);
      expect(users[i].balance).toStrictEqual(usersData[i].balance);
      expect(users[i]).toHaveProperty('createdAt');
      expect(users[i]).toHaveProperty('updatedAt');
    }
  });

  test('get first page users', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200}
    ];
    await prismaClient.user.createMany({ data: usersData });

    const users = await getUsersList({}, {perPage: 1, page: 1});

    expect(users).toHaveLength(1);
    for (let i = 0; i < users.length - 1 ; i++) {
      expect(users[i]).toHaveProperty('id');
      expect(users[i]).toHaveProperty('name', usersData[i].name);
      expect(users[i].name).toStrictEqual(usersData[i].name);
      expect(users[i]).toHaveProperty('balance', usersData[i].balance);
      expect(users[i].balance).toStrictEqual(usersData[i].balance);
      expect(users[i]).toHaveProperty('createdAt');
      expect(users[i]).toHaveProperty('updatedAt');
    }
  });

  test('get second page users', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200}
    ];
    await prismaClient.user.createMany({ data: usersData });

    const users = await getUsersList({}, {perPage: 1, page: 2});

    expect(users).toHaveLength(1);
    for (let i = 0; i < users.length - 1 ; i++) {
      expect(users[i]).toHaveProperty('id');
      expect(users[i]).toHaveProperty('name', usersData[i].name);
      expect(users[i].name).toStrictEqual(usersData[i].name);
      expect(users[i]).toHaveProperty('balance', usersData[i].balance);
      expect(users[i].balance).toStrictEqual(usersData[i].balance);
      expect(users[i]).toHaveProperty('createdAt');
      expect(users[i]).toHaveProperty('updatedAt');
    }
  });

  test('get user by query name', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: usersData });

    const users = await getUsersList({name: usersData[0].name}, {perPage: 1, page: 1});

    expect(users).toHaveLength(1);
    expect(users[0]).toHaveProperty('id');
    expect(users[0]).toHaveProperty('name', usersData[0].name);
    expect(users[0].name).toStrictEqual(usersData[0].name);
    expect(users[0]).toHaveProperty('balance', usersData[0].balance);
    expect(users[0].balance).toStrictEqual(usersData[0].balance);
    expect(users[0]).toHaveProperty('createdAt');
    expect(users[0]).toHaveProperty('updatedAt');
  });

  test('get users count', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: usersData });

    const usersCount = await getUsersCount();

    expect(usersCount).toStrictEqual(usersData.length);
  });

  test('get users count by query name', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: usersData });

    const usersCount = await getUsersCount({name: usersData[0].name},);

    expect(usersCount).toStrictEqual(1);
  });

  test('update user name', async () => {
    const originUser = await prismaClient.user.create({
      data:{
        name: 'user1',
        balance: 100
      }
    });

    const modifiedData = {name: 'new name'};
    const updatedUser  = await updateUser(originUser.id , {name: modifiedData.name},);

    expect(updatedUser.id).toStrictEqual(originUser.id);
    expect(updatedUser.name).toStrictEqual(modifiedData.name);
    expect(updatedUser.balance).toStrictEqual(originUser.balance);
    expect(updatedUser.createdAt).toStrictEqual(originUser.createdAt);
    expect(updatedUser.updatedAt !== originUser.updatedAt).toBeTruthy();
  });

  test('name for updating user is available', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: usersData });

    const available = await isUserNameAvailable(2, {name: 'not-existed'});

    expect(available).toBeTruthy();
  });

  test('name for updating user is unavailable', async () => {
    const usersData = [
      {name: 'user1', balance: 100},
      {name: 'user2', balance: 200},
    ];
    await prismaClient.user.createMany({ data: usersData });

    const available = await isUserNameAvailable(2, {name: 'user1'});

    expect(available).toBeFalsy();
  });
});

