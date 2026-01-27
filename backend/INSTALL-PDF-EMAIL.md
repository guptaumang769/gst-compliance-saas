# Install PDF & Email Dependencies

Run these commands in the `backend` directory:

```bash
# PDF Generation
npm install pdfkit

# Email Service
npm install nodemailer

# File System utilities (already included in Node.js)
# fs, path
```

## Package Details:

### pdfkit
- **Purpose:** Generate PDF invoices
- **Version:** Latest stable
- **Docs:** https://pdfkit.org/

### nodemailer
- **Purpose:** Send emails with attachments
- **Version:** Latest stable
- **Docs:** https://nodemailer.com/

## Environment Variables to Add:

Add these to your `.env` file:

```env
# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=GST Compliance SaaS

# PDF Storage
PDF_STORAGE_PATH=./storage/invoices
```

## Gmail App Password Setup:

If using Gmail:
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate app password for "Mail"
4. Use that password in `EMAIL_PASSWORD`

## Testing Email:

For development, you can use:
- **Mailtrap.io** (fake SMTP for testing)
- **Gmail** (with app password)
- **SendGrid** (production recommended)
