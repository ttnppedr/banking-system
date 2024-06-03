# This is a simple banking system

## Deploy steps
1. Clone the repository `git clone git@github.com:ttnppedr/banking-system.git`
2. Cd into the repository `cd banking-system`
3. Build Docker image `docker build -t banking-system .`
4. Run the Docker container 
   - Start container first time : `docker run -d -p 3000:3000 -v .:/app -v /app/node_modules --name bank banking-system`
   - Start container: `docker start bank`
   - Stop container: `docker stop bank`
5. Access the application at `http://localhost:3000`

## DB Schema
- User

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id          | INTEGER   | NO          |
| name        | TEXT      | NO          |
| balance     | INTEGER   | NO          |
| createdAt   | DATETIME  | NO          |
| updatedAt   | DATETIME  | NO          |

- Transaction

| column_name | data_type | is_nullable | memo                               |
|-------------|-----------|-------------|------------------------------------|
| id          | INTEGER   | NO          |                                    |
| type        | INTEGER   | NO          | DEPOSIT=1, WITHDRAW=2, TRANSFER=3  |
| userId      | INTEGER   | NO          |                                    |
| fromId      | INTEGER   | YES         | userId if type=3                   |
| toId        | INTEGER   | YES         | userId if type=3                   |
| amount      | INTEGER   | NO          |                                    |
| balance     | INTEGER   | NO          |                                    |
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
