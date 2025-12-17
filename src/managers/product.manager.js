const { collection, getDocs, doc, updateDoc, setDoc, query, where, } = require("firebase/firestore");
const { db } = require("../db/config");
const fetch = require("node-fetch");
require('dotenv').config();


/**
 * Configuración por cliente.
 * Podés ir agregando más entradas a este objeto.
 */
const CLIENTS_CONFIG = {
  praga: {
    ID_TIENDA: process.env.PRAGA_ID_TIENDA,
    ACCESS_TOKEN: process.env.PRAGA_ACCESS_TOKEN,
    USER_AGENT: process.env.PRAGA_USER_AGENT,
  },
  chessi: {
    ID_TIENDA: process.env.CHESSI_ID_TIENDA,
    ACCESS_TOKEN: process.env.CHESSI_ACCESS_TOKEN,
    USER_AGENT: process.env.CHESSI_USER_AGENT,
  },
};

const getClientConfig = (clientId) => {
  const config = CLIENTS_CONFIG[clientId];
  if (!config) {
    throw new Error(`Cliente no configurado: ${clientId}`);
  }

  const { ID_TIENDA, ACCESS_TOKEN, USER_AGENT } = config;

  if (!ID_TIENDA || !ACCESS_TOKEN || !USER_AGENT) {
    throw new Error(
      `Faltan variables de entorno para el cliente ${clientId} (ID_TIENDA / ACCESS_TOKEN / USER_AGENT)`
    );
  }

  return config;
};

const productsTiendaNube = async (clientId) => {
  try {
    const { ID_TIENDA, ACCESS_TOKEN, USER_AGENT } = getClientConfig(clientId);

    // const ID_TIENDA = process.env.ID_TIENDA;
    // const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
    // const USER_AGENT = process.env.USER_AGENT;
      
    // if (!ID_TIENDA || !ACCESS_TOKEN || !USER_AGENT) {
    //     throw new Error("Faltan variables de entorno necesarias para la API de Tienda Nube.");
    // }

    let page = 1;
    let allProducts = [];
    const MAX_PAGES = 10; // límite de seguridad para evitar loops infinitos

    while (page <= MAX_PAGES) {
      console.log(`Buscando pedidos de página ${page} para cliente ${clientId}...`);
    
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
      fechaLimite.setDate(fechaLimite.getDate() - 5);

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

    console.log(
      `Pedidos obtenidos para cliente ${clientId}: ${allProducts.length}`
    );

    const pedidosFinales = [];
    let descartadosProvincia = 0;
    let descartadosRetiroLocal = 0;
    let descartadosCP = 0; 

    const productsCollection = collection(db, "products");

    const provinciasValidas = [
      "Buenos Aires",
      "Capital Federal", 
      "Ciudad de Buenos Aires"
    ];

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
      if (isNaN(cp) || ((cp < 1 || cp > 1999) && cp !== 6700 && cp !== 2804)) {
        console.log(
          `[Filtro Código Postal] Pedido ${product.id} descartado: CP ${product?.billing_zipcode}`
        );
        descartadosCP++;
        continue;
      }


      // Si pasa ambos filtros, recién lo guardamos
      const productData = {
        tnId: product?.id,
        clientId,
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

      const docId = `${clientId}_${product.id}`;
      const productDocRef = doc(productsCollection, docId);
      // const productDocRef = doc(productsCollection, product.id.toString());
      await setDoc(productDocRef, productData, { merge: true });
      console.log(`Pedido ${product.id} (${clientId}) sincronizado en Firestore.`);

      console.log("------ RESUMEN DE FILTROS ------");
      console.log(`Pedidos totales obtenidos: ${allProducts.length}`);
      console.log(`Pedidos descartados por provincia: ${descartadosProvincia}`);
      console.log(`Pedidos descartados por retiro en local: ${descartadosRetiroLocal}`);
      console.log(`Pedidos descartados por código postal: ${descartadosCP}`);
      console.log(`Pedidos finales sincronizados en sistema: ${pedidosFinales.length}`);
      
    }
    
    return { message: "Productos sincronizados con Firestore",
       clientId,
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



const getAllProducts = async (clientId = null) => {
    try {
      const productsCollection = collection(db, "products");
      let q;
      if (clientId) {
        q = query(productsCollection, where("clientId", "==", clientId));
      } else {
        q = productsCollection; // todos los clientes
      }
      const productsAlmacenados = await getDocs(q);
      const products = productsAlmacenados.docs.map((docSnap) => ({
      docId: docSnap.id, // 🔑 ID Firestore (usar para PUT)
      ...docSnap.data(),
    }));
      return products;
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error; 
    }
};


/**
 * Historial por rango de fechas (solo pedidos entregados).
 * from / to: strings YYYY-MM-DD (inclusive)
 */

const getHistoryByRange = async ({ clientId = null, from, to }) => {
  try {
    const productsCollection = collection(db, "products");

    const fromDate = `${from}T00:00:00`;
    const toDate = `${to}T23:59:59`;

    let constraints = [
      where("situacion", "==", "Entregado"),
      where("entregadoEn", ">=", fromDate),
      where("entregadoEn", "<=", toDate),
    ];

    if (clientId) {
      constraints.push(where("clientId", "==", clientId));
    }

    const q = query(productsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const orders = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Agrupamos por día (YYYY-MM-DD)
    const historyByDay = {};

    for (const order of orders) {
      const baseFecha = order.entregadoEn || order.creacion || "";
      const dateKey = baseFecha.slice(0, 10); // YYYY-MM-DD
      if (!dateKey) continue;

      if (!historyByDay[dateKey]) {
        historyByDay[dateKey] = [];
      }
      historyByDay[dateKey].push(order);
    }

    return {
      clientId: clientId || "all",
      from,
      to,
      days: historyByDay,
      total: orders.length,
    };
  } catch (error) {
    console.error("Error al obtener historial:", error);
    throw error;
  }
};


const updateSituacion = async (req, res) => {
  const { id } = req.params; // id del DOCUMENTO Firestore (ej: "praga_1828...")
  const { situacion } = req.body;

  if (!situacion) {
    return res.status(400).json({ error: "El campo 'situacion' es obligatorio" });
  }

  try {
    const productsCollection = collection(db, "products");
    const productDocRef = doc(productsCollection, id);

    const updateData = { situacion };

    // Si se marca como Entregado, guardamos fecha de entrega permanente
    if (situacion === "Entregado") {
      const ahora = new Date().toISOString();
      updateData.entregadoEn = ahora;
    }

    await updateDoc(productDocRef, updateData);

    console.log(`Situacion del pedido ${id} actualizada a ${situacion}`);
    res.json({
      message: "Situacion actualizada correctamente",
      id,
      situacion,
    });
  } catch (error) {
    console.error("Error al actualizar situacion:", error);
    res.status(500).json({ error: "Error al actualizar la situacion" });
  }
};





// const updateSituacion = async (req, res) => {
//   const { id } = req.params;
//   const { situacion } = req.body;

//   if (!situacion) {
//     return res.status(400).json({ message: "El campo 'situacion' es requerido." });
//   }

//   try {
//     const productRef = doc(db, "products", id);
//     await updateDoc(productRef, { situacion });

//     res.status(200).json({ message: "Situación actualizada correctamente." });
//   } catch (error) {
//     console.error("Error al actualizar situación:", error);
//     res.status(500).json({ message: "Error al actualizar situación." });
//   }
// };



module.exports = { getAllProducts, productsTiendaNube, updateSituacion, getHistoryByRange };
