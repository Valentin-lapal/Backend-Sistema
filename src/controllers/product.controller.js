const { getAllProducts, productsTiendaNube } = require("../managers/product.manager");

const getProducts = async (req, res) => {
    try {
        const products = await getAllProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const syncProducts = async (req, res) => {
    try {
        const result = await productsTiendaNube();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProducts, syncProducts };