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
