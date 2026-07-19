import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  // Support both GET and OPTIONS/CORS methods
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(45) // Method not allowed
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
  res.status(200).json({ keyId });
}
