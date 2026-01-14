const cron = require("node-cron");
const { productsTiendaNube } = require("../managers/products.manager");

// 🔁 Clientes a sincronizar automáticamente
const CLIENTES = ["praga", "chessi"];

// ⏱️ CRON: cada 10 minutos
// */10 * * * *  → cada 10 minutos
const iniciarCronSync = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("🕒 CRON Sync iniciado:", new Date().toISOString());

    for (const clientId of CLIENTES) {
      try {
        console.log(`🔄 Sincronizando pedidos para ${clientId}...`);
        await productsTiendaNube(clientId);
        console.log(`✅ Sync completado para ${clientId}`);
      } catch (error) {
        console.error(`❌ Error en sync para ${clientId}:`, error.message);
      }
    }

    console.log("🟢 CRON Sync finalizado");
  });
};

module.exports = { iniciarCronSync };
