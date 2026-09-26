import nodemailer from 'nodemailer';
import os from 'os';

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

export function getFrontendBaseUrl(req) {
  // 1. If request is provided, check if it came from a valid remote client
  if (req) {
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const parsed = new URL(origin);
        if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
          return `${parsed.protocol}//${parsed.host}`;
        }
      } catch {}
    }
  }

  // 2. Check FRONTEND_URL from environment
  const raw = process.env.FRONTEND_URL || '';
  const origins = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  // Look for any non-localhost URL (e.g. 10.x.x.x, domain, ngrok)
  const remoteOrigin = origins.find(
    (o) => !o.includes('localhost') && !o.includes('127.0.0.1')
  );
  if (remoteOrigin) {
    return remoteOrigin.replace(/\/$/, '');
  }

  // 3. Fallback: auto-detect computer's local network IP so mobile on WiFi can open it
  const localIp = getLocalIpAddress();
  if (localIp) {
    return `http://${localIp}:5173`;
  }

  // 4. Default fallback
  return (origins[0] || 'http://localhost:5173').replace(/\/$/, '');
}

function resetTemplate(name, url) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;background:#f7f5f0;font-family:Arial,sans-serif;color:#171717">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background:#fffdf8;border:1px solid #ddd9cf;border-radius:8px">
          <tr>
            <td style="padding:38px">
              <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:-.5px">SugarYield AI<span style="color:#2d7a3e">.</span></div>
              <div style="height:1px;background:#ddd9cf;margin:28px 0"></div>
              <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;margin:0 0 18px">Reset your password</h1>
              <p style="line-height:1.6;color:#5e5c56">Hello ${name},</p>
              <p style="line-height:1.6;color:#5e5c56">We received a request to reset the password associated with your account.</p>
              <p style="margin:28px 0">
                <a href="${url}" target="_blank" style="display:inline-block;background:#2d7a3e;color:#fff;text-decoration:none;padding:13px 24px;font-weight:bold;border-radius:6px">Reset Password</a>
              </p>
              <p style="line-height:1.6;color:#5e5c56">If the button above doesn't work, click or copy this link into your browser:</p>
              <p style="word-break:break-all;background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;margin:16px 0">
                <a href="${url}" target="_blank" style="color:#2d7a3e;font-size:13px;text-decoration:underline;">${url}</a>
              </p>
              <p style="line-height:1.6;color:#5e5c56;margin-top:24px">This link expires in 30 minutes. If you didn't request this password reset, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function verificationTemplate(name, url) {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;background:#f8faf9;font-family:Arial,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #e2e8e4;border-radius:12px">
          <tr>
            <td style="padding:40px 32px">
              <div style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:600;color:#2d7a3e">SugarYield AI</div>
              <div style="height:1px;background:#e2e8e4;margin:24px 0"></div>
              <h1 style="font-family:Inter,sans-serif;font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a">Verify your email address</h1>
              <p style="line-height:1.7;color:#4a5568;font-size:15px">Hello ${name},</p>
              <p style="line-height:1.7;color:#4a5568;font-size:15px">Thank you for signing up for SugarYield AI! To complete your registration and start using our AI-powered sugarcane yield forecasting platform, please verify your email address.</p>
              <p style="margin:32px 0;text-align:center">
                <a href="${url}" target="_blank" style="display:inline-block;background:#2d7a3e;color:#ffffff;text-decoration:none;padding:14px 32px;font-weight:600;font-size:15px;border-radius:8px;box-shadow:0 2px 4px rgba(45,122,62,0.2)">Verify Email Address</a>
              </p>
              <p style="line-height:1.7;color:#4a5568;font-size:14px">If the button above doesn't open in your browser, tap or copy this direct link:</p>
              <p style="word-break:break-all;background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;margin:12px 0">
                <a href="${url}" target="_blank" style="color:#2d7a3e;font-size:13px;text-decoration:underline;">${url}</a>
              </p>
              <p style="line-height:1.7;color:#4a5568;font-size:13px;margin-top:24px">This verification link will expire in 24 hours. If you didn't create an account with SugarYield AI, you can safely ignore this email.</p>
              <div style="margin-top:36px;padding-top:20px;border-top:1px solid #e2e8e4">
                <p style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#718096;margin:0">NIE · Agricultural Decision Support System</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendResetEmail(user, token, req) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });
  const url = `${getFrontendBaseUrl(req)}/reset-password/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Reset your SugarYield AI password',
    html: resetTemplate(user.name, url)
  });
}

export async function sendVerificationEmail(user, token, req) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });
  const url = `${getFrontendBaseUrl(req)}/verify-email/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Verify your email - SugarYield AI',
    html: verificationTemplate(user.name, url)
  });
}
