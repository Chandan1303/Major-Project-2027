import nodemailer from 'nodemailer';

function resetTemplate(name, url) {
  return `<!doctype html><html><body style="margin:0;background:#f7f5f0;font-family:Arial,sans-serif;color:#171717"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background:#fffdf8;border:1px solid #ddd9cf"><tr><td style="padding:38px"><div style="font-family:Georgia,serif;font-size:24px;letter-spacing:-.5px">ATELIER<span style="color:#a34d32">.</span></div><div style="height:1px;background:#ddd9cf;margin:28px 0"></div><h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;margin:0 0 18px">Reset your password</h1><p style="line-height:1.6;color:#5e5c56">Hello ${name},</p><p style="line-height:1.6;color:#5e5c56">We received a request to reset the password associated with your account.</p><p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#a34d32;color:#fff;text-decoration:none;padding:13px 20px;font-weight:bold">Reset Password</a></p><p style="line-height:1.6;color:#5e5c56">This link expires in 30 minutes. If you didn't request this password reset, you can safely ignore this email.</p></td></tr></table></td></tr></table></body></html>`;
}
export async function sendResetEmail(user, token) {
  const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST, port: Number(process.env.EMAIL_PORT), secure: Number(process.env.EMAIL_PORT) === 465, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });
  const url = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/reset-password/${token}`;
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to: user.email, subject: 'Reset your Atelier password', html: resetTemplate(user.name, url) });
}
