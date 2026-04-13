const { QueueServiceClient } = require("@azure/storage-queue");
const { connectionString, queueNames } = require("../config");

const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
const ordersQueueClient = queueServiceClient.getQueueClient(queueNames.orders);
const inventoryQueueClient = queueServiceClient.getQueueClient(queueNames.inventory);

async function initQueues() {
  await ordersQueueClient.createIfNotExists();
  await inventoryQueueClient.createIfNotExists();
}

async function enqueueOrderMessage(payload) {
  const message = Buffer.from(JSON.stringify(payload)).toString("base64");
  await ordersQueueClient.sendMessage(message);
}

async function enqueueInventoryMessage(payload) {
  const message = Buffer.from(JSON.stringify(payload)).toString("base64");
  await inventoryQueueClient.sendMessage(message);
}

async function dequeueOrderMessage() {
  const response = await ordersQueueClient.receiveMessages({
    numberOfMessages: 1,
    visibilityTimeout: 30,
  });

  if (!response.receivedMessageItems.length) return null;

  const msg = response.receivedMessageItems[0];
  const decoded = JSON.parse(Buffer.from(msg.messageText, "base64").toString());
  return {
    messageId: msg.messageId,
    popReceipt: msg.popReceipt,
    payload: decoded,
  };
}

async function deleteOrderMessage(messageId, popReceipt) {
  await ordersQueueClient.deleteMessage(messageId, popReceipt);
}

module.exports = {
  initQueues,
  enqueueOrderMessage,
  enqueueInventoryMessage,
  dequeueOrderMessage,
  deleteOrderMessage,
};
