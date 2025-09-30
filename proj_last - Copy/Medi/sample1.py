import streamlit as st
import easyocr
from transformers import pipeline
from pdf2image import convert_from_bytes
import cv2
import numpy as np
from PIL import Image

# Load models
reader = easyocr.Reader(['en'], gpu=False)
summarizer = pipeline("summarization", model="t5-small", tokenizer="t5-small")

st.title("📄 PDF OCR and Summarization App")

uploaded_pdf = st.file_uploader("Upload a PDF", type="pdf")

if uploaded_pdf:
    # Convert PDF to images
    images = convert_from_bytes(uploaded_pdf.read())
    
    st.info(f"📃 Extracted {len(images)} page(s) from PDF.")

    full_text = ""
    for i, page in enumerate(images):
        st.subheader(f"📄 Page {i + 1}")
        img_np = np.array(page)

        # OCR
        ocr_result = reader.readtext(img_np)
        extracted_text = " ".join([text for (_, text, _) in ocr_result])
        full_text += " " + extracted_text

        # Annotate image
        annotated_img = img_np.copy()
        for (bbox, text, prob) in ocr_result:
            top_left = tuple(map(int, bbox[0]))
            bottom_right = tuple(map(int, bbox[2]))
            cv2.rectangle(annotated_img, top_left, bottom_right, (0, 255, 0), 2)
            cv2.putText(annotated_img, text, top_left, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

        # Display
        st.image(annotated_img, caption="Annotated OCR", channels="RGB")
        st.text_area("📝 Extracted Text", extracted_text, height=150)

    # Final summary
    if full_text.strip():
        st.subheader("🧠 Summary")
        input_text = "summarize: " + full_text.strip()
        summary = summarizer(input_text, max_length=60, min_length=20, do_sample=False)[0]['summary_text']
        st.success(summary)
    else:
        st.warning("No readable text found in the PDF.")
