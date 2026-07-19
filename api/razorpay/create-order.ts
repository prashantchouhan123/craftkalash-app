import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req: Request, res: Response) {
  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, receipt } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: "Razorpay credentials are not fully configured in the environment variables. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
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
    res.status(200).json(order);
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
  }
}
