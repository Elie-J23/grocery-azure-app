### Information Gathered
- **User feedback**: Detailed plan to standardize UI using single `/styles.css` source of truth
- **styles.css**: Has most base styles, missing some utilities (`notice-error`, `text-center`, `full-width`, `table-wrap`, `app-table`, `two-col`, `--danger-bg`)
- **Key pages analyzed**: index.ejs, login.ejs, new-product.ejs, admin-dashboard.ejs all have inline styles + page-level `<style>` blocks breaking consistency
- **Admin dashboard**: Inline table styles, needs `table-wrap`/`app-table` classes
- **Server**: Running on port 3000 ✅ All core Azure services connected

### Plan
**Step 1**: Update `styles.css` with complete CSS variables + all utilities
**Step 2**: Update all pages - remove `<style>` blocks + inline styles, use shared classes
**Step 3**: Standardize nav across all pages
**Step 4**: Fix tables/buttons/forms consistently
**Step 5**: Test all pages reload

### Dependent Files to be edited
```
✅ src/public/styles.css (primary)
✅ src/views/index.ejs
✅ src/views/login.ejs  
✅ src/views/new-product.ejs
✅ src/views/admin-dashboard.ejs
✅ src/views/register.ejs
✅ src/views/customer-dashboard.ejs
✅ src/views/order-history.ejs
✅ src/views/new-order.ejs
```

### Followup steps
1. `cd grocery-azure-app && npm start` (restart server)
2. Test all pages: `/`, `/customers/register`, `/admin/dashboard`, etc.
3. Visual verification + curl tests
4. attempt_completion

**Approve this plan to proceed with edits?**

