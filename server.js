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
const { Web3 } = require('web3'); 
require('dotenv').config();

// --- INITIALIZATIONS ---
const app = express();

// --- SECURITY CHECK: Ensure essential environment variables are set ---
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined in the .env file.");
    process.exit(1); // Stop the application if the secret key is missing
}



// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION ---
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
// 🛠️ CONFIRMED: Using Ganache on port 7545
const web3 = new Web3('http://localhost:7545');

// Requires contractaddress.json (must contain the new deployed address)
const { address: contractAddress } = require('./contractaddress.json'); 

// Requires contractabi.json
const contractABI = require('./contractabi.json'); 

// 🛠️ CONFIRMED: Sender/Gas Account from Ganache (Account 0)
const senderAddress = '0x39920E5B400B5987173EF3E185D6DDf56c8a2099';     

const contract = new web3.eth.Contract(contractABI, contractAddress);

// --- MULTER SETUP (Used for file uploads, though now text is sent) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- JWT Authentication Middleware ---
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
// === 1. API FOR PATIENT REGISTRATION (FINAL FIX) === //
// =============================================== //
app.post('/api/patient/register', async (req, res) => {
    try {
        // Map frontend fields (name, email, password) to backend variables
        const { 
            name, 
            email: id, // Maps 'email' to 'id' (patient_id)
            password
            // We ignore contact_number, address, gender, dob from req.body 
            // as they don't match the required DB columns (age, blood_group)
        } = req.body;

        // --- Use Safe Default Values for DB Columns 'age' and 'blood_group' ---
        // This prevents the SQL error by ensuring valid data types (Number and Short String)
        const age = 30;              
        const blood_group = 'Unknown'; 

        // Check the critical fields required for login/hashing
        if (!id || !name || !password) {
            return res.status(400).json({ success: false, error: 'Missing critical fields.' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Database insertion uses the correct variables and safe dummy data
        await db.execute(
            'INSERT INTO patients (patient_id, name, password, age, blood_group) VALUES (?, ?, ?, ?, ?)',
            [id, name, hashedPassword, age, blood_group]
        );

        res.status(201).json({ success: true, message: 'Registration successful! Please log in.' });

    } catch (e) {
        console.error("Patient Registration error:", e);
        
        // Handle Duplicate Entry Error
        if (e.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, error: 'Registration failed. The Email Address (ID) is already in use.' });
        }
        
        // Return a generic server error for all other issues
        res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
    }
});

// =============================================== //
// === 2. API FOR DOCTOR REGISTRATION (FIXED) === //
// =============================================== //
app.post('/api/doctor/register', async (req, res) => {
    try {
        // Map frontend fields (email) to backend variables (id)
        const { 
            name, 
            email: id, // Maps 'email' (from frontend) to 'id' (for doctor_id)
            password, 
            specialization 
            // We ignore contact_number and hospital_name
        } = req.body;
        
        // Check only the required database fields
        if (!id || !name || !password || !specialization) {
            return res.status(400).json({ success: false, error: 'Missing required fields.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Uses id (mapped from email), name, hashedPassword, and specialization
        await db.execute(
            'INSERT INTO doctors (doctor_id, name, password, specialization) VALUES (?, ?, ?, ?)',
            [id, name, hashedPassword, specialization]
        );

        res.status(201).json({ success: true, message: 'Doctor registered successfully.' });

    } catch (e) {
        console.error("Doctor Registration error:", e);
        // Handle Duplicate Entry Error (likely cause of 500 if ID is reused)
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Registration failed. The Email Address (ID) is already in use.' });
        }
        res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
    }
});

// =============================================== //
// === 3. API FOR LOGIN (FINAL CORRECTED CODE) === //
// =============================================== //

async function handleUserLogin(req, res, table, dbIdField, userType, formIdField) {
    const id = req.body[formIdField];
    const { password } = req.body; 
    
    if (!id || !password) {
        return res.status(400).json({ success: false, error: `'${formIdField}' and 'password' are required for login.` });
    }
    
    try {
        const [rows] = await db.execute(`SELECT * FROM ${table} WHERE ${dbIdField} = ?`, [id]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
        
        const token = jwt.sign(
            { id: user[dbIdField], name: user.name, type: userType }, 
            SESSION_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, token, type: userType, name: user.name });

    } catch (e) {
        console.error(`${userType} Login error:`, e);
        res.status(500).json({ success: false, error: 'Login failed due to a server error.' });
    }
}

// Patient login (searches the 'name' column)
app.post('/api/patient/login', (req, res) => {
    handleUserLogin(req, res, 'patients', 'name', 'patient', 'name');
});

// Doctor login (searches the 'doctor_id' column)
app.post('/api/doctor/login', (req, res) => {
    handleUserLogin(req, res, 'doctors', 'doctor_id', 'doctor', 'email');
});

// Hospital login (searches the 'email' column)
app.post('/api/hospital/login', (req, res) => {
    handleUserLogin(req, res, 'hospitals', 'email', 'hospital', 'email');
});
// =============================================== //
// === 4. API TO ADD PRESCRIPTION (TEXT ONLY) (MIGRATED) === //
// =============================================== //
app.post('/api/prescription', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { patient_id, disease, text } = req.body;
        
        if (!text) return res.status(400).json({ success: false, error: "Prescription text is required." });

        const doctorName = req.user.name;

        // 🛠️ MIGRATED: Calling the new 4-argument contract function
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
// === 5. API TO GET HISTORY (FROM BLOCKCHAIN DATA) (MIGRATED) === //
// ================================================ //
app.get('/api/history/:patientId', authenticateToken, async (req, res) => {
     try {
        const patientId = req.params.patientId;
        const records = await contract.methods.getHistory(patientId).call({ from: senderAddress });

        if (!records || records.length === 0) return res.json({ history: [] });

        // 🛠️ MIGRATED: Mapping contract data to frontend format
        const results = records.map(rec => ({
            doctorName: rec.doctorName, 
            disease: rec.disease, 
            // Dummy ID for the frontend UI (the old CID field)
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

// ==================================================== //
// === 6. API FOR HOSPITAL REGISTRATION (CORRECTED) === //
// ==================================================== //
app.post('/api/hospital/register', async (req, res) => {
    try {
        // Correctly get 'email' and alias it to 'id' for consistency
       const { hospital_name: name, email: id, password } = req.body;

        if (!id || !name || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields for hospital registration.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Now, 'id' correctly contains the email and is used here
        await db.execute(
            'INSERT INTO hospitals (email, name, password) VALUES (?, ?, ?)',
            [id, name, hashedPassword]
        );

        res.status(201).json({ success: true, message: 'Hospital registered successfully.' });

    } catch (e) {
        console.error("Hospital Registration error:", e);
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Registration failed. The Email Address is already in use.' });
        }
        res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
    }
});




app.get('/api/available-doctors', authenticateToken, async (req, res) => {
    try {
        const [doctors] = await db.execute('SELECT name, specialization FROM doctors');
        res.json(doctors);
    } catch (e) {
        console.error("Error fetching available doctors:", e);
        res.status(500).json({ error: 'Failed to fetch doctor data.' });
    }
});

app.get('/api/all-appointments', authenticateToken, async (req, res) => {
    try {
        // TODO: Replace this dummy data with a real database query from your 'appointments' table.
        const dummyAppointments = [
            { id: 1, patient_name: 'John Doe', doctor_name: 'Dr. Smith', appointment_time: '2025-10-03 14:00', status: 'Pending' },
            { id: 2, patient_name: 'Jane Roe', doctor_name: 'Dr. Paper', appointment_time: '2025-10-03 15:00', status: 'Confirmed' }
        ];
        res.json(dummyAppointments);
    } catch (e) {
        console.error("Error fetching all appointments:", e);
        res.status(500).json({ error: 'Failed to fetch appointment data.' });
    }
});


// ====================== //
// === SERVER STARTUP === //
// ====================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});