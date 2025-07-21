const express = require ("express")
const router = express.Router()
const { getProducts, syncProducts } = require("../controllers/product.controller");
const { updateSituacion } = require("../managers/product.manager");



// Rutas para productos
router.get("/", getProducts);
router.get("/sync", syncProducts);

// Ruta para cambiar la situacion en el boton "Pendiente"
router.put("/:id/situacion", updateSituacion);

module.exports = router