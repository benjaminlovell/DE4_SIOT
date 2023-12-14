from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import io
from googleapiclient.http import MediaIoBaseDownload
import os
from google.auth.transport.requests import Request
from datetime import datetime, timedelta
import cv2
import face_recognition
from twilio.rest import Client
import requests


# Initialising ThingSpeak DHT22 Read Channel.
channel_id = "2360648"
api_key = "6OZ1LVUKJMLMJEE8"  # I dont mind keeping the read key here, you can only fetch data using it, so minimal security risk.
api_endpoint = f"https://api.thingspeak.com/channels/{channel_id}/feeds/last.json?api_key={api_key}"
response = requests.get(api_endpoint)

# ThingSpeak OWM Read Channel.
OWM_channel_id = "2365749"
OWM_api_key = "X3TCCD9UVIXBTSI8"  # I dont mind keeping the read key here, you can only fetch data using it, so minimal security risk.
OWM_api_endpoint = f"https://api.thingspeak.com/channels/{OWM_channel_id}/feeds/last.json?api_key={OWM_api_key}"
OWM_response = requests.get(OWM_api_endpoint)

# Fetching data from the DHT22 Channel.
if response.status_code == 200:
    data = response.json()

    # Extracting the latest field value
    latest_value = data.get("field2")
    latest_string = str(latest_value)

    print(f"Latest DHT22 Value: {latest_value}")
else:
    print(f"Error: Unable to retrieve data. Status code: {response.status_code}")

# Fetching data from the OWM Channel.
if OWM_response.status_code == 200:
    OWM_data = OWM_response.json()

    # Extracting the latest field value
    OWM_latest_value = OWM_data.get("field1")
    OWM_latest_string = str(OWM_latest_value)

    print(f"Latest OWM Value: {OWM_latest_value}")
else:
    print(f"Error: Unable to retrieve data. Status code: {response.status_code}")


# Twilio Setup Details.
twilio_sid = "PRIVATE"
auth_token = "PRIVATE"
twilio_phone_number = "PRIVATE"
benPhoneNumber = "PRIVATE"

client = Client(twilio_sid, auth_token)


# Read the OAuth details from my credentials file.
CLIENT_SECRET_FILE = "credentials.json"
API_NAME = "drive"
API_VERSION = "v3"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Load or create credentials
creds = None


# The code below allows me to run the script autonomosly as the toke file allows me
# to securely bypass the authentication pop-up when requesting data from Google Drive.
TOKEN_FILE = "token.json"
if os.path.exists(TOKEN_FILE):
    creds = Credentials.from_authorized_user_file(TOKEN_FILE)
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open(TOKEN_FILE, "w") as token:
        token.write(creds.to_json())


# Creating the Google Drive API service
service = build(API_NAME, API_VERSION, credentials=creds)
folder_id = "PRIVATE"


# Calculating the timestamp for one minute ago
one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
one_minute_ago_str = one_minute_ago.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

subfolder_name = "flatCamCaptures"
subfolder_path = os.path.join(os.getcwd(), subfolder_name)


# Load flatmate residents faces
benLovell = cv2.imread("residentsFaces/benID.jpg")  # 1 - ME
ben_encoding = face_recognition.face_encodings(benLovell)[0]

natKhan = cv2.imread("residentsFaces/natID.jpg")  # 2 - NAT
nat_encoding = face_recognition.face_encodings(natKhan)[0]

callumChau = cv2.imread("residentsFaces/callumID.jpg")  # 3 - Callum
callum_encoding = face_recognition.face_encodings(callumChau)[0]


# Listing files in the folder uploaded or modified in the last minute
results = (
    service.files()
    .list(
        q=f"'{folder_id}' in parents and modifiedTime > '{one_minute_ago_str}' and trashed=false"
    )
    .execute()
)
files = results.get("files", [])

if not files:
    print("No files found in the last minute.")
else:
    for file in files:
        # Download each file into the specified subfolder
        file_id = file["id"]
        file_path = os.path.join(subfolder_path, file["name"])
        print(f"Downloading {file_path}...")
        request = service.files().get_media(fileId=file_id)
        fh = io.FileIO(file_path, "wb")
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}%")

        # Perform facial recognition on the downloaded image
        img = cv2.imread(file_path)
        cv2.imshow("ESP32 Capture", img)
        img_encoding = face_recognition.face_encodings(img)[0]
        resultBen = face_recognition.compare_faces([ben_encoding], img_encoding)
        print("Ben: " + str(resultBen))
        resultNat = face_recognition.compare_faces([nat_encoding], img_encoding)
        print("Nat: " + str(resultNat))
        resultCallum = face_recognition.compare_faces([callum_encoding], img_encoding)
        print("Callum: " + str(resultCallum))

        if resultBen[0]:  # Check if the first face is a match.
            if latest_value > OWM_latest_value:
                message = client.messages.create(
                    body=f"Welcome home Ben! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you NEED TO open up a window!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,  # sending me the data-backed prompt message.
                )
                print("Text message sent.")
            else:
                message = client.messages.create(
                    body=f"Welcome home Ben! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you should keep your windows shut!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,
                )
                print("Text message sent.")

        elif resultNat[0]:  # Check if the first face is a match.
            if latest_value > OWM_latest_value:
                message = client.messages.create(
                    body=f"Welcome home Nat! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you NEED TO open up a window!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,
                )
                print("Text message sent.")
            else:
                message = client.messages.create(
                    body=f"Welcome home Nat! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you should keep your windows shut!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,
                )
                print("Text message sent.")

        elif resultCallum[0]:  # Check if the first face is a match.
            if latest_value > OWM_latest_value:
                message = client.messages.create(
                    body=f"Welcome home Callum! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you NEED TO open up a window!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,
                )
                print("Text message sent.")
            else:
                message = client.messages.create(
                    body=f"Welcome home Callum! The indoor humidity is: {latest_string}. The outdoor humidity is: {OWM_latest_string}. I think you should keep your windows shut!",
                    from_=twilio_phone_number,
                    to=benPhoneNumber,
                )
                print("Text message sent.")

    print("Download and facial recognition complete.")
