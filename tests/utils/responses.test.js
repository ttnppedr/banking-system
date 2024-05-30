const httpMocks = require('node-mocks-http');
const { badRequest, unprocessableEntity, internalServerError, ok } = require('../../utils/responses')

describe("Test responses", () => {
  test('badRequest should return 400 status code', async () => {
    const response = badRequest(httpMocks.createResponse(), 'name', 'User already exists');
    expect(response.statusCode).toBe(400);
  });

  test('badRequest should return specific keys', async () => {
    const response = badRequest(httpMocks.createResponse(), 'name', 'User already exists');
    const data = response._getJSONData();

    expect(data).toHaveProperty('error');
    expect(data['error'].length).toBe(1);
    expect(data['error'][0]).toHaveProperty('path');
    expect(data['error'][0]).toHaveProperty('message');
    expect(data).toMatchObject({ error: [{ path: ['name'], message: 'User already exists' }] });
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

    expect(data).toHaveProperty('error');
    expect(data['error'].length).toBe(2);
    data['error'].forEach((error) => {
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('message');
    });
    expect(data).toMatchObject({
      "error": [
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

    expect(data).toHaveProperty('error');
    expect(data['error'].length).toBe(1);
    expect(data['error'][0]).toHaveProperty('path');
    expect(data['error'][0]).toHaveProperty('message');
    expect(data).toMatchObject({ error: [{ path: [], message: 'Something went wrong' }] });
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
});
