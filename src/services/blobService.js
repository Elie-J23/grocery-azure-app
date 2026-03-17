const { BlobServiceClient } = require("@azure/storage-blob");
const { connectionString, blobContainer } = require("../config");

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(blobContainer);

async function initBlobContainer() {
  await containerClient.createIfNotExists({ access: "blob" });
}

async function uploadProductImage(fileBuffer, fileName, mimeType) {
  const blobClient = containerClient.getBlockBlobClient(fileName);
  await blobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: mimeType || "application/octet-stream",
    },
  });
  return blobClient.url;
}

module.exports = {
  initBlobContainer,
  uploadProductImage,
};
