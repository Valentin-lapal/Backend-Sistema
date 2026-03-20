const express = require("express")
const router = express.Router();
const productsRouter = require ("./product.router")
const oauthRoutes = require("./oauth");
const clientRouter = require("./client.router");
const webhooksRouter = require("./webhooks");


router.use("/products", productsRouter)

router.use("/oauth",oauthRoutes);

router.use("/clients", clientRouter);

router.use("/webhooks", webhooksRouter);


module.exports = router