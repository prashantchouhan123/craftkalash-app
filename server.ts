import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";


dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get Razorpay config (only public Key ID)
  app.get("/api/razorpay/config", (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
    res.json({ keyId });
  });

  // API Route: Create Razorpay Order
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, receipt } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return res.status(500).json({
          error: "Razorpay credentials are not fully configured in the server environment variables. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
        });
      }

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount specified." });
      }

      // Call Razorpay API to create order
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64")
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // convert to paise
          currency: "INR",
          receipt: receipt || `receipt_${Date.now()}`
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay API error: ${errText}`);
      }

      const order = await response.json();
      res.json(order);
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
    }
  });

  // API Route: Verify Razorpay Signature
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keySecret) {
        return res.status(500).json({
          error: "Razorpay Key Secret is not configured in the server environment."
        });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment parameters for verification." });
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generatedSignature === razorpay_signature) {
        res.json({ verified: true });
      } else {
        res.status(400).json({ verified: false, error: "Signature verification failed" });
      }
    } catch (error: any) {
      console.error("Error verifying signature:", error);
      res.status(500).json({ error: error.message || "Failed to verify signature" });
    }
  });

  // Rate limiting map
  const ipLimits = new Map<string, { count: number; resetTime: number }>();

  // Helper to sanitize HTML to prevent spam/script injection
  function sanitizeInput(str: string): string {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // API Route: Contact Us Message Form Submission
  app.post("/api/contact", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      
      // 1. Rate Limiting Check (Max 5 submissions per 5 minutes per IP)
      const now = Date.now();
      const limit = ipLimits.get(ip);
      if (limit && now < limit.resetTime && limit.count >= 5) {
        return res.status(429).json({
          error: "Too many enquiries submitted from your IP. Please try again after 5 minutes."
        });
      }
      if (!limit || now > limit.resetTime) {
        ipLimits.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 });
      } else {
        limit.count += 1;
      }

      // 2. Extract and Validate fields
      const { name, email, phone, subject, message } = req.body;
      
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Your Name is a required field." });
      }
      if (!email || typeof email !== "string" || !isValidEmail(email)) {
        return res.status(400).json({ error: "A valid Email Address is required." });
      }
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Your Message content is required." });
      }

      // 3. Sanitize inputs
      const cleanName = sanitizeInput(name.trim());
      const cleanEmail = sanitizeInput(email.trim());
      const cleanPhone = phone ? sanitizeInput(String(phone).trim()) : "";
      const cleanSubject = subject ? sanitizeInput(String(subject).trim()) : "";
      const cleanMessage = sanitizeInput(message.trim());
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      console.log(`[Server /api/contact] Received message from ${cleanName} (${cleanEmail}) at ${timestamp}`);

      // 4. Save to Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
      let savedToDb = false;
      let dbErrorMessage = "";

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { error: dbError } = await supabase
            .from("contact_messages")
            .insert({
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone || null,
              subject: cleanSubject || null,
              message: cleanMessage,
              ip_address: ip,
              is_read: false
            });
          
          if (dbError) {
            console.error("[Server /api/contact] Database Insert Error:", dbError);
            dbErrorMessage = dbError.message;
          } else {
            console.log("[Server /api/contact] Enquiry successfully stored in Supabase contact_messages table.");
            savedToDb = true;
          }
        } catch (dbEx: any) {
          console.error("[Server /api/contact] Exception connecting to Supabase:", dbEx);
          dbErrorMessage = dbEx.message;
        }
      } else {
        console.warn("[Server /api/contact] Supabase is not configured. Skipping database insertion.");
        dbErrorMessage = "Supabase credentials missing";
      }

      // 5. Send email using Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      let emailSent = false;
      let emailErrorDetail = "";

      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #FAF8F5;
      color: #3C2F2F;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAF8F5;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #EBE5DB;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(111, 78, 55, 0.04);
    }
    .header {
      background-color: #6F4E37;
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header p {
      color: #FAF8F5;
      font-size: 13px;
      margin: 5px 0 0 0;
      opacity: 0.85;
    }
    .content {
      padding: 40px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #A16207;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 20px;
      border-bottom: 1px solid #FAF8F5;
      padding-bottom: 8px;
    }
    .field-row {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #F5EFEB;
    }
    .field-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .field-label {
      font-size: 10px;
      font-weight: 700;
      color: #8C7A6B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 14px;
      font-weight: 500;
      color: #3C2F2F;
      line-height: 1.5;
    }
    .message-box {
      background-color: #FAF8F5;
      border: 1px solid #EBE5DB;
      border-radius: 12px;
      padding: 20px;
      font-size: 13px;
      line-height: 1.6;
      color: #3C2F2F;
      white-space: pre-wrap;
      margin-top: 5px;
    }
    .footer {
      background-color: #FAF8F5;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #EBE5DB;
    }
    .footer p {
      font-size: 11px;
      color: #8C7A6B;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>CraftKalash</h1>
        <p>New Contact Form Submission</p>
      </div>
      <div class="content">
        <div class="section-title">Enquiry Details</div>
        
        <div class="field-row">
          <div class="field-label">Customer Name</div>
          <div class="field-value">${cleanName}</div>
        </div>
        
        <div class="field-row">
          <div class="field-label">Customer Email</div>
          <div class="field-value"><a href="mailto:${cleanEmail}" style="color: #6F4E37; text-decoration: underline;">${cleanEmail}</a></div>
        </div>
        
        <div class="field-row">
          <div class="field-label">Phone Number</div>
          <div class="field-value">${cleanPhone || '<em>Not provided</em>'}</div>
        </div>
        
        <div class="field-row">
          <div class="field-label">Subject</div>
          <div class="field-value">${cleanSubject || '<em>No subject</em>'}</div>
        </div>
        
        <div style="margin-top: 25px;">
          <div class="field-label">Message</div>
          <div class="message-box">${cleanMessage}</div>
        </div>
        
        <div class="section-title" style="margin-top: 35px;">Submission Metadata</div>
        
        <div class="field-row">
          <div class="field-label">Submitted At</div>
          <div class="field-value">${timestamp}</div>
        </div>
        
        <div class="field-row">
          <div class="field-label">IP Address</div>
          <div class="field-value" style="font-family: monospace; font-size: 12px;">${ip}</div>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated notification from the CraftKalash Heirlooms Portal.</p>
        <p style="margin-top: 4px;">&copy; 2026 CraftKalash. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
          `;

          const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
          const { data, error: emailError } = await resend.emails.send({
            from: `CraftKalash Portal <${fromEmail}>`,
            to: ["craftkalash.store@gmail.com"],
            subject: "New Contact Form Submission - CraftKalash",
            html: htmlContent
          });

          if (emailError) {
            console.error("[Server /api/contact] Resend API Error:", emailError);
            emailErrorDetail = emailError.message;
          } else {
            console.log("[Server /api/contact] Email dispatched successfully through Resend:", data);
            emailSent = true;
          }
        } catch (resendEx: any) {
          console.error("[Server /api/contact] Exception during Resend dispatch:", resendEx);
          emailErrorDetail = resendEx.message;
        }
      } else {
        console.warn("[Server /api/contact] RESEND_API_KEY is not configured in environment variables. Simulating email send in server logs.");
        emailSent = true; // Set to true to mock/succeed in sandbox if the user hasn't supplied a key yet
        emailErrorDetail = "RESEND_API_KEY missing from environment; email simulated";
      }

      res.json({
        success: true,
        message: "Enquiry processed successfully.",
        savedToDb,
        emailSent,
        dbError: dbErrorMessage || null,
        emailError: emailErrorDetail || null
      });

    } catch (err: any) {
      console.error("[Server /api/contact] Critical error in endpoint:", err);
      res.status(500).json({ error: err.message || "Failed to process enquiry" });
    }
  });

  // Serve Vite in dev mode, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
