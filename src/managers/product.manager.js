const { collection, getDocs, addDoc } = require("firebase/firestore");
const { db } = require("../db/config");
const fetch = require("node-fetch");
require('dotenv').config();


const productsTiendaNube = async () => {
    try {

        const ID_TIENDA = process.env.ID_TIENDA;
        const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
        const USER_AGENT = process.env.USER_AGENT;
        
        if (!ID_TIENDA || !ACCESS_TOKEN || !USER_AGENT) {
            throw new Error("Faltan variables de entorno necesarias para la API de Tienda Nube.");
        }
        const response = await fetch(`https://api.tiendanube.com/v1/${ID_TIENDA}/products`, {
            method: "GET",
            headers: {
                "Authentication": `bearer ${ACCESS_TOKEN}`,
                "User-Agent": `${USER_AGENT}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const products = await response.json();
        console.log("Productos obtenidos:", products);
        const productsCollection = collection(db, "products");

        for (const product of products) {
            const productData = {
                id: product.id,
                name: product.name?.es || "",
                description: product.description?.es || "",
                price: product.variants[0]?.price || "",
                position: product.variants[0]?.position || "",
                stock_management: product.variants[0]?.stock_management || "",
            };
            await addDoc(productsCollection, productData);
        }

        return { message: "Productos sincronizados con Firestore", products }; // Retorna el objeto con el mensaje y los productos
    } catch (error) {
        console.error("Error sincronizando productos:", error);
        throw error; 
    }
};



const getAllProducts = async () => {
    try {
      const productsCollection = collection(db, "products");
      const productsAlmacenados = await getDocs(productsCollection);
      const products = productsAlmacenados.docs.map(doc => ({ id: doc.id,...doc.data() }));
      return products;
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error; 
    }
};

module.exports = { getAllProducts, productsTiendaNube };
