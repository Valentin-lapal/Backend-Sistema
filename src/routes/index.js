const express = require("express")
const router = express.Router();
const productsRouter = require ("./product.router")
const oauthRoutes = require("./oauth");


router.use("/products", productsRouter)

router.use("/oauth",oauthRoutes);


module.exports = router