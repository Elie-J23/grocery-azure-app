# TODO - Grocery Azure Storage App

- [x] Inspect project scaffold and create base Node.js structure
- [x] Add configuration for Azure Storage connection (env-based)
- [x] Implement Azure Table Storage services (Customers, Products, Orders)
- [x] Implement Azure Blob Storage service for product images
- [x] Implement Azure Queue Storage service for order/inventory messages
- [x] Implement Azure Files logging service
- [x] Build Express routes and pages for:
  - [x] Customer registration
  - [x] Product management (with image upload)
  - [x] Product browsing
  - [x] Order placement
- [x] Add background queue processing endpoint/worker logic
- [x] Wire logging across all key workflows
- [x] Add setup instructions in README

## New change request - accessibility and order history

- [x] Add Order History service/query in table service
- [x] Add `/orders/history` route in server
- [x] Add resilient startup and safer route-level error handling
- [x] Update navbar links across all pages (include Order History)
- [x] Update homepage text and add suggested products section
- [x] Create Order History page view

## New change request - customer login, payment, and admin dashboard

- [ ] Add customer login page and login handler
- [ ] Add customer dashboard (order tracking + cancel + quick re-order links)
- [ ] Add payment method to order flow and persist in Azure Table order entity
- [ ] Add admin dashboard (customers, products, orders, remove product)
- [ ] Extend table service for admin/customer query and update operations
- [ ] Update navigation links across all relevant views
- [ ] Run thorough curl tests for all new and existing flows (happy/edge paths)
- [ ] Launch app in Microsoft Edge
