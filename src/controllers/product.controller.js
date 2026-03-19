const { getAllProducts, productsTiendaNube, getHistoryByRange } = require("../managers/product.manager");


const getProducts = async (req, res) => {
    try {
        const clientId = req.query.clientId || null; // null = todos
        const products = await getAllProducts(clientId);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const syncProducts = async (req, res) => {
    try {
        const clientId = req.query.clientId || null;
        const result = await productsTiendaNube(clientId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getHistory = async (req, res) => {
  try {
    const clientId = req.query.clientId || null; // opcional
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Los parámetros 'from' y 'to' (YYYY-MM-DD) son obligatorios"
      });
    }

    const history = await getHistoryByRange({ clientId, from, to });
    res.json(history);
  } catch (error) {
    console.error("Error en getHistory:", error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = { getProducts, syncProducts, getHistory };