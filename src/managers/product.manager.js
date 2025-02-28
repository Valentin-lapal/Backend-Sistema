const { collection, getDocs, addDoc } = require("firebase/firestore");
const { db } = require("../db/config");
const fetch = require("node-fetch");
require('dotenv').config();


const productsTiendaNube = async () => {
    try {
        console.log("ID_TIENDA:", process.env.ID_TIENDA);
        console.log("ACCESS_TOKEN:", process.env.ACCESS_TOKEN);
        console.log("USER_AGENT:", process.env.USER_AGENT);
        
        if (!process.env.ID_TIENDA || !process.env.ACCESS_TOKEN || !process.env.USER_AGENT) {
            throw new Error("Faltan variables de entorno necesarias para la API de Tienda Nube.");
        }
        const response = await fetch(`https://api.tiendanube.com/v1/${process.env.ID_TIENDA}/products`, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Authorization": `Bearer ${process.env.ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "User-Agent": `${process.env.USER_AGENT}`
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
