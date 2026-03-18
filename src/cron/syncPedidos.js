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


// const cron = require("node-cron");
// const { productsTiendaNube } = require("../managers/product.manager");

// // 🔁 Clientes a sincronizar automáticamente
// const CLIENTES = ["praga", "chessi"];

// // ⏱️ CRON: cada 10 minutos
// // */10 * * * *  → cada 10 minutos
// const iniciarCronSync = () => {
//   cron.schedule("*/10 * * * *", async () => {
//     console.log("🕒 CRON Sync iniciado:", new Date().toISOString());

//     for (const clientId of CLIENTES) {
//       try {
//         console.log(`🔄 Sincronizando pedidos para ${clientId}...`);
//         await productsTiendaNube(clientId);
//         console.log(`✅ Sync completado para ${clientId}`);
//       } catch (error) {
//         console.error(`❌ Error en sync para ${clientId}:`, error.message);
//       }
//     }

//     console.log("🟢 CRON Sync finalizado");
//   });
// };

// module.exports = { iniciarCronSync };
