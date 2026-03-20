const express = require("express");
const axios = require("axios");
const { db } = require("../db/config");
const { doc, setDoc } = require("firebase/firestore");

const router = express.Router();

router.get("/callback", async (req, res) => {

  try {

    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code missing");
    }

    // 1️⃣ Obtener access_token
    const response = await axios.post(
      "https://www.tiendanube.com/apps/authorize/token",
      {
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code
      }
    );

    const { access_token, user_id } = response.data;

    const storeId = user_id;

    console.log("Nueva tienda conectada:", storeId);


    // 2️⃣ Obtener nombre real de la tienda
    const storeResponse = await axios.get(
      `https://api.tiendanube.com/v1/${storeId}/store`,
      {
        headers: {
          Authentication: `bearer ${access_token}`,
          "User-Agent": "Líverval (liverval.logistica@gmail.com)"
        }
      }
    );

    const storeName = storeResponse.data.name;

    console.log("Nombre de tienda:", storeName);

    const clientId = `tn_${storeId}`;

    const tienda = {
      clientId,
      store_id: storeId,
      store_name: storeName,
      access_token,
      user_agent: "Líverval (liverval.logistica@gmail.com)",
      fecha_conexion: new Date().toISOString(),
      plataforma: "tiendanube",
    };

    const clientRef = doc(db, "clients", clientId);

    await setDoc(clientRef, tienda, { merge: true });

    console.log("Tienda guardada en Firestore:", tienda);

    return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");

  } catch (error) {

    console.error("Error OAuth:", error.response?.data || error.message);

    return res.status(500).send("Error conectando con Tiendanube");

  }

});

module.exports = router;
