import streamlit as st
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from PIL import Image
import io

# Function to decrypt an image
def decrypt_image(encrypted_data, key):
    iv = encrypted_data[:AES.block_size]
    encrypted_data = encrypted_data[AES.block_size:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted_data = unpad(cipher.decrypt(encrypted_data), AES.block_size)
    return decrypted_data

# Streamlit app for decryption
st.title("Image Decryption")

# AES key input
key_input = st.text_area("Enter the AES key in hexadecimal format")
try:
    key = bytes.fromhex(key_input.strip())
except ValueError:
    key = None
    st.error("Invalid key format. Please provide a valid hexadecimal key.")

# Upload encrypted file
uploaded_file = st.file_uploader("Upload the encrypted image file", type=["bin"])

if uploaded_file is not None and key:
    # Read encrypted image data
    encrypted_data = uploaded_file.read()

    try:
        # Decrypt image
        decrypted_data = decrypt_image(encrypted_data, key)
        decrypted_image = Image.open(io.BytesIO(decrypted_data))
        st.image(decrypted_image, caption="Decrypted Image", use_column_width=True)
        st.success("Image decrypted successfully!")
    except Exception as e:
        st.error(f"Decryption failed: {str(e)}")
