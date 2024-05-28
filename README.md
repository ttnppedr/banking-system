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
