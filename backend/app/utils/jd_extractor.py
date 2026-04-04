import io
import pdfplumber
from docx import Document


def extract_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])


def extract_jd_text(file_bytes: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        return extract_from_pdf(file_bytes)
    elif content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]:
        return extract_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {content_type}")