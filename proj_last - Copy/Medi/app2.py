from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mysqldb import MySQL, MySQLdb  # Added MySQLdb import
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import os
from flask import Flask, request, redirect, url_for, flash, session, render_template
from werkzeug.utils import secure_filename
import MySQLdb.cursors
import pytesseract
from PIL import Image
import os
from flask import send_file
import easyocr
import cv2
import matplotlib.pyplot as plt
import subprocess
from transformers import pipeline
import re
import textwrap




app = Flask(__name__)
app.secret_key = 'your secret key'

# MySQL configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''  # If you have password, enter it here
app.config['MYSQL_DB'] = 'hospital'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'


# Initialize MySQL
mysql = MySQL(app)





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
        cur.execute("INSERT INTO patient (name, email, password, contact_number, address, gender, dob) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                    (name, email, password, contact_number, address, gender, dob))
        mysql.connection.commit()
        cur.close()

        return redirect(url_for('patient_login'))

    return render_template('patient_register.html')

# Patient Login Route
@app.route('/patient/login', methods=['GET', 'POST'])
def patient_login():
    if request.method == 'POST':
        name = request.form['name']
        password = request.form['password']

        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)  # Fetch as dictionary
        cur.execute("SELECT * FROM patient WHERE name = %s", (name,))
        patient = cur.fetchone()
        cur.close()

        if patient and check_password_hash(patient['password'], password):  # Access password correctly
            session['patient_id'] = patient['patient_id']  # Use column name
            return redirect(url_for('patient_dashboard'))

    return render_template('patient_login.html')


@app.route('/patient_dashboard')
def patient_dashboard():
    if 'patient_id' not in session:
        return redirect(url_for('patient_login'))

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT doctor_id, name, specialization FROM doctor")
    doctors = cur.fetchall()
    cur.close()

    print("Doctors fetched:", doctors)  # Debugging

    return render_template('patient_dashboard.html', doctors=doctors)

# Doctor Registration Route
@app.route('/doctor_register', methods=['GET', 'POST'])
def doctor_register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        contact_number = request.form['contact_number']
        specialization = request.form['specialization']
        availability_status = request.form['availability_status']

        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO doctor (name, email, password, contact_number, specialization, availability_status) VALUES (%s, %s, %s, %s, %s, %s)",
                    (name, email, password, contact_number, specialization, availability_status))
        mysql.connection.commit()
        cur.close()

        flash('Doctor registered successfully!', 'success')
        return redirect(url_for('doctor_register'))

    return render_template('doctor_register.html')

# Doctor Login Route
@app.route('/doctor/login', methods=['GET', 'POST'])
def doctor_login():
    if request.method == 'POST':
        name = request.form['name']
        password = request.form['password']

        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("SELECT * FROM doctor WHERE name = %s", (name,))
        doctor = cur.fetchone()
        cur.close()

        if doctor and check_password_hash(doctor['password'], password):  # Correctly fetch hashed password
            session['doctor_id'] = doctor['doctor_id']
            return redirect(url_for('doctor_dashboard'))

    return render_template('doctor_login.html')



@app.route('/doctor/dashboard')
def doctor_dashboard():
    if 'doctor_id' not in session:
        return redirect(url_for('doctor_login'))  # Redirect if not logged in

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    query = """
        SELECT 
            a.appointment_id, 
            a.consulting_id, 
            a.appointment_time, 
            a.status,
            p.patient_id, 
            p.name AS patient_name, 
            p.contact_number, 
            p.gender,
            EXISTS (
                SELECT 1 
                FROM appointment_documents d 
                WHERE d.appointment_id = a.appointment_id
            ) AS has_document
        FROM appointment a
        JOIN patient p ON a.patient_id = p.patient_id
        WHERE a.doctor_id = %s AND a.status = 'Approved'
    """

    cur.execute(query, (session['doctor_id'],))
    appointments = cur.fetchall()
    cur.close()

    return render_template('doctor_dashboard.html', appointments=appointments)



# Admin Login Route
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == 'admin' and password == 'admin123':
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password', 'danger')

    return render_template('admin_login.html')


# Admin Dashboard Route
@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("SELECT * FROM appointment")
        complaints = cur.fetchall()
        cur.close()
        print("Complaints:", complaints)  # Debugging
        return render_template('admin_dashboard.html', complaints=complaints)
    except Exception as e:
        print("Error fetching data:", e)
        flash("Error fetching data from the database.", "danger")
        return redirect(url_for('admin_login'))
    

@app.route('/update_status', methods=['POST'])
def update_status():
    complaint_id = request.json.get('complaint_id')  # Consider renaming to appointment_id if relevant
    status = request.json.get('status')

    if not complaint_id or not status:
        return jsonify({'error': 'Invalid data'}), 400

    cur = mysql.connection.cursor()
    try:
        # Update the correct table, if it's appointment
        cur.execute('UPDATE appointment SET status = %s WHERE appointment_id = %s', (status, complaint_id))
        mysql.connection.commit()
        return jsonify({'message': f'Status updated to {status}'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()











@app.route('/book_appointment/<int:doctor_id>', methods=['GET', 'POST'])
def book_appointment(doctor_id):
    if 'patient_id' not in session:
        flash("Session expired. Please log in again.", "warning")
        return redirect(url_for('patient_login'))

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    # Fetch doctor details
    cur.execute("SELECT doctor_id, name, specialization FROM doctor WHERE doctor_id = %s", (doctor_id,))
    doctor = cur.fetchone()

    if not doctor:
        flash("Doctor not found!", "danger")
        cur.close()
        return redirect(url_for('patient_dashboard'))

    # Generate a unique Consulting ID
    consulting_id = str(uuid.uuid4())[:8]  # Generates an 8-character unique ID

    if request.method == 'POST':
        appointment_time = request.form.get('appointment_time')
        patient_id = session.get('patient_id')

        if not appointment_time:
            flash("Please select an appointment time.", "warning")
            return redirect(url_for('book_appointment', doctor_id=doctor_id))

        try:
            # Insert appointment with unique consulting ID
            cur.execute(
                "INSERT INTO appointment (consulting_id, patient_id, doctor_id, appointment_time, status) VALUES (%s, %s, %s, %s, 'Pending')",
                (consulting_id, patient_id, doctor_id, appointment_time)
            )
            mysql.connection.commit()
            flash(f"Appointment booked successfully! Consulting ID: {consulting_id}", "success")
            return redirect(url_for('patient_dashboard'))
        except Exception as e:
            print("Error:", str(e))  # Debugging
            flash(f"Error booking appointment: {str(e)}", "danger")
        finally:
            cur.close()

    return render_template('book_appointment.html', doctor=doctor, consulting_id=consulting_id)



@app.route('/doctor/logout')
def doctor_logout():
    session.pop('doctor_id', None)  # Remove doctor session
    return redirect(url_for('doctor_login'))


app.config['UPLOAD_FOLDER'] = 'static/uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload_document/<int:appointment_id>', methods=['POST'])
def upload_document(appointment_id):
    if 'doctor_id' not in session:
        return redirect(url_for('doctor_login'))

    files = request.files.getlist('documents')

    if not files or files[0].filename == '':
        flash('No files selected!')
        return redirect(request.referrer)

    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(f"uploads/{filename}")

            # Insert each file path into the database
            cur = mysql.connection.cursor()
            cur.execute("INSERT INTO appointment_documents (appointment_id, document_path) VALUES (%s, %s)", 
                        (appointment_id, f"uploads/{filename}"))
            mysql.connection.commit()
            cur.close()

    if saved_files:
        flash(f'Successfully uploaded {len(saved_files)} files.')
    else:
        flash('No valid files uploaded.')

    return redirect(url_for('view_document', appointment_id=appointment_id))



@app.route('/search_consulting_id', methods=['POST'])
def search_consulting_id():
    consulting_id = request.form.get('consulting_id')
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)  # Use MySQLdb cursor
    
    # Fetch appointment info by consulting ID
    cur.execute("SELECT * FROM appointment WHERE consulting_id = %s", (consulting_id,))
    appointment = cur.fetchone()
    cur.close()

    if appointment and appointment['document_path']:
        return redirect(url_for('static', filename=appointment['document_path']))
    else:
        flash("No document found for this Consulting ID", "warning")
        return redirect(url_for('doctor_dashboard'))
    


@app.route('/ocr/<path:document_path>')
def ocr_document(document_path):
    if not session.get('doctor_logged_in'):
        return redirect(url_for('doctor_login'))

    try:
        file_path = os.path.join(app.root_path, 'static', document_path)
        
        if not os.path.exists(file_path):
            flash("File not found.", "danger")
            return redirect(url_for('doctor_dashboard'))
        
        img = Image.open(file_path).convert('L')  # Grayscale for better OCR
        text = pytesseract.image_to_string(img)
        
        return render_template('ocr_result.html', text=text, document_path=document_path)
    
    except Exception as e:
        flash(f"Error during OCR: {e}", "danger")
        return redirect(url_for('doctor_dashboard'))
    
@app.route('/view_document/<int:appointment_id>')
def view_document(appointment_id):
    if 'doctor_id' not in session:
        return redirect(url_for('doctor_login'))

    # Fetch all document paths from the database
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT document_path FROM appointment_documents WHERE appointment_id = %s", (appointment_id,))
    results = cur.fetchall()
    cur.close()

    if results:
        # Generate links for each document
        document_links = []
        for result in results:
            document_path = result['document_path']
            link = url_for('process_document', appointment_id=appointment_id, document_path=document_path)
            document_links.append((document_path, link))

        return render_template('document_list.html', document_links=document_links)

    else:
        flash('No documents uploaded for this appointment.', 'warning')

    return redirect(url_for('doctor_dashboard'))

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
def clean_text(text):
    """Basic OCR text cleanup."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,;:!?()-]', '', text)
    return text.strip()

@app.route('/process_document/<int:appointment_id>/<path:document_path>')
def process_document(appointment_id, document_path):
    if 'doctor_id' not in session:
        return redirect(url_for('doctor_login'))

    file_path = os.path.join(app.root_path, 'static', document_path)

    if os.path.exists(file_path):
        reader = easyocr.Reader(['en'], gpu=False)
        ocr_result = reader.readtext(file_path)

        lines = [text.strip() for (_, text, _) in ocr_result if len(text.strip()) > 5]
        full_text = clean_text(" ".join(lines))

        # Improved summarization logic
        if len(full_text) > 20:
            max_chunk_len = 800
            chunks = textwrap.wrap(full_text, max_chunk_len, break_long_words=False, replace_whitespace=False)

            summaries = []
            for chunk in chunks:
                result = summarizer(chunk, max_length=60, min_length=30, do_sample=False)
                summaries.append(result[0]['summary_text'])

            overall_summary = " ".join(summaries)
        else:
            overall_summary = "Not enough content to summarize."

        # Take top 5 most relevant lines based on length
        important_lines = sorted(lines, key=lambda x: len(x), reverse=True)[:5]

        # Annotate image
        img = cv2.imread(file_path)
        for (bbox, text, prob) in ocr_result:
            top_left = tuple([int(val) for val in bbox[0]])
            bottom_right = tuple([int(val) for val in bbox[2]])
            cv2.rectangle(img, top_left, bottom_right, (0, 255, 0), 2)
            cv2.putText(img, text, top_left, cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        annotated_path = document_path.rsplit('.', 1)[0] + '_annotated.png'
        save_path = os.path.join(app.root_path, 'static', annotated_path)
        cv2.imwrite(save_path, img)

        return render_template('ocr_result.html',
                               summary=overall_summary,
                               important_lines=important_lines,
                               image_path=url_for('static', filename=annotated_path))
    else:
        flash('File not found.', 'danger')
        return redirect(url_for('view_document', appointment_id=appointment_id))
    


@app.route('/decrypt12')
def decrypt12():
    try:
        # Replace 'encryption12.py' with the actual path if needed
        subprocess.run(['streamlit', 'run', 'decrypt12.py'], check=True)
        return "Encryption process started. Check the Streamlit interface."
    except subprocess.CalledProcessError as e:
        return f"An error occurred: {e}"

@app.route('/encrypt12')
def encrypt12():
    try:
        # Replace 'encryption12.py' with the actual path if needed
        subprocess.run(['streamlit', 'run', 'encrypt12.py'], check=True)
        return "Encryption process started. Check the Streamlit interface."
    except subprocess.CalledProcessError as e:
        return f"An error occurred: {e}"

@app.route('/medicle_main')
def medicle_main():
    try:
        # Replace 'encryption12.py' with the actual path if needed
        subprocess.run(['streamlit', 'run', 'medicle_main.py'], check=True)
        return "Encryption process started. Check the Streamlit interface."
    except subprocess.CalledProcessError as e:
        return f"An error occurred: {e}"




    



    



if __name__ == '__main__':
    app.run(debug=True)
