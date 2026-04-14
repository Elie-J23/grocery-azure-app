const express = require("express");

console.log(
  "AZURE STORAGE:",
  process.env.AZURE_STORAGE_CONNECTION_STRING ? "SET" : "MISSING"
);

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Azure Express is running 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
