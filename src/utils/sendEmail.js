
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});


const sendTrackingEmail = async (to, trackingId, estado, storeName) => {

  const link = `https://liverval.com.ar/seguimiento-resultado.html?id=${trackingId}`;

  let titulo = "";
  let mensaje = "";

  if (estado === "EN_CAMINO") {
    titulo = "Tu envío está en camino 🚚";
    mensaje = `Hola😊 Te escribimos desde Líverval, empresa de logística para ecommerce.\nNos complace informarte que tu pedido de ${storeName || "tu tienda"} ya está en camino y lo vas a estar recibiendo en tu domicilio hoy entre las 12:00 y 20:00 horas.\n\nNúmero de seguimiento: ${trackingId}\n\n¡Gracias por tu compra!😊`;
  }

  if (estado === "ENTREGADO") {
    titulo = "Tu envío fue entregado 📦";
    mensaje = `Tu pedido de ${storeName} fue entregado correctamente.\n\nEsperamos que disfrutes mucho tu compra😊`;
  }

  await transporter.sendMail({
    from: `"Líverval Logística" <${process.env.EMAIL_USER}>`,
    to,
    subject: titulo,
    html: `
      <div style="font-family: Poppins; text-align:center; max-width:600px; margin:auto;">
        <h2>${titulo}</h2>

        <p style="color:#555; font-size:14px;">
         N° de envío: <strong>${trackingId}</strong>
        </p>

        <p>${mensaje}</p>

        <a href="${link}" style="
          background:rgb(45,6,45);
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