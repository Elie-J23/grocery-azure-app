const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("./config");
const {
  initTables,
  addCustomer,
  addProduct,
  listProducts,
  getProduct,
  updateProductStock,
  createOrder,
  listOrders,
  listCustomers,
  findCustomerByEmail,
  listOrdersByCustomer,
  cancelOrder,
  deleteProduct,
  updateOrderStatus,
} = require("./services/tableService");
const { initBlobContainer, uploadProductImage } = require("./services/blobService");
const {
  initQueues,
  enqueueOrderMessage,
  enqueueInventoryMessage,
  dequeueOrderMessage,
  deleteOrderMessage,
} = require("./services/queueService");
const { initFileShare, appendLog } = require("./services/fileLogService");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); 
app.use(require("express-session")({ 
  secret: "grocery-azure-session", 
  resave: false, 
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
})); 

app.get("/", async (req, res) => {
  try {
    const products = await listProducts();
    res.render("index", { products, error: null });
  } catch (err) {
    res.render("index", {
      products: [],
      error: `Unable to load products right now: ${err.message}`,
    });
  }
});

app.get("/customers/register", (req, res) => {
  res.render("register");
});

app.get("/customers/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/customers/login", async (req, res) => {
  try {
    const customer = await findCustomerByEmail(req.body.email);
    if (!customer) {
      return res.status(404).render("login", { error: "Customer not found. Please register first." });
    }
    return res.redirect(`/customers/dashboard/${customer.rowKey}`);
  } catch (err) {
    return res.status(500).render("login", { error: `Login failed: ${err.message}` });
  }
});

app.post("/customers/register", async (req, res) => {
  const customerId = uuidv4();
  await addCustomer({
    customerId,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  });
  await appendLog(`Customer registered | customerId=${customerId} | email=${req.body.email}`);
  res.redirect("/");
});

app.get("/products/new", (req, res) => {
  res.render("new-product");
});

app.post("/products", upload.single("image"), async (req, res) => {
  let imageUrl = "";
  if (req.file) {
    const filename = `${Date.now()}-${req.file.originalname}`;
    imageUrl = await uploadProductImage(req.file.buffer, filename, req.file.mimetype);
    await appendLog(`Product image uploaded | blob=${filename}`);
  }

  const productId = uuidv4();
  await addProduct({
    productId,
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    stock: req.body.stock,
    description: req.body.description,
    imageUrl,
  });
  await appendLog(`Product created | productId=${productId} | name=${req.body.name}`);
  res.redirect("/");
});

app.get("/orders/new/:productId", async (req, res) => {
  try {
    const product = await getProduct(req.params.productId);
    res.render("new-order", { product, error: null });
  } catch (err) {
    res.status(500).render("new-order", {
      product: {
        rowKey: req.params.productId,
        name: "Unavailable product",
        price: 0,
        stock: 0,
      },
      error: `Unable to load product: ${err.message}`,
    });
  }
});

app.get("/orders/history", async (req, res) => {
  try {
    const orders = await listOrders();
    res.render("order-history", { orders, error: null });
  } catch (err) {
    res.render("order-history", {
      orders: [],
      error: `Unable to load order history right now: ${err.message}`,
    });
  }
});

app.get("/customers/dashboard/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const [orders, products] = await Promise.all([listOrdersByCustomer(customerId), listProducts()]);
    res.render("customer-dashboard", {
      customerId,
      orders,
      products,
      error: null,
    });
  } catch (err) {
    res.status(500).render("customer-dashboard", {
      customerId: req.params.customerId,
      orders: [],
      products: [],
      error: `Unable to load customer dashboard: ${err.message}`,
    });
  }
});

app.get("/admin/dashboard", async (req, res) => {
  try {
    const [customers, products, orders] = await Promise.all([listCustomers(), listProducts(), listOrders()]);
    res.render("admin-dashboard", { customers, products, orders, error: null });
  } catch (err) {
    res.status(500).render("admin-dashboard", {
      customers: [],
      products: [],
      orders: [],
      error: `Unable to load admin dashboard: ${err.message}`,
    });
  }
});

app.post("/orders", async (req, res) => {
  const orderId = uuidv4();
  const product = await getProduct(req.body.productId);
  const quantity = Number(req.body.quantity);
  const totalAmount = Number(product.price) * quantity;

  await createOrder({
    orderId,
    customerId: req.body.customerId,
    items: [
      {
        productId: req.body.productId,
        quantity,
      },
    ],
    totalAmount,
    status: "Pending",
    paymentMethod: req.body.paymentMethod || "Card",
  });

  await enqueueOrderMessage({
    event: "PROCESS_ORDER",
    orderId,
    productId: req.body.productId,
    quantity,
  });

  await enqueueInventoryMessage({
    event: "INVENTORY_UPDATE_REQUESTED",
    orderId,
    productId: req.body.productId,
    quantity,
  });

  await appendLog(
    `Order placed | orderId=${orderId} | productId=${req.body.productId} | qty=${quantity} | payment=${req.body.paymentMethod || "Card"}`
  );
  res.redirect(`/customers/dashboard/${req.body.customerId}`);
});

app.post("/orders/:orderId/cancel", async (req, res) => {
  try {
    await cancelOrder(req.params.orderId);
    await appendLog(`Order cancelled | orderId=${req.params.orderId}`);
    res.redirect("back");
  } catch (err) {
    res.status(500).send(`Failed to cancel order: ${err.message}`);
  }
});

app.post("/admin/products/:productId/delete", async (req, res) => {
  try {
    await deleteProduct(req.params.productId);
    await appendLog(`Product deleted | productId=${req.params.productId}`);
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send(`Failed to delete product: ${err.message}`);
  }
});

app.post("/admin/orders/:orderId/status", async (req, res) => {
  try {
    await updateOrderStatus(req.params.orderId, req.body.status || "Pending");
    await appendLog(`Order status updated | orderId=${req.params.orderId} | status=${req.body.status || "Pending"}`);
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send(`Failed to update order status: ${err.message}`);
  }
});

app.post("/worker/process-order", async (req, res) => {
  const message = await dequeueOrderMessage();
  if (!message) {
    return res.json({ status: "No messages in queue" });
  }

  const { orderId, productId, quantity } = message.payload;
  const product = await getProduct(productId);
  const currentStock = Number(product.stock);
  const newStock = Math.max(currentStock - Number(quantity), 0);
  await updateProductStock(productId, newStock);

  await appendLog(
    `Order processed | orderId=${orderId} | productId=${productId} | oldStock=${currentStock} | newStock=${newStock}`
  );

  await deleteOrderMessage(message.messageId, message.popReceipt);

  return res.json({
    status: "Processed",
    orderId,
    productId,
    oldStock: currentStock,
    newStock,
  });
});

async function bootstrap() {
  // await initTables();
  //await initBlobContainer();
  //await initQueues();
  //await initFileShare();
  //await appendLog("Application initialized");
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Grocery app running on port ${PORT}`);
});

bootstrap()
  .then(() => {
    console.log("Azure services initialized successfully.");
  })
  .catch((err) => {
    console.error("Startup warning: Azure services init failed.", err.message);
    console.error("App is running; fix Azure service configuration and retry operations.");
  });

