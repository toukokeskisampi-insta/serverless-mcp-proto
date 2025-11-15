use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_dynamodb::Client;
use serde::Serialize;
use chrono::DateTime;

#[derive(Serialize)]
pub struct DataPoint {
    pub start_date: String,
    pub start_time: String,
    pub end_timestamp: String,
    pub price: String,
}

pub fn build_data_point(price: String, start_timestamp: String, end_timestamp: String) -> DataPoint {
    let dt = DateTime::parse_from_rfc3339(&start_timestamp).unwrap();
    let start_date = dt.format("%Y-%m-%d").to_string();
    let start_time = dt.format("%H:%M:%SZ").to_string();
    DataPoint {
        start_date,
        start_time,
        end_timestamp,
        price,
    }
}

pub async fn build_client() -> Client {
    let endpoint_env = "http://dynamodb-local:8000";

    let config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .test_credentials()
        .endpoint_url(endpoint_env)
        .load()
        .await;
    let dynamodb_local_config = aws_sdk_dynamodb::config::Builder::from(&config).build();
    aws_sdk_dynamodb::Client::from_conf(dynamodb_local_config)
}

pub async fn write(client: &Client, item: DataPoint) -> Result<(), aws_sdk_dynamodb::Error> {
    let start_date_av = AttributeValue::S(item.start_date);
    let start_time_av = AttributeValue::S(item.start_time);
    let end_timestamp_av = AttributeValue::S(item.end_timestamp);
    let price_av = AttributeValue::S(item.price);

    let request = client
        .put_item()
        .table_name("ElectricityTable")
        .item("start_date", start_date_av)
        .item("start_time", start_time_av)
        .item("end_timestamp", end_timestamp_av)
        .item("price", price_av);

    let _resp = request.send().await?;

    Ok(())
}

pub async fn read(client: &Client, date: &str) -> Result<Vec<DataPoint>, aws_sdk_dynamodb::Error> {
    let result = client
        .query()
        .table_name("ElectricityTable")
        .key_condition_expression("#d = :d")
        .expression_attribute_names("#d", "start_date")
        .expression_attribute_values(":d", AttributeValue::S(date.to_string()))
        .send()
        .await?;

    Ok(result.items().into_iter().map(|i| {
        let start_date = i.get("start_date").unwrap().as_s().unwrap().to_string();
        let start_time = i.get("start_time").unwrap().as_s().unwrap().to_string();
        let end_timestamp = i.get("end_timestamp").unwrap().as_s().unwrap().to_string();
        let price = i.get("price").unwrap().as_s().unwrap().to_string();
        DataPoint { start_date, start_time, end_timestamp, price }
    }).collect())
}
