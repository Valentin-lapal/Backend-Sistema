const { collection, getDocs, addDoc } = require("firebase/firestore");
const { db } = require("../db/config");
const fetch = require("node-fetch");
require('dotenv').config();


const productsTiendaNube = async () => {
    try {
        // const ID_TIENDA = process.env.ID_TIENDA;
        // const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

        
        // if (!ID_TIENDA || !ACCESS_TOKEN) {
        //     throw new Error("Faltan variables de entorno necesarias para la API de Tienda Nube.");
        // }
        const response = await fetch(`https://api.tiendanube.com/v1/5676879/products`, {
            method: "GET",
            headers: {
                "Authentication": `Bearer 7f1c9265408e91e6a47dcceedfc8e7914604bc48`,
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const products = await response.json();
        console.log("Productos obtenidos:", products);
        const productsCollection = collection(db, "products");

        for (const product of products) {
            await addDoc(productsCollection, product);
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
