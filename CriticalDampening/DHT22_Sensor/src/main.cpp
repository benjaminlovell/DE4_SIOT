// This code sends Temperature and Humidity Readings from a DHT22 Sensor to a ThingSpeak Channel.

#include <Arduino.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define DHTPIN 33
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Setting up the wifi connection.
const char *ssid = "PRIVATE";
const char *password = "PRIVATE";

// Include ThingSpeak Write API key
const char *serverName = "http://api.thingspeak.com/update";
String apiKey = "PRIVATE";

void setup()
{
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.print("Connected to WIFI! IP Address: ");
  Serial.println(WiFi.localIP());

  // Initilising the DHT22 sensor.
  dht.begin();
}

int n = 0;

void loop()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    WiFiClient client;
    HTTPClient http;

    // Sampling rate of 3 minutes, derived from Nyquist's Theory.
    delay(180000);
    float humi = dht.readHumidity();
    float temp = dht.readTemperature();

    // Serial monitor logs for initial debugging.
    Serial.print("Humidity: ");
    Serial.println(humi);

    Serial.print("Temperature: ");
    Serial.println(temp);

    // If no value is read from the sensor, return a Serial error message.
    if (isnan(humi) || isnan(temp))
    {
      Serial.println("Value Failed");
      return;
    }

    // Beginning HTTP client session ThingSpeak.
    http.begin(client, serverName);

    // Add a header and create a string to be sent via HTTP to ThingSpeak.
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    // Specificing the correct fields.
    String httpRequestData = "api_key=" + apiKey + "&field1=" + String(temp) + "&field2=" + String(humi);

    // Sending an HTTP POST request with the data to ThingSpeak and store the response code
    int httpResponseData = http.POST(httpRequestData);

    // Printing the response code out.
    Serial.print("HTTP Temp Response code: ");
    Serial.println(httpResponseData);

    // Ending the HTTP client session
    http.end();
  }

  else
  {
    Serial.println("WiFi Disconnected");
  }
}