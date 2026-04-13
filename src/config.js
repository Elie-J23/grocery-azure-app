require("dotenv").config();

module.exports = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  tableNames: {
    customers: process.env.TABLE_CUSTOMERS || "Customers",
    products: process.env.TABLE_PRODUCTS || "Products",
    orders: process.env.TABLE_ORDERS || "Orders",
  },
  blobContainer: process.env.BLOB_CONTAINER || "product-images",
  queueNames: {
    orders: process.env.QUEUE_ORDERS || "orders-queue",
    inventory: process.env.QUEUE_INVENTORY || "inventory-queue",
  },
  fileShare: process.env.FILE_SHARE || "applogs",
  fileDirectory: process.env.FILE_DIRECTORY || "logs",
  logFileName: process.env.LOG_FILE_NAME || "grocery-app.log",
  port: Number(process.env.PORT || 3000),
};
