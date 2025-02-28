const { initializeApp } = require("firebase/app"); 
const { getAuth } = require("firebase/auth"); 
const { getFirestore } = require("firebase/firestore");  

const firebaseConfig = {
    apiKey: "AIzaSyCuMbhKIVJ5Heew25S8OzhyyWysCuOedZs",
    authDomain: "liverval-react.firebaseapp.com",
    projectId: "liverval-react",
    storageBucket: "liverval-react.firebasestorage.app",
    messagingSenderId: "899806639068",
    appId: "1:899806639068:web:674fd920d9d9911837d519",
    measurementId: "G-NYXBPF974K"
};

const app = initializeApp(firebaseConfig); 

const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { app, auth, db }; 