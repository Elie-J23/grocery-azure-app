# Grocery Azure Storage Web Application

This project demonstrates how to integrate the four core Azure Storage services in one web application:

- **Azure Table Storage**: Customers, Products, Orders
- **Azure Blob Storage**: Product images
- **Azure Queue Storage**: Order and inventory processing messages
- **Azure Files**: Application logs

## Features

- Customer registration
- Product creation with image upload
- Product browsing
- Order placement
- Queue-based background order processing endpoint
- Centralized logging in Azure Files

## Prerequisites

- Node.js 18+
- Azure Storage account (configured via connection string)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

- Copy `.env.example` to `.env`
- Update `AZURE_STORAGE_CONNECTION_STRING` and other values as needed

3. Start the application:

```bash
npm start
```

4. Open in browser:

- `http://localhost:3000`

## Main Workflows

### 1) Customer registration

- UI: `/customers/register`
- Saves customer profile in **Azure Table Storage**
- Writes registration event to **Azure Files** logs

### 2) Product management

- UI: `/products/new`
- Uploads product image to **Azure Blob Storage**
- Saves product metadata + image URL to **Azure Table Storage**
- Writes product/image events to **Azure Files** logs

### 3) Product browsing

- UI: `/`
- Loads products from **Azure Table Storage**
- Renders image URLs from **Azure Blob Storage**

### 4) Order processing

- UI flow:
  - Place order from `/orders/new/:productId`
- Stores order in **Azure Table Storage**
- Sends messages to **Azure Queue Storage** (`orders-queue`, `inventory-queue`)
- Logs order placement to **Azure Files**

### 5) Worker simulation

- Endpoint: `POST /worker/process-order`
- Reads one message from `orders-queue`
- Updates stock in **Azure Table Storage**
- Deletes processed queue message
- Writes processing logs to **Azure Files**

## Project Structure

```text
grocery-azure-app/
  src/
    config.js
    server.js
    services/
      tableService.js
      blobService.js
      queueService.js
      fileLogService.js
    views/
      index.ejs
      register.ejs
      new-product.ejs
      new-order.ejs
  .env
  .env.example
  package.json
  TODO.md
  README.md
```

## Notes

- This implementation is a practical educational scaffold and can be extended with:
  - authentication/authorization
  - validation and stronger error handling
  - robust background worker process (separate worker app)
  - inventory queue consumer implementation
  - pagination/filtering for product listings
