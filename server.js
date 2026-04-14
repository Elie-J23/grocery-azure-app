const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("*", (req, res) => {
  res.status(200).send("Minimal test app is running");
});

app.listen(PORT, () => {
  console.log(`Minimal test app listening on port ${PORT}`);
});
