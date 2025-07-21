const { collection, getDocs, addDoc, query, where, doc, updateDoc } = require("firebase/firestore");
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
        const response = await fetch(`https://api.tiendanube.com/v1/${ID_TIENDA}/orders`, {
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
                id: product?.id,
                orden: product?.number || "",
                name: product?.contact_name || "",
                contacto: product?.contact_phone || "",
                email: product?.contact_email || "",
                direccion: product?.billing_address || "",
                numero: product?.billing_number || "",
                detalle: product?.billing_floor || "",
                note: product?.note || "",
                localidad: product?.billing_locality || "",
                codigo_postal: product?.billing_zipcode || "",
                ciudad: product?.billing_city || "",
                provincia: product?.billing_province || "",
                estado: product?.status || "",
                estadoshi: product?.shipping_status || "",
                creacion:product?.created_at || "",
                situacion: "Pendiente",
            };
            
            const q = query(productsCollection, where("id", "==", product.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty){
                await addDoc(productsCollection, productData);
                console.log(`Producto con ID ${product.id} agregado a Firestore.`);
            }else{
                console.log(`Producto con ID ${product.id} ya existe en Firestore.)`

                );
            }
        }

        return { message: "Productos sincronizados con Firestore", products }; 
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



const updateSituacion = async (req, res) => {
  const { id } = req.params;
  const { situacion } = req.body;

  if (!situacion) {
    return res.status(400).json({ message: "El campo 'situacion' es requerido." });
  }

  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, { situacion });

    res.status(200).json({ message: "Situación actualizada correctamente." });
  } catch (error) {
    console.error("Error al actualizar situación:", error);
    res.status(500).json({ message: "Error al actualizar situación." });
  }
};



module.exports = { getAllProducts, productsTiendaNube, updateSituacion };
