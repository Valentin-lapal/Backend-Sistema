

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const sendTrackingEmail = async (to, trackingId, estado) => {

  const link = `https://liverval.com.ar/seguimiento-resultado.html?id=${trackingId}`;

  let titulo = "";
  let mensaje = "";

  if (estado === "EN_CAMINO") {
    titulo = "Tu envío está en camino 🚚";
    mensaje = "Tu pedido ya salió a reparto.";
  }

  if (estado === "ENTREGADO") {
    titulo = "Tu envío fue entregado 📦";
    mensaje = "Tu pedido fue entregado correctamente.";
  }

  await transporter.sendMail({
    from: `"Líverval Logística" <${process.env.EMAIL_USER}>`,
    to,
    subject: titulo,
    html: `
      <div style="font-family: Arial; text-align:center;">
        <h2>${titulo}</h2>
        <p>${mensaje}</p>

        <a href="${link}" style="
          background:#ff5a3c;
          padding:14px 24px;
          color:white;
          text-decoration:none;
          border-radius:8px;
          display:inline-block;
          margin-top:20px;
        ">
          Seguir envío
        </a>

        <p style="margin-top:30px; font-size:12px; color:#888;">
          Equipo Líverval
        </p>
      </div>
    `
  });
};

module.exports = { sendTrackingEmail };