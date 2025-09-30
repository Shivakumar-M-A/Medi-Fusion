import streamlit as st
import easyocr
import os
from PIL import Image
import tempfile
import fitz  # PyMuPDF
import re

st.set_page_config(page_title="Medical Document Summarizer", layout="centered")

st.title("📄 Medical Document Summarizer")
st.write("Upload a **PDF or Image** medical record. The app will extract and summarize medical problems.")

uploaded_file = st.file_uploader("Upload PDF or Image", type=["pdf", "png", "jpg", "jpeg"])

# Predefined disease/medical problems list
disease_list = ["asthma", "seizures", "headaches", "migraine", "diabetes", "hypertension",
                "cholesterol", "cancer", "arthritis", "covid", "tuberculosis", "anemia"]

# Highlight disease names in red
def highlight_diseases(text):
    for disease in disease_list:
        pattern = re.compile(rf'\b({disease})\b', flags=re.IGNORECASE)
        text = pattern.sub(r"<span style='color:red'><b>\1</b></span>", text)
    return text

# Extract text from PDF using EasyOCR
def extract_text_from_pdf(file_path):
    reader = easyocr.Reader(['en'])
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            image = page.get_pixmap()
            temp_img_path = os.path.join(tempfile.gettempdir(), "temp_page.png")
            image.save(temp_img_path)
            result = reader.readtext(temp_img_path, detail=0)
            text += " ".join(result) + "\n"
    return text.strip()

# Extract text from image using EasyOCR
def extract_text_from_image(image_file):
    reader = easyocr.Reader(['en'])
    image = Image.open(image_file)
    result = reader.readtext(image, detail=0)
    return " ".join(result).strip()

# Find medical problems line
def extract_medical_problem_line(text):
    pattern = re.compile(r'(Medical Problems.*?:.*)', flags=re.IGNORECASE)
    match = pattern.search(text)
    if match:
        return match.group(1)
    return ""

# Main processing
if uploaded_file:
    file_ext = uploaded_file.name.split(".")[-1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix="." + file_ext) as tmp_file:
        tmp_file.write(uploaded_file.read())
        tmp_path = tmp_file.name

    st.success("✅ File uploaded successfully. Extracting text...")

    if file_ext == "pdf":
        extracted_text = extract_text_from_pdf(tmp_path)
    else:
        extracted_text = extract_text_from_image(tmp_path)

    if extracted_text:
        # Extract the Medical Problems line
        medical_line = extract_medical_problem_line(extracted_text)
        highlighted_line = highlight_diseases(medical_line)

        # Remove the medical line from full text to avoid duplication
        remaining_text = extracted_text.replace(medical_line, '').strip()

        # Display Medical Problems line
        st.markdown("### 🩺 Medical Problems")
        st.markdown(f"<div style='font-size:16px;'>{highlighted_line}</div>", unsafe_allow_html=True)

        # Display rest of the summary
        st.markdown("### 📋 Summary")
        st.markdown(f"<div style='font-size:15px; white-space: pre-wrap;'>{remaining_text}</div>", unsafe_allow_html=True)

    else:
        st.error("⚠️ No text could be extracted from the document.")
