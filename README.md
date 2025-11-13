# Serverless MCP prototype

> Note: This project is a work-in-progress and should not be deployed to AWS (yet)

This repository contains:
- CloudFormation templates for creating the infrastucure (WIP)
- Rust lambdas for loading/reading data from DynamoDB
- MCP server/client to allow LLMs to read data from DynamoDB

![alt architecture](https://github.com/toukokeskisampi-insta/serverless-mcp-proto/blob/master/architecture.png?raw=true)

## Requirements

- Ollama installed locally https://ollama.com/
- Docker/podman + docker-compose
- Can't remeber what else, maybe some rust stuff if you wan't to build them on your own machine also

## Database + Lambda local setup

### Local environment setup

Run the docker compose project inside `./rust-serverless`

``` bash
docker-compose up --build
```

On the first run uncomment the "deploy-table" part in "docker-compose.yaml" so the table is created.

Then you can use the `test.sh` to call the loader function and the getter function. Or just do it from command line.

### Creating new Rust lambdas

``` bash
cargo lambda new YOUR_FUNCTION_NAME
```

### Function template

``` rust
use lambda_runtime::{service_fn, LambdaEvent, Error};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(func);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn func(event: LambdaEvent<Value>) -> Result<Value, Error> {
    let (event, _context) = event.into_parts();
    let first_name = event["firstName"].as_str().unwrap_or("world");

    Ok(json!({ "message": format!("Hello, {}!", first_name) }))
}
```

## MCP Client / Server

Follow instructions for installing client in https://github.com/jonigl/mcp-client-for-ollama

Example start command (inside the `mcp-clien` folder):
``` bash
uvx ollmcp --servers-json ./servers.json -m gpt-oss
```

## MCP proxy
```
Client --> MCP proxy --> Tool LLM --> MCP Server
              |                           |
              |-----> Request db <--------|
```

1. When client needs something queried it creates a concise natural language or structured request which is fed to the "tool specialist LLM"
    * A hash will be created from the query and used as a "requestId"
    * Preferably a hash that can be checked for similarity
2. Tool LLM interprets and attempts to do the query
    * Store the MCP call the Tool LLM was trying to do in "request" field in "Request db"
    * Query successful -> Store result in "success" field in "Request db"
    * Query unsuccessful -> Append result in "error" field in "Request db" and try again with the error added to prompt (until MAX_RETRIES)
3. On subsequent invocations the "Request db" can be checked for similar requests and those can be used as a starting point for the next request. If the request is a 100% match this could also work like a cache (just keep in mind that "success" is not the same as "correct")
4. The "Request db" contents can be used to fine tune the Tool LLM.

Problem: Electricity data is available at most for "end of tomorrow" so the "time window" will always be changing
- Tool LLM should still run the query and return an empty array
- But then query with "2026-01-01" will get cached with an "empty array" in result
- Solution is to add TTL for request db items or purge them some other way
- Relative times do work correctly since "day after tomorrow" will always be empty

## Deploy

Deployment instructions coming soon. 
