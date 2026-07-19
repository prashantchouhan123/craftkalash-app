import type { Request, Response } from "express";
import crypto from "crypto";
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
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: "Signature verification failed" });
    }
  } catch (error: any) {
    console.error("Error verifying signature:", error);
    res.status(500).json({ error: error.message || "Failed to verify signature" });
  }
}
