const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const app = express();
require("dotenv").config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    :[
        "https://sistema-snowy.vercel.app",
        "http://localhost:5173",
    ];


app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));


app.options('/api/*', cors());


app.use(express.json());
app.use("/api", routes);

app.get("/", (req, res) => {
    res.send("Bienvenido a la API de Sistema");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto http://localhost:${PORT}`);
});


module.exports = app
