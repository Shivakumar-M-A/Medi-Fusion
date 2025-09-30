import streamlit as st
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad
from PIL import Image
import io

# Function to encrypt an image
def encrypt_image(image_data, key):
    cipher = AES.new(key, AES.MODE_CBC)
    iv = cipher.iv
    padded_data = pad(image_data, AES.block_size)
    encrypted_data = cipher.encrypt(padded_data)
    return iv + encrypted_data

# Streamlit app for encryption
st.title("Image Encryption")

# AES key generation
if "key" not in st.session_state:
    st.session_state["key"] = get_random_bytes(32)  # AES-256 key

# Display the encryption key
st.subheader("Encryption Key")
encryption_key_hex = st.session_state["key"].hex()
st.code(encryption_key_hex, language="plaintext")

# Upload image
uploaded_file = st.file_uploader("Upload an image for encryption", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Read uploaded image
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image", use_column_width=True)

    # Convert image to bytes
    image_bytes = io.BytesIO()
    image.save(image_bytes, format=image.format)
    image_data = image_bytes.getvalue()

    # Encrypt image
    encrypted_image = encrypt_image(image_data, st.session_state["key"])
    st.success("Image encrypted successfully!")

    # Download encrypted image
    st.download_button(
        label="Download Encrypted Image",
        data=encrypted_image,
        file_name="encrypted_image.bin",
        mime="application/octet-stream"
    )
