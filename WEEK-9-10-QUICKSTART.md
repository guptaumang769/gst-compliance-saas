# Week 9-10 Quick Start Guide 🚀

**Feature:** Invoice PDF Generation & Email Service  
**Status:** ✅ Ready to Test  
**Time to Setup:** 10 minutes

---

## 📦 Step 1: Install Dependencies (Windows)

```powershell
cd C:\Users\gupta\AI-SaaS-Project\gst-compliance-saas\backend
npm install pdfkit nodemailer
```

**Expected:** Packages installed successfully.

---

## 🗄️ Step 2: Update Database

```powershell
npx prisma generate
npx prisma migrate dev --name add_pdf_email_fields
```

**Expected:** Migration successful, new fields added to Invoice model.

---

## ⚙️ Step 3: Configure Email (.env)

Add to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Your Company Name

# PDF Storage
PDF_STORAGE_PATH=./storage/invoices
```

### Get Gmail App Password:
1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to **App passwords**
4. Generate password for "Mail"
5. Copy password to `EMAIL_PASSWORD` in `.env`

---

## 🧪 Step 4: Test

### Start Backend:
```powershell
npm run dev
```

### Run Tests:
```powershell
node src/test-pdf-email.js
```

**Expected Output:**
```
✅ Login successful
✅ Using existing invoice: INV-202601-001
✅ PDF generated successfully
✅ PDF downloaded successfully
✅ PDF regenerated successfully
✅ Email configuration is valid
⏭️  Send Test Email (skipped - requires manual input)
⏭️  Send Invoice Email (skipped - requires manual input)
✅ Complete workflow successful!

Total Tests: 7
✅ Passed: 5
❌ Failed: 0
⏭️  Skipped: 2
Success Rate: 100%
```

---

## 🎯 Step 5: Try It Out!

### Generate PDF:
```bash
POST http://localhost:5000/api/invoices/{invoice-id}/generate-pdf
Authorization: Bearer {your-token}
```

### Download PDF:
```bash
GET http://localhost:5000/api/invoices/{invoice-id}/download-pdf
Authorization: Bearer {your-token}
```

### Send Invoice Email:
```bash
POST http://localhost:5000/api/invoices/{invoice-id}/send-email
Authorization: Bearer {your-token}
Body:
{
  "to": "customer@example.com",
  "subject": "Your Invoice",
  "message": "Thank you for your business!"
}
```

---

## 📂 What Was Created

```
backend/
├── src/
│   ├── services/
│   │   ├── pdfService.js ✅ (650 lines)
│   │   └── emailService.js ✅ (250 lines)
│   ├── controllers/
│   │   └── invoiceController.js (updated)
│   ├── routes/
│   │   └── invoiceRoutes.js (updated)
│   └── test-pdf-email.js ✅ (7 tests)
├── prisma/schema.prisma (updated)
├── storage/invoices/ (auto-created)
└── WEEK-9-10-SUMMARY.md ✅
```

---

## 💡 Common Issues

### Issue 1: Email not configured
**Error:** `Email configuration not set`  
**Fix:** Add email settings to `.env` file

### Issue 2: PDF file not found
**Error:** `PDF not generated for this invoice`  
**Fix:** Generate PDF first using `/generate-pdf` endpoint

### Issue 3: Gmail authentication fails
**Error:** `Invalid login credentials`  
**Fix:** Use App Password, not your regular Gmail password

---

## 📖 Full Documentation

- **Complete Guide:** `WEEK-9-10-SUMMARY.md`
- **API Details:** See "New API Endpoints" section in summary
- **Customization:** See "Customization Options" in summary

---

## ✅ Success Criteria

After completing all steps:
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Email configured
- [ ] Tests passing (5 out of 7)
- [ ] Can generate PDF
- [ ] Can download PDF
- [ ] Can send test email

---

## 🚀 Next Steps

**Option A: Test with Real Data**
1. Create a real invoice
2. Generate its PDF
3. Send to yourself via email
4. Verify formatting

**Option B: Proceed to Week 11-12**
- Subscription & Payments (Razorpay)
- OR Frontend Development (React UI)

---

**Time Saved:** 15 minutes → 5 seconds per invoice!  
**Business Value:** Professional invoicing with one click! 📄✉️
