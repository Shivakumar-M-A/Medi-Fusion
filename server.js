const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Connection ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// --- File & JWT Setup ---
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${path.extname(file.originalname)}`)
});
const upload = multer({ storage: storage });
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-secret-key-for-jwt';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ======================= //
// === FRONTEND ROUTES === //
// ======================= //
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================== //
// === API ROUTES === //
// ================== //

// --- AUTH ROUTES ---
app.post('/api/patient/register', async (req, res) => {
    try {
        const { name, email, password, contact_number, address, gender, dob } = req.body;
        const [existing] = await db.query('SELECT email FROM patient WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'An account with this email already exists.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query( 'INSERT INTO patient (name, email, password, contact_number, address, gender, dob) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, email, hashedPassword, contact_number, address, gender, dob] );
        res.status(201).json({ message: 'Patient registered successfully!', patientId: result.insertId });
    } catch (error) { res.status(500).json({ error: 'Database error during registration.' }); }
});
app.post('/api/patient/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const [rows] = await db.query('SELECT * FROM patient WHERE name = ?', [name]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const patient = rows[0];
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: patient.patient_id, type: 'patient', name: patient.name }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ error: 'Server error during login.' }); }
});
app.post('/api/doctor/register', async (req, res) => {
    try {
        const { name, email, password, contact_number, specialization, availability_status, hospital_name } = req.body;

        // Basic validation
        if (!name || !email || !password || !contact_number || !specialization || !availability_status || !hospital_name) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const [existing] = await db.query('SELECT email FROM doctor WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'A doctor with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO doctor (name, email, password, contact_number, specialization, availability_status, hospital_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, contact_number, specialization, availability_status, hospital_name]
        );

        res.status(201).json({ message: 'Doctor registered successfully!', doctorId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error); // <-- This helps you debug
        res.status(500).json({ error: 'Database error during doctor registration.' });
    }
});

app.post('/api/doctor/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM doctor WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const doctor = rows[0];
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: doctor.doctor_id, type: 'doctor', name: doctor.name, hospital_name: doctor.hospital_name }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ error: 'Server error during login.' }); }
});
app.post('/api/hospital/register', async (req, res) => {
    try {
        const { hospital_name, email, password, phone, address, num_beds, specialties } = req.body;
        const [existing] = await db.query('SELECT email FROM hospitals WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'A hospital with this email already exists.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query( 'INSERT INTO hospitals (hospital_name, email, password, phone, address, num_beds, specialties) VALUES (?, ?, ?, ?, ?, ?, ?)', [hospital_name, email, hashedPassword, phone, address, num_beds, specialties] );
        res.status(201).json({ message: 'Hospital registered successfully!', hospitalId: result.insertId });
    } catch (error) { res.status(500).json({ error: 'Database error during hospital registration.' }); }
});
app.post('/api/hospital/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM hospitals WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const hospital = rows[0];
        const isMatch = await bcrypt.compare(password, hospital.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: hospital.id, type: 'hospital', name: hospital.hospital_name }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) { res.status(500).json({ error: 'Server error during login.' }); }
});

// --- CORE WORKFLOW ROUTES ---

// [PATIENT] Get all available doctors
app.get('/api/available-doctors', authenticateToken, async (req, res) => {
    try {
        const [doctors] = await db.query("SELECT doctor_id, name, specialization, hospital_name FROM doctor WHERE availability_status = 'Available'");
        res.json(doctors);
    } catch (error) {
        console.error("Error fetching available doctors:", error);
        res.status(500).json({ error: 'Failed to fetch available doctors.' });
    }
});

// [PATIENT] Get single doctor details
app.get('/api/doctor-details/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT doctor_id, name, specialization FROM doctor WHERE doctor_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
        res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// [PATIENT] Book an appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { doctor_id, appointment_time } = req.body;
        const patient_id = req.user.id;
        const consulting_id = crypto.randomBytes(4).toString('hex');
        await db.query("INSERT INTO appointment (consulting_id, patient_id, doctor_id, appointment_time, status) VALUES (?, ?, ?, ?, 'Pending')", [consulting_id, patient_id, doctor_id, appointment_time]);
        res.status(201).json({ message: 'Appointment booked successfully! Awaiting hospital approval.', consulting_id });
    } catch (error) { res.status(500).json({ error: 'Failed to book appointment' }); }
});

// [PATIENT] Get their own appointments
app.get('/api/my-patient-appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [appointments] = await db.query(`
            SELECT a.appointment_id, a.appointment_time, a.status, d.name as doctor_name 
            FROM appointment a 
            JOIN doctor d ON a.doctor_id = d.doctor_id 
            WHERE a.patient_id = ? 
            ORDER BY a.appointment_time DESC`, [req.user.id]);
        res.json(appointments);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch your appointments' }); }
});


// [HOSPITAL] Get all appointments for that hospital
app.get('/api/all-appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'hospital') return res.status(403).json({ error: 'Forbidden' });
    try {
        const hospitalName = req.user.name; // Get hospital name from JWT
        const [appointments] = await db.query(`
            SELECT a.*, p.name AS patient_name, d.name AS doctor_name 
            FROM appointment a 
            JOIN patient p ON a.patient_id = p.patient_id 
            JOIN doctor d ON a.doctor_id = d.doctor_id 
            WHERE d.hospital_name = ? 
            ORDER BY a.appointment_time DESC`,
            [hospitalName]
        );
        res.json(appointments);
    } catch (error) { 
        console.error("Error fetching appointments for hospital:", error);
        res.status(500).json({ error: 'Failed to fetch appointments.' }); 
    }
});

// [HOSPITAL] Update appointment status
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
    if (req.user.type !== 'hospital') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { status } = req.body; // "Approved" or "Rejected"
        const { id } = req.params;
        await db.query('UPDATE appointment SET status = ? WHERE appointment_id = ?', [status, id]);
        res.json({ message: `Appointment ${id} has been ${status}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update appointment status.' });
    }
});

// [DOCTOR] Get approved appointments for the logged-in doctor
app.get('/api/my-appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'doctor') return res.status(403).json({ error: 'Forbidden' });
    try {
        const doctorId = req.user.id;
        const [appointments] = await db.query(`SELECT a.appointment_id, a.consulting_id, a.appointment_time, p.name AS patient_name, p.gender, p.contact_number FROM appointment a JOIN patient p ON a.patient_id = p.patient_id WHERE a.doctor_id = ? AND a.status = 'Approved' ORDER BY a.appointment_time ASC`, [doctorId]);
        res.json(appointments);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch your appointments.' }); }
});


// ====================== //
// === SERVER STARTUP === //
// ====================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running. Open http://localhost:${PORT} in your browser.`);
});
