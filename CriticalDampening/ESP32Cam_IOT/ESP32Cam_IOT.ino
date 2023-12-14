#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "Base64.h"
#include "esp_camera.h"

// CAMERA_MODEL_AI_THINKER GPIO.
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// LED Flash PIN (GPIO 4)
#define FLASH_LED_PIN 4

// WiFi ssid and password.
const char *ssid = "PRIVATE";
const char *password = "PRIVATE";

// Google Drive Deployment ID
String myDeploymentID = "PRIVATE";
String myMainFolderName = "ESP32-CAM";

// Initialising the pressure sensors on the Doormat.
const int piezoPin = A0;
const int piezoThreshold = 450;

// Variable to set capture photo with LED Flash.
bool LED_Flash_ON = true;

WiFiClientSecure client;

// Function for sending photos to Google Drive.
void SendCapturedPhotos()
{
  const char *host = "script.google.com";
  Serial.println();
  Serial.println("-----------");
  Serial.println("Connect to " + String(host));

  client.setInsecure();

  // The Flash LED blinks once to indicate connection start.
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(100);
  digitalWrite(FLASH_LED_PIN, LOW);
  delay(100);

  // The process of connecting, capturing and sending photos to Google Drive.
  if (client.connect(host, 443))
  {
    Serial.println("Connection successful.");
    if (LED_Flash_ON == true)
    {
      digitalWrite(FLASH_LED_PIN, HIGH);
      delay(100);
    }

    // Taking a photo.
    for (int i = 0; i <= 3; i++)
    {
      camera_fb_t *fb = NULL;
      fb = esp_camera_fb_get();
      if (!fb)
      {
        Serial.println("Camera capture failed");
        Serial.println("Restarting the ESP32 CAM.");
        delay(1000);
        ESP.restart();
        return;
      }
      esp_camera_fb_return(fb);
      delay(200);
    }

    // Turning the flash back off.
    if (LED_Flash_ON == true)
      digitalWrite(FLASH_LED_PIN, LOW);

    Serial.println("Taking a photo was successful.");

    // Sending image to Google Drive.
    Serial.println();
    Serial.println("Sending image to Google Drive.");
    Serial.println("Size: " + String(fb->len) + "byte");

    // Setting the destination.
    String url = "/macros/s/" + myDeploymentID + "/exec?folder=" + myMainFolderName;

    client.println("POST " + url + " HTTP/1.1");
    client.println("Host: " + String(host));
    client.println("Transfer-Encoding: chunked");
    client.println();

    // Base64 setting the chunk size
    int fbLen = fb->len;
    char *input = (char *)fb->buf;
    int chunkSize = 3 * 1000;
    int chunkBase64Size = base64_enc_len(chunkSize);
    char output[chunkBase64Size + 1];

    Serial.println();
    int chunk = 0;
    for (int i = 0; i < fbLen; i += chunkSize)
    {
      // Base64 encoding the image into ASCII format
      int l = base64_encode(output, input, min(fbLen - i, chunkSize));
      client.print(l, HEX);
      client.print("\r\n");
      client.print(output);
      client.print("\r\n");
      delay(100);
      input += chunkSize;
      Serial.print(".");
      chunk++;
      if (chunk % 50 == 0)
      {
        Serial.println();
      }
    }
    client.print("0\r\n");
    client.print("\r\n");

    esp_camera_fb_return(fb);

    Serial.println("Waiting for response.");
    long int StartTime = millis();
    while (!client.available())
    {
      Serial.print(".");
      delay(100);
      if ((StartTime + 10 * 1000) < millis())
      {
        Serial.println();
        Serial.println("No response.");
        break;
      }
    }
    Serial.println();
    while (client.available())
    {
      Serial.print(char(client.read()));
    }

    // Flash LED blinks once as an indicator of successfully sending photos to Google Drive.
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(500);
    digitalWrite(FLASH_LED_PIN, LOW);
    delay(500);
  }
  else
  {
    Serial.println("Connected to " + String(host) + " failed.");
  }
  Serial.println("-----------");
  client.stop();
}

void setup()
{
  // Disabling brownout detector.
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  Serial.println();
  delay(1000);

  pinMode(FLASH_LED_PIN, OUTPUT);

  // Setting the ESP32 WiFi to station mode.
  Serial.println();
  Serial.println("Setting the ESP32 WiFi to station mode.");
  WiFi.mode(WIFI_STA);

  // Connecitng to WIFI
  Serial.println();
  Serial.print("Connecting to : ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  digitalWrite(FLASH_LED_PIN, LOW);

  Serial.println();
  Serial.print("Successfully connected to ");
  Serial.println(ssid);

  Serial.println();
  Serial.println("Set the camera ESP32 CAM...");

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Pre-alloacting large bufffers.
  if (psramFound())
  {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10; // 0-63 lower number means higher quality
    config.fb_count = 2;
  }
  else
  {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 8;
    config.fb_count = 1;
  }

  // Initializing the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK)
  {
    Serial.printf("Camera init failed with error 0x%x", err);
    Serial.println();
    Serial.println("Restarting the ESP32 CAM.");
    delay(1000);
    ESP.restart();
  }

  sensor_t *s = esp_camera_sensor_get();

  s->set_framesize(s, FRAMESIZE_SXGA);

  Serial.println("Setting the camera successfully.");
  Serial.println();

  delay(1000);

  Serial.println();
  Serial.println("ESP32CAM that takes a photo once the Smart Doormat is triggered");
  Serial.println();
  delay(2000);
}

void loop()
{
  // Piezo reading triggers the camera upon a step.
  int piezoReading = analogRead(piezoPin);

  if (piezoReading > piezoThreshold)
  {
    SendCapturedPhotos();
  };
  // Sampling rate is half of the average step - 0.5s
  delay(250);
}
