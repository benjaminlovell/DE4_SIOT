//Google APP script that interprets the Base64 encoded images and places them into my drive.

function doPost(e) {
    const name = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd-HHmmss') + '.jpg';  
    const folderName = e.parameters.folder || 'ESP32-CAM';
    const data = Utilities.base64Decode(e.postData.contents);
    const blob = Utilities.newBlob(data, 'image/jpg', name);
  
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
  
    const file = folder.createFile(blob);
    return ContentService.createTextOutput('Done');
  }