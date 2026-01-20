import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("SMTP_FROM_NAME", "B2B Leads")

    def send_email(self, recipient_email: str, subject: str, body_html: str, body_text: str = ""):
        if not self.smtp_user or not self.smtp_password:
            logger.error("SMTP credentials not configured.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = recipient_email

            if body_text:
                msg.attach(MIMEText(body_text, "plain"))
            if body_html:
                msg.attach(MIMEText(body_html, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, recipient_email, msg.as_string())
            
            logger.info(f"Email sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending email to {recipient_email}: {e}")
            return False

    def render_template(self, template_html: str, data: dict):
        """
        Simple placeholder replacement.
        Example: {nombre_empresa} -> data['nombre_empresa']
        """
        for key, value in data.items():
            placeholder = "{" + key + "}"
            template_html = template_html.replace(placeholder, str(value))
        return template_html

email_service = EmailService()
