const httpMocks = require('node-mocks-http');
const { badRequest, unprocessableEntity, internalServerError, ok, notFound, okWithMeta } = require('../../utils/responses')

describe("Test responses", () => {
  test('badRequest should return 400 status code', async () => {
    const response = badRequest(httpMocks.createResponse(), 'name', 'User already exists');
    expect(response.statusCode).toBe(400);
  });

  test('badRequest should return specific keys', async () => {
    const response = badRequest(httpMocks.createResponse(), 'name', 'User already exists');
    const data = response._getJSONData();

    expect(data).toHaveProperty('errors');
    expect(data['errors'].length).toBe(1);
    expect(data['errors'][0]).toHaveProperty('path');
    expect(data['errors'][0]).toHaveProperty('message');
    expect(data).toMatchObject({ errors: [{ path: ['name'], message: 'User already exists' }] });
  });

  test('unprocessableEntity should return 422 status code', async () => {
    const errors = [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "number",
        "path": [
          "name"
        ],
        "message": "Expected string, received number"
      },
      {
        "code": "too_small",
        "minimum": 0,
        "type": "number",
        "inclusive": true,
        "exact": false,
        "message": "Number must be greater than or equal to 0",
        "path": [
          "balance"
        ]
      }
    ];

    const response = unprocessableEntity(httpMocks.createResponse(), errors);
    expect(response.statusCode).toBe(422);
  });

  test('unprocessableEntity should return specific keys', async () => {
    const errors = [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "number",
        "path": [
          "name"
        ],
        "message": "Expected string, received number"
      },
      {
        "code": "too_small",
        "minimum": 0,
        "type": "number",
        "inclusive": true,
        "exact": false,
        "message": "Number must be greater than or equal to 0",
        "path": [
          "balance"
        ]
      }
    ];

    const response = unprocessableEntity(httpMocks.createResponse(), errors);
    const data = response._getJSONData();

    expect(data).toHaveProperty('errors');
    expect(data['errors'].length).toBe(2);
    data['errors'].forEach((error) => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(data).toMatchObject({
      "errors": [
        {
          "path": [
            "name"
          ],
          "message": "Expected string, received number"
        },
        {
          "path": [
            "balance"
          ],
          "message": "Number must be greater than or equal to 0"
        }
      ]
    });
  });

  test('internalServerError should return 500 status code', async () => {
    const response = internalServerError(httpMocks.createResponse());
    expect(response.statusCode).toBe(500);
  });

  test('internalServerError should return specific keys', async () => {
    const response = internalServerError(httpMocks.createResponse());
    const data = response._getJSONData();

    expect(data).toHaveProperty('errors');
    expect(data['errors'].length).toBe(1);
    expect(data['errors'][0]).toHaveProperty('path');
    expect(data['errors'][0]).toHaveProperty('message');
    expect(data).toMatchObject({ errors: [{ path: [], message: 'Something went wrong' }] });
  });

  test('ok should return 200 status code', async () => {
    const user = {
      "id": 1,
      "name": "test",
      "balance": 100,
      "createdAt": "2024-05-30T04:48:58.422Z",
      "updatedAt": "2024-05-30T04:48:58.422Z"
    };

    const response = ok(httpMocks.createResponse(), user);
    expect(response.statusCode).toBe(200);
  });

  test('ok should return specific keys', async () => {
    const user = {
      "id": 1,
      "name": "test",
      "balance": 100,
      "createdAt": "2024-05-30T04:48:58.422Z",
      "updatedAt": "2024-05-30T04:48:58.422Z"
    };

    const response = ok(httpMocks.createResponse(), user);
    const data = response._getJSONData();

    expect(data).toHaveProperty('data');
  });

  test('notFound should return 404 status code', async () => {
    const response = notFound(httpMocks.createResponse());
    expect(response.statusCode).toBe(404);
  });

  test('notFound should return specific keys', async () => {
    const response = notFound(httpMocks.createResponse());
    const data = response._getJSONData();

    expect(data).toHaveProperty('errors');
    expect(data['errors'].length).toBe(1);
    expect(data['errors'][0]).toHaveProperty('path');
    expect(data['errors'][0]).toHaveProperty('message');
    expect(data).toMatchObject({ errors: [{ path: [], message: 'Not found' }] });
  });

  test('okWithMeta should return 404 status code', async () => {
    const response = okWithMeta(httpMocks.createResponse(), {}, {});
    expect(response.statusCode).toBe(200);
  });

  test('okWithMeta should return specific keys', async () => {
    const users = [
      {
        "id": 1,
        "name": "user1",
        "balance": 100,
        "createdAt": "2024-05-30T04:48:58.422Z",
        "updatedAt": "2024-05-30T04:48:58.422Z"
      },
      {
        "id": 2,
        "name": "user2",
        "balance": 200,
        "createdAt": "2024-05-30T04:48:58.422Z",
        "updatedAt": "2024-05-30T04:48:58.422Z"
      },
    ];
    const meta = {
      "perPage": 10,
      "page": 1,
      "total": 20
    };

    const response = okWithMeta(httpMocks.createResponse(), users, meta);
    const res = response._getJSONData();

    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
    res.data.forEach((user) => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('balance');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
    expect(res.meta).toHaveProperty('perPage');
    expect(res.meta).toHaveProperty('page');
    expect(res.meta).toHaveProperty('total');
    expect(res).toMatchObject({ data: users, meta: meta});
  });
});
