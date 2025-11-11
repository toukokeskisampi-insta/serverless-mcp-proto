FROM rust:latest

RUN cargo install cargo-lambda

WORKDIR /app
COPY . .

CMD ["cargo", "lambda", "watch"]