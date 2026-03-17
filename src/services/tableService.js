const { TableClient } = require("@azure/data-tables");
const { connectionString, tableNames } = require("../config");

function getClient(tableName) {
  return TableClient.fromConnectionString(connectionString, tableName);
}

const customersClient = getClient(tableNames.customers);
const productsClient = getClient(tableNames.products);
const ordersClient = getClient(tableNames.orders);

async function initTables() {
  await customersClient.createTable();
  await productsClient.createTable();
  await ordersClient.createTable();
}

async function addCustomer(customer) {
  const entity = {
    partitionKey: "CUSTOMER",
    rowKey: customer.customerId,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    createdAt: new Date().toISOString(),
  };
  await customersClient.createEntity(entity);
  return entity;
}

async function addProduct(product) {
  const entity = {
    partitionKey: "PRODUCT",
    rowKey: product.productId,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    stock: Number(product.stock),
    description: product.description || "",
    imageUrl: product.imageUrl || "",
    createdAt: new Date().toISOString(),
  };
  await productsClient.createEntity(entity);
  return entity;
}

async function listProducts() {
  const items = [];
  for await (const entity of productsClient.listEntities()) {
    items.push(entity);
  }
  return items;
}

async function getProduct(productId) {
  return productsClient.getEntity("PRODUCT", productId);
}

async function updateProductStock(productId, newStock) {
  const entity = await productsClient.getEntity("PRODUCT", productId);
  entity.stock = Number(newStock);
  await productsClient.updateEntity(entity, "Replace");
  return entity;
}

async function createOrder(order) {
  const entity = {
    partitionKey: "ORDER",
    rowKey: order.orderId,
    customerId: order.customerId,
    itemsJson: JSON.stringify(order.items),
    totalAmount: Number(order.totalAmount),
    status: order.status || "Pending",
    paymentMethod: order.paymentMethod || "Card",
    createdAt: new Date().toISOString(),
  };
  await ordersClient.createEntity(entity);
  return entity;
}

async function getOrder(orderId) {
  return ordersClient.getEntity("ORDER", orderId);
}

async function listOrders() {
  const items = [];
  for await (const entity of ordersClient.listEntities()) {
    items.push(entity);
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return items;
}

async function listCustomers() {
  const items = [];
  for await (const entity of customersClient.listEntities()) {
    items.push(entity);
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return items;
}

async function findCustomerByEmail(email) {
  const normalized = String(email || "").toLowerCase().trim();
  if (!normalized) return null;

  for await (const entity of customersClient.listEntities()) {
    if (String(entity.email || "").toLowerCase().trim() === normalized) {
      return entity;
    }
  }
  return null;
}

async function listOrdersByCustomer(customerId) {
  const all = await listOrders();
  return all.filter((o) => o.customerId === customerId);
}

async function updateOrderStatus(orderId, status) {
  const entity = await ordersClient.getEntity("ORDER", orderId);
  entity.status = status;
  entity.updatedAt = new Date().toISOString();
  await ordersClient.updateEntity(entity, "Replace");
  return entity;
}

async function cancelOrder(orderId) {
  return updateOrderStatus(orderId, "Cancelled");
}

async function deleteProduct(productId) {
  await productsClient.deleteEntity("PRODUCT", productId);
  return { productId, deleted: true };
}

module.exports = {
  initTables,
  addCustomer,
  addProduct,
  listProducts,
  getProduct,
  updateProductStock,
  createOrder,
  getOrder,
  listOrders,
  listCustomers,
  findCustomerByEmail,
  listOrdersByCustomer,
  updateOrderStatus,
  cancelOrder,
  deleteProduct,
};
