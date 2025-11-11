# Sauna time
ElectricityTable contains the price of electricity in 15 minute intervals. Column start_date the date and is the partition key, start_time holds the time in HH:MM:ss format and is the sort key and price has the price as "cents/kWh". Use the query operation to fetch the data without using projection expression.

Today is 2025-11-10. The sauna needs to run for 30 minutes. I like to go to the sauna somewhere between 18:00 and 22:00. Preferably closer 20:00 if it costs just a one or two cents more than the cheapest hour.

At which time should I turn on the sauna today?


# Sauna time 2
ElectricityTable contains the price of electricity in 15 minute intervals. Use dynamodb-readonly.describe-table to get information about the table.

Use dynamodb-readonly.query-table without projection to fetch the required data to solve the problem. The price field is in "cent/kWh" format and the "time" uses "HH:MM:ss".

Today is 2025-11-10. The sauna needs to run for 30 minutes. I like to go to the sauna somewhere between 18:00 and 22:00. Preferably closer 20:00 if it costs just a one or two cents more than the cheapest hour.

At which time should I turn on the sauna today?


# Sauna time 3

ElectricityTable columns
- start_date, String, partition key
- start_time, String, sort key, "HH:MM:ss" format
- price, String, Price of electricity as "cents/kWh"

Use dynamodb-readonly.query-table without projection to fetch the required data. Pay close attention on the query syntax and remember to set the keys and values in the "ExpressionAttributeValues" object.

Today is 2025-11-10. The sauna needs to run for 30 minutes and uses 6kW of power. I like to go to the sauna somewhere between 18:00 and 22:00. Preferably around 20:00 but if it is over 10 cents more expensive than the cheapest option then go with the cheaper one.

At which time should I turn on the sauna today and how much will it cost in total?



What is the best time for turning on the sauna tomorrow?


# Multi purpose calculations

ElectricityTable columns
- start_date, String, partition key
- start_time, String, sort key, "HH:MM:ss" format
- price, String, Price of electricity as "cents/kWh" (Euros)

Use dynamodb-readonly.query-table without projection to fetch the required data. Pay close attention on the query syntax and remember to set the keys and values in the "ExpressionAttributeValues" object.

Today is 2025-11-10.

Consumption data:
- Sauna, power 6000W, runtime 30min. Sauna time should be between 18:00 and 22:00
- Dishwasher, power 500W, runtime 2 hours
- Washer + dryer, power 400W, runtime 5 hours

All machines can be run only between 07:00 and 22:00.

Calculate optimal continuous time to run each of these machines today so least amount of electricity is used.
