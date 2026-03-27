const express = require("express");
const axios = require("axios");
const { db } = require("../db/config");
const { doc, setDoc, getDoc } = require("firebase/firestore");

const router = express.Router();

// 🔥 Memoria temporal para evitar procesar el mismo code dos veces
const processedCodes = new Set();

router.get("/callback", async (req, res) => {
  const { code } = req.query;

  console.log("🔵 OAuth callback recibido");
  console.log("Query params:", req.query);

  // ❌ 1. Validación obligatoria
  if (!code) {
    console.log("⛔ Callback sin code → acceso inválido");

    return res.status(400).send(`
      <h2>Error de instalación</h2>
      <p>No se recibió el código de autorización.</p>
      <p>Instalá la app nuevamente desde Tiendanube.</p>
    `);
  }

  // 🔁 2. Evitar duplicados
  if (processedCodes.has(code)) {
    console.log("⚠️ Code ya procesado, ignorando duplicado");
    return res.send("OK");
  }

  processedCodes.add(code);

  try {
    // 🔐 3. Intercambio de code por token
    console.log("🔑 Intercambiando code por access_token...");

    const tokenResponse = await axios.post(
      "https://www.tiendanube.com/apps/authorize/token",
      {
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
      }
    );

    const { access_token, user_id } = tokenResponse.data;
    const storeId = user_id;

    console.log("✅ Token obtenido");
    console.log("Store ID:", storeId);

    // 🏪 4. Obtener datos de la tienda
    console.log("📦 Obteniendo datos de la tienda...");

    const storeResponse = await axios.get(
      `https://api.tiendanube.com/v1/${storeId}/store`,
      {
        headers: {
          Authentication: `bearer ${access_token}`,
          "User-Agent": "Líverval (liverval.logistica@gmail.com)",
        },
      }
    );

    const storeName = storeResponse.data.name?.es || "Sin nombre";

    console.log("🏪 Nombre tienda:", storeName);

    const clientId = `tn_${storeId}`;
    const clientRef = doc(db, "clients", clientId);

    // 🔎 5. Verificar si ya existe (reinstalación)
    const existingClient = await getDoc(clientRef);

    if (existingClient.exists()) {
      console.log("♻️ Tienda ya existente → actualizando datos");
    } else {
      console.log("🆕 Nueva tienda conectada");
    }

    // 💾 6. Guardar en Firestore
    const tienda = {
      clientId,
      store_id: storeId,
      store_name: storeName,
      access_token,
      user_agent: "Líverval (liverval.logistica@gmail.com)",
      fecha_conexion: new Date().toISOString(),
      plataforma: "tiendanube",
    };

    await setDoc(clientRef, tienda, { merge: true });

    console.log("💾 Tienda guardada correctamente");

    // 🚀 7. Redirección final (SOLO SI TODO SALIÓ BIEN)
    return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");

  } catch (error) {
    const err = error.response?.data || error.message;

    console.error("❌ Error OAuth:", err);

    // ⚠️ Caso común: code ya usado
    if (error.response?.data?.error === "invalid_grant") {
      console.log("⚠️ Code ya usado → ignorando duplicado correctamente");
      return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");
    }

    // ❌ Error real → mostrar
    return res.status(500).send(`
      <h2>Error de conexión</h2>
      <p>No se pudo completar la integración con Tiendanube.</p>
      <p>Intentá nuevamente.</p>
    `);
  }
});

module.exports = router;

// router.get("/callback", async (req, res) => {

//   try {

//     const { code } = req.query;

//     if (!code) {
      // return res.status(400).send("Authorization code missing");
    //   console.log("Callback sin code, ignorando...");
    //   return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");
    // }

    // 1️⃣ Obtener access_token
    // const response = await axios.post(
    //   "https://www.tiendanube.com/apps/authorize/token",
    //   {
    //     client_id: process.env.TIENDANUBE_CLIENT_ID,
    //     client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
    //     grant_type: "authorization_code",
    //     code: code
    //   }
    // );

    // const { access_token, user_id } = response.data;

    // const storeId = user_id;

    // console.log("Nueva tienda conectada:", storeId);


    // 2️⃣ Obtener nombre real de la tienda
  //   const storeResponse = await axios.get(
  //     `https://api.tiendanube.com/v1/${storeId}/store`,
  //     {
  //       headers: {
  //         Authentication: `bearer ${access_token}`,
  //         "User-Agent": "Líverval (liverval.logistica@gmail.com)"
  //       }
  //     }
  //   );

  //   const storeName = storeResponse.data.name?.es || "Sin nombre";

  //   console.log("Nombre de tienda:", storeName);

  //   const clientId = `tn_${storeId}`;

  //   const tienda = {
  //     clientId,
  //     store_id: storeId,
  //     store_name: storeName,
  //     access_token,
  //     user_agent: "Líverval (liverval.logistica@gmail.com)",
  //     fecha_conexion: new Date().toISOString(),
  //     plataforma: "tiendanube",
  //   };

  //   const clientRef = doc(db, "clients", clientId);

  //   await setDoc(clientRef, tienda, { merge: true });

  //   console.log("Tienda guardada en Firestore:", tienda);

  //   console.log("CODE:", code);

  //   console.log("TOKEN RESPONSE:", response.data);

  //   console.log("STORE RESPONSE:", storeResponse.data);

  //   console.log("GUARDANDO EN FIRESTORE...");

  //   return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");

  // } catch (error) {

  //   console.error("Error OAuth:", error.response?.data || error.message);

  //   return res.redirect("https://sistema.liverval.com.ar/integracion-exitosa");

    // return res.status(500).send("Error conectando con Tiendanube");

//   }

// });

// module.exports = router;
