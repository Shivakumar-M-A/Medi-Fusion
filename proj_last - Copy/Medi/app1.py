from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import pymysql
pymysql.install_as_MySQLdb()

from flask_mysqldb import MySQL
import MySQLdb.cursors
import uuid
import os
import pytesseract
from PIL import Image
import easyocr
import cv2
import matplotlib.pyplot as plt
import subprocess

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''  # Update if you use a password
app.config['MYSQL_DB'] = 'hospital_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Initialize MySQL
mysql = MySQL(app)

# 🧪 Optional Test: Verify DB Connection
try:
    connection = mysql.connection
    cursor = connection.cursor()
    print("✅ MySQL Connection established!")
except Exception as e:
    print("❌ MySQL connection failed:", e)

# -------------------- ROUTES --------------------

# Home route
@app.route('/')
def home():
    return render_template('index.html')

# Patient Registration Route
@app.route('/patient/register', methods=['GET', 'POST'])
def patient_register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        contact_number = request.form['contact_number']
        address = request.form['address']
        gender = request.form['gender']
        dob = request.form['dob']

        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO patient (name, email, password, contact_number, address, gender, dob)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, email, password, contact_number, address, gender, dob))
        mysql.connection.commit()
        cur.close()

        flash('Patient registered successfully!', 'success')
        return redirect(url_for('patient_login'))

    return render_template('patient_register.html')

# Patient Login Route
@app.route('/patient/login', methods=['GET', 'POST'])
def patient_login():
    if request.method == 'POST':
        email = request.form['email']
        password_input = request.form['password']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM patient WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()

        if user and check_password_hash(user['password'], password_input):
            session['patient_id'] = user['id']
            session['patient_name'] = user['name']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'danger')

    return render_template('patient_login.html')

# Doctor Registration Route
@app.route('/doctor/register', methods=['GET', 'POST'])
def doctor_register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        contact_number = request.form['contact_number']
        specialization = request.form['specialization']
        availability_status = request.form['availability_status']

        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO doctor (name, email, password, contact_number, specialization, availability_status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, email, password, contact_number, specialization, availability_status))
        mysql.connection.commit()
        cur.close()

        flash('Doctor registered successfully!', 'success')
        return redirect(url_for('doctor_login'))

    return render_template('doctor_register.html')

# Doctor Login Route
@app.route('/doctor/login', methods=['GET', 'POST'])
def doctor_login():
    if request.method == 'POST':
        email = request.form['email']
        password_input = request.form['password']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM doctor WHERE email = %s", (email,))
        doctor = cur.fetchone()
        cur.close()

        if doctor and check_password_hash(doctor['password'], password_input):
            session['doctor_id'] = doctor['id']
            session['doctor_name'] = doctor['name']
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'danger')

    return render_template('doctor_login.html')

# Logout Route
@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

# -------------------- END ROUTES --------------------

if __name__ == '__main__':
    app.run(debug=True)
