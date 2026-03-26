const cron = require("node-cron");
const { collection, getDocs } = require("firebase/firestore");
const { db } = require("../db/config");
const { productsTiendaNube } = require("../managers/product.manager");

const iniciarCronSync = () => {

  cron.schedule("*/10 * * * *", async () => {

    console.log("🕒 CRON Sync iniciado:", new Date().toISOString());

    const snapshot = await getDocs(collection(db, "clients"));

    for (const docSnap of snapshot.docs) {

      const client = docSnap.data();

      if (!client.clientId) {
        console.log("Documento ignorado (no es tienda):", docSnap.id);
        continue; // IMPORTANTE: usar continue, no return
      }

      try {

        console.log(`🔄 Sincronizando pedidos para ${client.clientId}`);

        await productsTiendaNube(client.clientId);

      } catch (error) {

        console.error(`❌ Error en sync para ${client.clientId}`, error.message);

      }

    }

    console.log("🟢 CRON Sync finalizado");

  });

};

module.exports = { iniciarCronSync };
