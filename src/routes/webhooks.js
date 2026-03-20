const express = require("express");
const router = express.Router();

// 1. Tienda elimina la app
router.post("/store-redact", async (req, res) => {
  console.log("Webhook store redact:", req.body);

  // Acá podrías borrar datos de la tienda si quisieras
  res.status(200).send("OK");
});

// 2. Cliente pide borrar datos
router.post("/customers-redact", async (req, res) => {
  console.log("Webhook customer redact:", req.body);

  // Acá deberías borrar datos del cliente si los guardás
  res.status(200).send("OK");
});

// 3. Cliente pide ver datos
router.post("/customers-data-request", async (req, res) => {
  console.log("Webhook customer data request:", req.body);

  // Acá deberías devolver los datos del cliente
  res.status(200).send("OK");
});

module.exports = router;