// --- DEPENDENCIES ---
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors'); 
// REMOVED: const { create } = require('ipfs-http-client'); 
const { Web3 } = require('web3'); // 🛠️ FIXED: Correct Web3 import for Node.js
require('dotenv').config();

// --- INITIALIZATIONS ---
const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION (Omitted for brevity, assumed correct) ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// --- BLOCKCHAIN SETUP ---
const web3 = new Web3('http://localhost:8545'); 

// 🛠️ RESTORED: Read address from JSON file (Requires contractaddress.json)
const { address: contractAddress } = require('./contractaddress.json'); 

// 🛠️ RESTORED: Read ABI from JSON file (Requires contractabi.json)
const contractABI = require('./contractabi.json'); 

// 🚨 ACTION REQUIRED: Set your sending account address here 🚨
const senderAddress = 'YOUR_SENDER_ADDRESS_HERE';     

const contract = new web3.eth.Contract(contractABI, contractAddress);

// --- MULTER SETUP ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- JWT Authentication Middleware (Omitted for brevity, assumed correct) ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Unauthorized: Token missing' });

    jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
}

// =============================================== //
// === API TO ADD PRESCRIPTION (TEXT ONLY) === //
// =============================================== //
app.post('/api/prescription', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { patient_id, disease, text } = req.body;
        
        // Validation for prescription text
        if (!text) return res.status(400).json({ success: false, error: "Prescription text is required." });

        const doctorName = req.user.name;

        // 🛠️ UPDATED: Calling the new 4-argument contract function
        await contract.methods.addHistory(
            patient_id, 
            doctorName, 
            disease, 
            text // _prescriptionText
        ).send({ from: senderAddress, gas: 5000000 });
        
        res.json({ success: true, message: 'Prescription recorded on blockchain.' });

    } catch (e) {
        console.error("API Error in /api/prescription:", e);
        res.status(500).json({ success: false, error: 'Blockchain transaction failed: ' + e.message });
    }
});


// ================================================ //
// === API TO GET HISTORY (FROM BLOCKCHAIN DATA) === //
// ================================================ //
app.get('/api/history/:patientId', authenticateToken, async (req, res) => {
     try {
        const patientId = req.params.patientId;
        // Fetch all history records from the smart contract
        const records = await contract.methods.getHistory(patientId).call({ from: senderAddress });

        if (!records || records.length === 0) return res.json({ history: [] });

        // 🛠️ UPDATED: Map contract data to frontend format (synchronous)
        const results = records.map(rec => ({
            doctorName: rec.doctorName, 
            disease: rec.disease, 
            // Create a dummy ID for the frontend to show on the UI
            cid: "BLOCK_ID_#" + rec.timestamp.toString(), 
            timestamp: rec.timestamp.toString(), 
            data: rec.prescriptionText // Use prescriptionText as the 'data' field
        }));
        
        results.reverse(); // Displaying newest first

        res.json({ history: results });
    } catch (e) {
        console.error("API Error in /api/history:", e);
        res.status(500).json({ error: 'Failed to retrieve history from blockchain: ' + e.message });
    }
});


// ... (remaining API endpoints and server startup) ...

// ====================== //
// === SERVER STARTUP === //
// ====================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});