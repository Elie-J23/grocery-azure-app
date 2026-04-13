const {
  ShareServiceClient,
} = require("@azure/storage-file-share");
const {
  connectionString,
  fileShare,
  fileDirectory,
  logFileName,
} = require("../config");

const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
const shareClient = shareServiceClient.getShareClient(fileShare);

async function initFileShare() {
  await shareClient.createIfNotExists();
  const dir = shareClient.getDirectoryClient(fileDirectory);
  await dir.createIfNotExists();
}

async function appendLog(message) {
  const dir = shareClient.getDirectoryClient(fileDirectory);
  const fileClient = dir.getFileClient(logFileName);
  const exists = await fileClient.exists();

  if (!exists) {
    await fileClient.create(1024 * 1024);
  }

  const download = await fileClient.download();
  const oldContent = await streamToString(download.readableStreamBody);
  const line = `${new Date().toISOString()} | ${message}\n`;
  const combined = oldContent + line;

  const size = Buffer.byteLength(combined, "utf8");
  await fileClient.create(Math.max(size, 1024 * 1024));
  await fileClient.uploadRange(combined, 0, size);
}

async function streamToString(readable) {
  if (!readable) return "";
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (d) => chunks.push(d.toString()));
    readable.on("end", () => resolve(chunks.join("")));
    readable.on("error", reject);
  });
}

module.exports = {
  initFileShare,
  appendLog,
};
