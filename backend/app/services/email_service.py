import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _send_email(to_email: str, subject: str, html_body: str):
    """Send email via Gmail SMTP. Zero CPU - just a network call."""
    if not settings.MAIL_USERNAME or settings.MAIL_USERNAME == "your-email@gmail.com":
        print(f"\n{'='*60}")
        print(f"[EMAIL NOT CONFIGURED] To: {to_email}")
        print(f"[EMAIL NOT CONFIGURED] Set MAIL_USERNAME and MAIL_PASSWORD in .env")
        print(f"{'='*60}\n")
        return

    print(f"[EMAIL] Sending to {to_email}...")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_STARTTLS:
                server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())
            print(f"[EMAIL] ✅ Sent to {to_email}")
    except smtplib.SMTPAuthenticationError:
        print(f"[EMAIL] ❌ Auth failed — check Gmail App Password in .env")
        raise
    except Exception as e:
        print(f"[EMAIL] ❌ Error: {e}")
        raise


def send_verification_email(to_email: str, full_name: str, token: str):
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📚 Enterprise KB</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <h2 style="color: #111827;">Verify Your Email</h2>
        <p>Hi <strong>{full_name}</strong>,</p>
        <p style="color: #6b7280;">Thank you for registering. Click the button below to verify your email:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{verify_url}" style="background:#2563eb;color:white;padding:14px 28px;
             text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
            Verify Email Address
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;">Or copy this link:<br/>
          <a href="{verify_url}" style="color:#2563eb;">{verify_url}</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
          After verification, your account will be reviewed by an admin.
        </p>
      </div>
    </div>
    """
    _send_email(to_email, "Verify your email - Enterprise KB", html)


def send_approval_email(to_email: str, full_name: str):
    login_url = f"{settings.FRONTEND_URL}/login"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16a34a; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">✅ Account Approved</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Your account has been approved! You can now log in.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{login_url}" style="background:#16a34a;color:white;padding:12px 24px;
             text-decoration:none;border-radius:8px;font-weight:600;">Login Now</a>
        </div>
      </div>
    </div>
    """
    _send_email(to_email, "Account Approved - Enterprise KB", html)


def send_rejection_email(to_email: str, full_name: str, reason: str = None):
    reason_block = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Account Not Approved</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Unfortunately your account was not approved at this time.</p>
        {reason_block}
        <p style="color:#6b7280;">Please contact HR for more information.</p>
      </div>
    </div>
    """
    _send_email(to_email, "Account Status - Enterprise KB", html)


def send_dept_change_approved_email(to_email: str, full_name: str, dept_name: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Department Change Approved</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Your department change has been approved.</p>
        <p>You are now a member of: <strong>{dept_name}</strong></p>
      </div>
    </div>
    """
    _send_email(to_email, "Department Change Approved - Enterprise KB", html)
