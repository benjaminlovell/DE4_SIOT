# This file runs on an AWS EC2 Instance to scrape data from the OpenWeatherMaps API.

import time
import requests

# Define the destination for the posts.
THINGSPEAK_API_KEY = "PRIVATE"
THINGSPEAK_CHANNEL_ID = "PRIVATE"


# Defining the data source, lat and lon are set to Putney's values.
def get_weather_data():
    url = "https://api.openweathermap.org/data/2.5/weather?lat=51.5&lon=0.15&appid=962289672cd324072bac11bed7d74da8&units=metric"
    response = requests.get(url)
    # Obtain the json format data.
    data = response.json()
    print(data)
    humidity = data["main"]["humidity"]
    temperature = data["main"]["temp"]
    return humidity, temperature


# Function to re-direct this data back to a seperate ThingSpeak channel.
def send_to_thingspeak(humidity, temperature):
    url = "https://api.thingspeak.com/update"
    api_key = "PRIVATE"

    params = {"api_key": api_key, "field1": humidity, "field2": temperature}

    response = requests.post(url, params=params)
    return response.status_code


# Loop through the get and post requests at a 3 minute smapling rate - as discussed in the report.
while True:
    humidity, temperature = get_weather_data()
    print(humidity, temperature)
    status_code = send_to_thingspeak(humidity, temperature)
    print(f"Status Code: {status_code}")
    time.sleep(180)
