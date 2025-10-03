// --- DEPENDENCIES ---
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
<<<<<<< HEAD
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors'); 
const { Web3 } = require('web3'); 
=======
const cors = require('cors');
const { Web3 } = require('web3'); // Correct way to import Web3 v4+
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2
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

<<<<<<< HEAD
// --- DATABASE CONNECTION ---
=======

// --- DATABASE CONNECTION POOL ---
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2
const db = mysql.createPool({
    host:'localhost',
    user:'root',
    password: '',
    database:'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// ------ CHEKING CONNECTION
(async () => {
  try {
    // Get a connection from the pool and run a simple query
    await db.query('SELECT 1');
    console.log('✅ Database connection successful.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Optionally exit the process if the DB connection is critical
    // process.exit(1); 
  }
})();


// --- BLOCKCHAIN SETUP ---
<<<<<<< HEAD
// 🛠️ CONFIRMED: Using Ganache on port 7545
const web3 = new Web3('http://localhost:7545');

// Requires contractaddress.json (must contain the new deployed address)
const { address: contractAddress } = require('./contractaddress.json'); 

// Requires contractabi.json
const contractABI = require('./contractabi.json'); 

// 🛠️ CONFIRMED: Sender/Gas Account from Ganache (Account 0)
const senderAddress = '0x39920E5B400B5987173EF3E185D6DDf56c8a2099';     
=======
const web3 = new Web3(process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545'); // URL from Ganache/Hardhat

// IMPORTANT: Your Smart Contract ABI must be updated to handle text instead of an IPFS CID.
// The `_cid` parameter in `addPrescription` is now `_prescriptionText`.
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_patientId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_doctorName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_disease",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_prescriptionText",
				"type": "string"
			}
		],
		"name": "addHistory",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_patientId",
				"type": "string"
			}
		],
		"name": "getHistory",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "doctorName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "disease",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "prescriptionText",
						"type": "string"
					}
				],
				"internalType": "struct HospitalChain.HistoryRecord[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "patientHistory",
		"outputs": [
			{
				"internalType": "string",
				"name": "doctorName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "disease",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "prescriptionText",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contractAddress = process.env.CONTRACT_ADDRESS;
const senderAddress = process.env.SENDER_ADDRESS;
const privateKey = process.env.SENDER_PRIVATE_KEY; // CRITICAL: Load from .env, DO NOT hardcode here.

if (!contractAddress || !senderAddress || !privateKey) {
    console.error("FATAL ERROR: Blockchain environment variables (CONTRACT_ADDRESS, SENDER_ADDRESS, SENDER_PRIVATE_KEY) are not set in .env file.");
    process.exit(1);
}
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

const contract = new web3.eth.Contract(contractABI, contractAddress);
const senderAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(senderAccount);

<<<<<<< HEAD
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
=======

// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};


<<<<<<< HEAD
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
=======
// ============================= //
// === PUBLIC / AUTH ROUTES === //
// ============================= //

// --- NEW: DOCTOR REGISTRATION ---
app.post('/api/doctor/register', async (req, res) => { 
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2
    try {
        const { name, email, password, specialization } = req.body;
        if (!name || !email || !password || !specialization) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO doctor (name, email, password, specialization) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, specialization]
        );
        res.status(201).json({ message: 'Doctor registered successfully', doctorId: result.insertId });
    } catch (error) {
        console.error("Doctor Registration Error:", error);
        res.status(500).json({ error: 'Failed to register doctor.' });
    }
});

// --- DOCTOR LOGIN ---
app.post('/api/doctor/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM doctor WHERE email = ?', [email]);
        const doctor = rows[0];

        if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = { id: doctor.doctor_id, name: doctor.name, type: 'doctor' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({ token, user: payload });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- NEW: PATIENT REGISTRATION ---
app.post('/api/patient/register', async (req, res) => {
    try {
        const { name, email, password, gender, contact_number } = req.body;
        if (!name || !email || !password || !gender || !contact_number) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO patient (name, email, password, gender, contact_number) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, gender, contact_number]
        );
        res.status(201).json({ message: 'Patient registered successfully', patientId: result.insertId });
    } catch (error) {
        console.error("Patient Registration Error:", error);
        res.status(500).json({ error: 'Failed to register patient.' });
    }
});

// --- NEW: PATIENT LOGIN ---
app.post('/api/patient/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        const [rows] = await db.query('SELECT * FROM patient WHERE email = ?', [email]);
        const patient = rows[0];
        
<<<<<<< HEAD
        if (!text) return res.status(400).json({ success: false, error: "Prescription text is required." });
=======
        console.log(rows);
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

        if (!patient || !(await bcrypt.compare(password, patient.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

<<<<<<< HEAD
        // 🛠️ MIGRATED: Calling the new 4-argument contract function
        await contract.methods.addHistory(
            patient_id, 
            doctorName, 
            disease, 
            text // _prescriptionText
        ).send({ from: senderAddress, gas: 5000000 });
        
        res.json({ success: true, message: 'Prescription recorded on blockchain.' });
=======
        const payload = { id: patient.patient_id, name: patient.name, type: 'patient' };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

        res.json({ token, user: payload });
    } catch (error) {
        console.error("Patient Login Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


<<<<<<< HEAD
// ================================================ //
// === 5. API TO GET HISTORY (FROM BLOCKCHAIN DATA) (MIGRATED) === //
// ================================================ //
app.get('/api/history/:patientId', authenticateToken, async (req, res) => {
     try {
        const patientId = req.params.patientId;
        const records = await contract.methods.getHistory(patientId).call({ from: senderAddress });
=======
// ======================== //
// === DOCTOR ROUTES === //
// ======================== //

// Fetches appointments for the logged-in doctor
app.get('/api/doctor/appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'doctor') return res.sendStatus(403);
    try {
        const doctorId = req.user.id;
        const [appointments] = await db.query(`
            SELECT a.consulting_id, a.appointment_time, p.patient_id, p.name AS patient_name, p.gender, p.contact_number, a.status
            FROM appointment a
            JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_time DESC`, [doctorId]
        );
        res.json(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
});

// Adds a new prescription (text only) to the blockchain
app.post('/api/prescription', authenticateToken, async (req, res) => {
    if (req.user.type !== 'doctor') return res.sendStatus(403);
    try {
        const { patientId, disease, text } = req.body;
        const doctorName = req.user.name;

        if (!patientId || !disease || !text) {
            return res.status(400).json({ error: "patientId, disease, and text are required" });
        }

        // --- THIS IS THE CORRECTED LINE ---
        const contractMethod = contract.methods.addHistory(String(patientId), doctorName, disease, text);
        
        const estimatedGas = await contractMethod.estimateGas({ from: senderAddress });

        const receipt = await contractMethod.send({ from: senderAddress, gas: estimatedGas });
        
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (e) {
        console.error("API Error in /api/prescription:", e);
        res.status(500).json({ error: 'Blockchain transaction failed: ' + e.message });
    }
});


// ======================== //
// === PATIENT ROUTES === //
// ======================== //

// --- NEW: Get logged-in patient's profile ---
app.get('/api/patient/profile', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.sendStatus(403);
    try {
        const [rows] = await db.query('SELECT patient_id, name, email, gender, contact_number FROM patient WHERE patient_id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching patient profile:", error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

// --- NEW: Get logged-in patient's appointments ---
app.get('/api/patient/appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.sendStatus(403);
    try {
        const [appointments] = await db.query(`
            SELECT a.consulting_id, a.appointment_time, a.status, d.name AS doctor_name, d.specialization
            FROM appointment a
            JOIN doctor d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_time DESC`, [req.user.id]
        );
        res.json(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
});

// --- NEW: Book a new appointment ---
app.post('/api/appointments/book', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.sendStatus(403);
    try {
        const { doctor_id, appointment_time } = req.body;
        const patient_id = req.user.id;
        
        await db.query(
            'INSERT INTO appointment (patient_id, doctor_id, appointment_time, status) VALUES (?, ?, ?, ?)',
            [patient_id, doctor_id, appointment_time, 'Pending']
        );

        res.status(201).json({ message: 'Appointment booked successfully and is pending approval.' });
    } catch (error) {
        console.error("Appointment Booking Error:", error);
        res.status(500).json({ error: 'Failed to book appointment.' });
    }
});


// ========================= //
// === SHARED ROUTES === //
// ========================= //

// Retrieves a patient's medical history from the blockchain (for authorized users)
app.get('/api/history/:patientId', authenticateToken, async (req, res) => {
     try {
        const patientId = req.params.patientId;
        const records = await contract.methods.getHistory(String(patientId)).call({ from: senderAddress });
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

        if (!records || records.length === 0) {
            return res.json({ history: [] });
        }

<<<<<<< HEAD
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
=======
        // The data is now directly available from the blockchain, no IPFS needed.
        const results = records.map(rec => ({
            doctorName: rec.doctorName,
            disease: rec.disease,
            data: rec.prescriptionText, // Use the text directly
            timestamp: rec.timestamp.toString(),
        })).reverse(); // Show newest first
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

        res.json({ history: results });
    } catch (e) {
        console.error("API Error in /api/history:", e);
        res.status(500).json({ error: 'Failed to retrieve history: ' + e.message });
    }
});

// --- NEW: Get a list of all doctors (public) ---
app.get('/api/doctors', async (req, res) => {
    try {
        const [doctors] = await db.query('SELECT doctor_id, name, specialization FROM doctor');
        res.json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ error: 'Failed to fetch doctors.' });
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

<<<<<<< HEAD
=======
// --- ROOT & SERVER STARTUP ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
>>>>>>> 8e52b99c48bc4e2a443d2db2749302c45aa296c2

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});