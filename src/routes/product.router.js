const express = require ("express")
const router = express.Router()
const { getProducts, syncProducts, getHistory } = require("../controllers/product.controller");
const { updateSituacion } = require("../managers/product.manager");


// Rutas para productos
router.get("/", getProducts);
router.get("/sync", syncProducts);

// Historial (solo entregados) por rango de fechas
// Ejemplo: /api/products/history?clientId=praga&from=2025-12-01&to=2025-12-31
router.get("/history", getHistory);    

// Ruta para cambiar la situacion en el boton "Pendiente" (Pendiente / En curso / Entregado / Cancelado)
router.put("/:id/situacion", updateSituacion);

module.exports = router