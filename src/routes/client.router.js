const express = require("express");
const router = express.Router();
const { getClientByEmail } = require("../managers/client.manager");

router.get("/me", getClientByEmail);

module.exports = router;