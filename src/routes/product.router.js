const express = require ("express")
const router = express.Router()
const { getProducts, syncProducts } = require("../controllers/product.controller");

// Rutas para productos
router.get("/", getProducts);

router.get("/sync", syncProducts);

module.exports = router