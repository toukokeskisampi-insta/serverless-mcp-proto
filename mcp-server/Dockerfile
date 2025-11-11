FROM node:lts-alpine

WORKDIR /app

RUN apk add --no-cache git
COPY ./dynamo-readonly-mcp .

RUN npm install

ENV AWS_ACCESS_KEY_ID=your_access_key
ENV AWS_SECRET_ACCESS_KEY=your_secret_key

RUN npm run build

CMD ["npm", "start"]
