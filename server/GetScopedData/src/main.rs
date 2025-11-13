use lambda_http::{run, service_fn, tracing, Body, Error, Request, Response};
use db_utils;
use chrono::Local;

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    let client = db_utils::build_client().await;

    // Get the current date
    let today = Local::now().format("%Y-%m-%d").to_string();

    let db_result = db_utils::read(&client, &today).await?;

    let json_array = serde_json::to_string(&db_result)?;

    let resp = Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(json_array.into())
        .map_err(Box::new)?;

    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
