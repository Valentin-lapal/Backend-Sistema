const { collection, getDocs } = require("firebase/firestore");
const { db } = require("../db/config");

const getClientByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    const snapshot = await getDocs(collection(db, "clients"));

    const client = snapshot.docs.find(doc =>
      doc.data().email === email
    );

    if (!client) {
      return res.status(403).json({ error: "No autorizado" }); 
    }

    const data = client.data();

    if (data.role === "admin") {
      return res.json({ clientId: null });
    }

    return res.json({
      clientId: client.data().clientId
    });

  } catch (error) {
    console.error("Error getClientByEmail:", error);
    res.status(500).json({ error: "Error interno" });
  }
};

module.exports = { getClientByEmail };