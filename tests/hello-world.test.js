const request = require('supertest');
const baseUrl = 'http://localhost:3000';

describe('Hello World', () => {
  test('it responds from /', async () => {
    const response = await request(baseUrl)
      .get('/');

    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual('Hello World');
  });
});
