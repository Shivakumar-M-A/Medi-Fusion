import streamlit as st
import fitz  # PyMuPDF
from PIL import Image
import easyocr
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from string import punctuation
import os

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

# Initialize OCR Reader
reader = easyocr.Reader(['en'])

st.title("📄 Medical Document Summarizer (OCR + NLTK)")

uploaded_file = st.file_uploader("Upload medical PDF/image", type=["pdf", "png", "jpg", "jpeg"])

def extract_text_from_image_file(image_file):
    image = Image.open(image_file).convert("RGB")
    image.save("temp_img.jpg")
    result = reader.readtext("temp_img.jpg", detail=0)
    os.remove("temp_img.jpg")
    return "\n".join(result)

def extract_text_from_pdf_images(pdf_file):
    text = ""
    pdf = fitz.open(stream=pdf_file.read(), filetype="pdf")
    for page_num in range(len(pdf)):
        page = pdf.load_page(page_num)
        pix = page.get_pixmap()
        image_path = f"page_{page_num}.png"
        pix.save(image_path)
        result = reader.readtext(image_path, detail=0)
        text += "\n".join(result) + "\n"
        os.remove(image_path)
    return text

def simple_summarizer(text, num_sentences=3):
    stop_words = set(stopwords.words('english') + list(punctuation))
    words = word_tokenize(text.lower())
    freq = {}
    for word in words:
        if word not in stop_words:
            freq[word] = freq.get(word, 0) + 1

    sentences = sent_tokenize(text)
    sentence_scores = {}
    for sent in sentences:
        for word in word_tokenize(sent.lower()):
            if word in freq:
                sentence_scores[sent] = sentence_scores.get(sent, 0) + freq[word]

    top_sentences = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
    return ' '.join(top_sentences)

if uploaded_file:
    st.info("⏳ Extracting text...")
    if uploaded_file.type == "application/pdf":
        extracted_text = extract_text_from_pdf_images(uploaded_file)
    else:
        extracted_text = extract_text_from_image_file(uploaded_file)

    if extracted_text.strip():
        st.subheader("📄 Extracted Text")
        st.text_area("Text", extracted_text, height=300)

        st.subheader("📝 Summary")
        summary = simple_summarizer(extracted_text)
        st.success(summary)
    else:
        st.warning("⚠ No text could be extracted. Try a clearer document.")
