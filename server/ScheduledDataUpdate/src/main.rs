use lambda_http::{run, service_fn, tracing, Body, Error, Request, Response};
use db_utils;
use serde_json::Value;
use reqwest;

async fn function_handler(_event: Request) -> Result<Response<Body>, Error> {
    let client = db_utils::build_client().await;

    let resp = reqwest::get("https://api.porssisahko.net/v2/latest-prices.json")
        .await
        .unwrap();
    let body = resp.text().await.unwrap();
    let json: Value = serde_json::from_str(&body).unwrap();

    if let Some(prices) = json["prices"].as_array() {
        for price_data in prices {
            let price = price_data["price"].as_f64().unwrap_or(0.0);
            let start_date = price_data["startDate"].as_str().unwrap_or("");
            let end_date = price_data["endDate"].as_str().unwrap_or("");

            let data_point = db_utils::build_data_point(
                price.to_string(),
                start_date.to_string(),
                end_date.to_string(),
            );

            let _ = db_utils::write(&client, data_point).await;
        }
    }

    let message = format!("Write completed");
    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(message.into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    run(service_fn(function_handler)).await
}
