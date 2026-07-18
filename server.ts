import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";

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
