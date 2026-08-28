import fitz  # PyMuPDF
import pdfplumber
import io

class PDFProcessor:
    @staticmethod
    def extract_text_from_bytes(file_bytes: bytes, filename: str = "") -> str:
        text = ""
        # Try PyMuPDF first
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"[PDFProcessor] PyMuPDF failed: {e}")

        # Fallback to pdfplumber
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"[PDFProcessor] pdfplumber failed: {e}")

        # Plain text fallback if uploaded as .txt or raw text bytes
        try:
            return file_bytes.decode("utf-8", errors="ignore").strip()
        except Exception as e:
            print(f"[PDFProcessor] UTF-8 fallback failed: {e}")
            return ""
