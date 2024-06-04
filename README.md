# A simple banking system

## Sections
- [Packages](#packages)
- [Deploy steps](#deploy-steps)
- [Folder structure](#folder-structure)
- [DB schema](#db-schema)
  - [User](#user)
  - [Transaction](#transaction)
- [API document](#api)
  - [User](#user-api)
  - [Transaction](#transaction-api)
- [Improvement](#improvement)

## Packages
- [express](https://expressjs.com/): web framework
- [prisma](https://www.prisma.io/): ORM
- [zod](https://zod.dev/): schema validation
- [dotenv-cli](https://github.com/entropitor/dotenv-cli): environment variable
- [jest](https://jestjs.io/): testing
- [node-mock-http](https://github.com/eugef/node-mocks-http): mock http request request
- [supertest](https://github.com/ladjs/supertest): testing http request

## Deploy steps
1. Clone the repository 
```shell
git clone git@github.com:ttnppedr/banking-system.git
```
2. Cd into the repository 
```shell
cd banking-system
```
3. Copy environment variable 
```shell
cp .env.example .env
```
4. Build Docker image 
```shell
docker build -t banking-system .
```
5. Start container first time :
```shell
docker run -d -p 3000:3000 -v .:/app -v /app/node_modules --name bank banking-system
```
6. Migrate DB schema
```shell
docker exec bank sh -c "npm run migrate:dev && npm run migrate:test"
```
7. YEAH! Access the application at `http://localhost:3000`
8. Start container: 
```shell
docker start bank
```
9. Stop container: 
```shell
docker stop bank
```

## Folder structure
```
controllers
  transaction-controller.js
  user-controller.js
errors
  InsufficientBalanceError.js
model
  user.js
  transaction.js
prisma
  migrations/
  client.js
  schema.prisma
routes
  api
    index.js
    transaction-routes.js
    user-routes.js
tests
  apis
    transaction.test.js
    user.test.js
  libs
    server.js
  models
    transaction.test.js
    user.test.js
  utils
    responses.test.js
utils
  responses.js
```

## DB schema
### User

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id          | INTEGER   | NO          |
| name        | TEXT      | NO          |
| balance     | INTEGER   | NO          |
| createdAt   | DATETIME  | NO          |
| updatedAt   | DATETIME  | NO          |

### Transaction

| column_name | data_type | is_nullable | memo                               |
|-------------|-----------|-------------|------------------------------------|
| id          | INTEGER   | NO          |                                    |
| type        | INTEGER   | NO          | DEPOSIT=1, WITHDRAW=2, TRANSFER=3  |
| userId      | INTEGER   | NO          |                                    |
| fromId      | INTEGER   | YES         | userId if type=3                   |
| toId        | INTEGER   | YES         | userId if type=3                   |
| amount      | INTEGER   | NO          |                                    |
| createdAt   | DATETIME  | NO          |                                    |
| updatedAt   | DATETIME  | NO          |                                    |

## API 
- Use json format
- 200 response has `data` key
- 200 response for data list has `meta` key, which contains `total`, `perPage`, `page` keys. `total` is the total number of data, `perPage` is the number of data per page, `page` is the current page number.
- Non-200 response has `errors` key which type is array. Each element in error array has `path` and `message` key. `path` is an array type and `message` is string type.

### User API
#### POST /api/users
- Create a user
- Request body: 
```
{
  "name": string,
  "balance": number
}
```
- Response body: 
```
{
  "data": {
    "id": number,
    "name": string,
    "balance": number,
    "createdAt": string,
    "updatedAt": string
  }
}
```

#### GET /api/users/:id
- Get a user by id
- Request params:
    - id: user id
- Response body:
```
{
  "data": {
    "id": number,
    "name": string,
    "balance": number,
    "createdAt": string,
    "updatedAt": string
  }
}
```

#### GET /api/users?perPage=:perPage&page=:page&name=:name
- Get users list
- Request query:
  - perPage: number of data per page
  - page: current page number
  - name: filter by name
- Response body:
```
{
  "data": [
     {
       "id": number,
       "name": string,
       "balance": number,
       "createdAt": string,
       "updatedAt": string
     },
     {
       "id": number,
       "name": string,
       "balance": number,
       "createdAt": string,
       "updatedAt": string
     }
  ],
  "meta": {
    "total": number,
    "perPage": number,
    "page": number
  }
}
```

#### PUT /api/users/:id
- Update user name
- Request params:
    - id: user id
- Request body:
```
{
  "name": string,
}
```
- Response body:
```
{
  "data": {
    "id": number,
    "name": string,
    "balance": number,
    "createdAt": string,
    "updatedAt": string
  }
}
```

### Transaction API
#### POST /api/transactions
- Transaction
- type:
  - DEPOSIT=1
  - WITHDRAW=1
  - TRANSFER=3
- Request body:
```
{
  "userId": number,
  "toId": number, (required if type=TRANSFER)
  "amount": number,
  "type": string
}
```
- Response body: (DEPOSIT, WITHDRAW)
```
{
  "data": {
    "id": number,
    "type": number,
    "userId": number,
    "fromId": null,
    "toId": null,
    "amount": number,
    "createdAt": string,
    "updatedAt": string,
    "user": {
      "id": number,
      "name": string,
      "balance": number,
      "createdAt": string,
      "updatedAt": string
    },
    "from": null,
    "to": null
  }
}
```

- Response body: (TRANSFER)
```
{
  "data": {
    "id": number,
    "type": number,
    "userId": number,
    "fromId": null,
    "toId": null,
    "amount": number,
    "createdAt": string,
    "updatedAt": string,
    "user": {
      "id": number,
      "name": string,
      "balance": number,
      "createdAt": string,
      "updatedAt": string
    },
    "from": {
      "id": number,
      "name": string,
      "balance": number,
      "createdAt": string,
      "updatedAt": string
    },
    "to": {
      "id": number,
      "name": string,
      "balance": number,
      "createdAt": string,
      "updatedAt": string
    },
  }
}
```

#### GET /api/transactions?perPage=:perPage&page=:page&userId=:userId&timeFrom=:timeFrom&timeTo=:timeTo
- Get transaction list
- Request query:
    - perPage: number of data per page
    - page: current page number
    - userId: filter by userId (required)
    - timeFrom: filter by createdAt start from (ISO 8601)
    - timeTo: filter by createdAt end with (ISO 8601)
- Response body: 
```
{
  "data": [
    {
      "id": number,
      "type": number,
      "userId": number,
      "fromId": null,
      "toId": null,
      "amount": number,
      "createdAt": string,
      "updatedAt": string,
      "user": {
        "id": number,
        "name": string,
        "balance": number,
        "createdAt": string,
        "updatedAt": string
      },
      "from": null,
      "to": null
    }, 
    {
      "id": number,
      "type": number,
      "userId": number,
      "fromId": null,
      "toId": null,
      "amount": number,
      "createdAt": string,
      "updatedAt": string,
      "user": {
        "id": number,
        "name": string,
        "balance": number,
        "createdAt": string,
        "updatedAt": string
      },
      "from": {
        "id": number,
        "name": string,
        "balance": number,
        "createdAt": string,
        "updatedAt": string
      },
      "to": {
        "id": number,
        "name": string,
        "balance": number,
        "createdAt": string,
        "updatedAt": string
      },
    }
  ],
  "meta": {
    "total": number,
    "perPage": number,
    "page": number
  }
}
```

## Improvement
- Mock DB for testing for performance like in-memory mechanism. ex: [prismock](https://github.com/morintd/prismock) 
- Use another DB instead of SQLite for better performance and more functions.
- Migrate to TypeScript for better type checking.
- Add logger for each request, response and errors.
- Notify when server error happened.
