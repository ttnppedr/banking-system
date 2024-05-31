FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run migrate:dev
RUN npm run migrate:test


EXPOSE 3000

CMD [ "node", "--watch=.", "app.js" ]
