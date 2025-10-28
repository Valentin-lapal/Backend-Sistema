const { collection, getDocs, doc, updateDoc, setDoc } = require("firebase/firestore");
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

    let page = 1;
    let allProducts = [];
    const MAX_PAGES = 10; // límite de seguridad para evitar loops infinitos

    while (page <= MAX_PAGES) {
      console.log(`Buscando pedidos de página ${page}...`);
    
      const response = await fetch(`https://api.tiendanube.com/v1/${ID_TIENDA}/orders?page=${page}&per_page=30&status=open`, {
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

      if (products.length === 0) {
        console.log(`No hay más pedidos, se detiene en la página ${page}`);
        break; 
      }

      // Filtrar solo pedidos actuales
      const pedidosFiltrados = products.filter(p =>
        p.status === "open" &&
        (p.shipping_status === "unpacked" || p.shipping_status === "unshipped")
      );

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 4);

      const pedidosRecientes = pedidosFiltrados.filter(
        (p) => new Date(p.created_at) >= fechaLimite
      );

      console.log(`Página ${page}: ${pedidosRecientes.length} pedidos válidos encontrados.`);

      if (pedidosRecientes.length === 0 && products.length < 30) {
        console.log(`No hay más pedidos válidos a partir de página ${page}, deteniendo loop.`);
        break;
      }

      allProducts = allProducts.concat(pedidosRecientes);

      if (products.length < 30) {
        console.log(`Se obtuvo menos de 30 pedidos en página ${page}, fin de la búsqueda.`);
        break;
      };
      
      page++;

    }

    console.log(`Pedidos actuales obtenidos: ${allProducts.length}`);

    const pedidosFinales = [];
    let descartadosProvincia = 0;
    let descartadosRetiroLocal = 0;
    let descartadosCP = 0; 

    const productsCollection = collection(db, "products");

    const provinciasValidas = ["Buenos Aires", "Capital Federal", "Ciudad de Buenos Aires"];

    for (const product of allProducts) {
      
      // Si la provincia no está en la lista, se descarta
      if (!provinciasValidas.map(p => p.toLowerCase()).includes((product?.billing_province || "").toLowerCase())) {
        console.log(`Pedido ${product.id} descartado: Provincia ${product?.billing_province}`);
        descartadosProvincia++;
        continue;
      }

      // Filtramos pedidos que son retiro en local
      const esRetiroEnLocal =
        product?.shipping_pickup_type === "pickup" ||
        !!product?.shipping_pickup_details ||
        !!product?.shipping_store_branch_name;

      if (esRetiroEnLocal) {
         console.log(`Pedido ${product.id} descartado: Retiro en local`);
         descartadosRetiroLocal++;
         continue;
      }

      // FUNCION PARA FILTRAR POR CP PARA QUE NO TOME LOS DEL INTERIOR DE PROVINCIA DE BUENOS AIRES

      const cp = parseInt(product?.billing_zipcode, 10);
      if (isNaN(cp) || ((cp < 1 || cp > 1999) && cp !== 6700)) {
        console.log(`[Filtro Código Postal] Pedido ${product.id} descartado: CP ${product?.billing_zipcode}`);
        descartadosCP++;
        continue;
      }


      // Si pasa ambos filtros, recién lo guardamos
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

      pedidosFinales.push(productData);

      const productDocRef = doc(productsCollection, product.id.toString());
      await setDoc(productDocRef, productData, { merge: true });
      console.log(`Pedido ${product.id} sincronizado en Firestore.`);

      console.log("------ RESUMEN DE FILTROS ------");
      console.log(`Pedidos totales obtenidos: ${allProducts.length}`);
      console.log(`Pedidos descartados por provincia: ${descartadosProvincia}`);
      console.log(`Pedidos descartados por retiro en local: ${descartadosRetiroLocal}`);
      console.log(`Pedidos descartados por código postal: ${descartadosCP}`);
      console.log(`Pedidos finales sincronizados en sistema: ${pedidosFinales.length}`);
      
    }
    
    return { message: "Productos sincronizados con Firestore",
       total: allProducts.length,
       descartadosDeprovincia: descartadosProvincia,
       descartadosDeretiroLocal: descartadosRetiroLocal,
       descartadosDeCp: descartadosCP,
       totalSistema: pedidosFinales.length,
       pedidos: pedidosFinales
      }; 
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
