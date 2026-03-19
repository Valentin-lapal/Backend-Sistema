const express = require("express")
const router = express.Router();
const productsRouter = require ("./product.router")
const oauthRoutes = require("./oauth");
const clientRouter = require("./client.router");


router.use("/products", productsRouter)

router.use("/oauth",oauthRoutes);

router.use("/clients", clientRouter);

module.exports = router