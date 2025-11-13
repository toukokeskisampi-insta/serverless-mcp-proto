FROM amazon/aws-cli

WORKDIR /app
COPY . .

CMD ["dynamodb","create-table","--table-name","ElectricityTable","--attribute-definitions","AttributeName=start_date,AttributeType=S","AttributeName=start_time,AttributeType=S","--key-schema","AttributeName=start_date,KeyType=HASH","AttributeName=start_time,KeyType=RANGE","--endpoint-url", "http://dynamodb-local:8000","--region","eu-north-1","--provisioned-throughput","ReadCapacityUnits=5,WriteCapacityUnits=5"]