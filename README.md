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

## Deploy

Deployment instructions coming soon. 
