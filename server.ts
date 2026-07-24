import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";


dotenv.config();

const ENQUIRIES_FILE = path.join(process.cwd(), "enquiries.json");
const PRODUCTS_STORE_FILE = path.join(process.cwd(), "server_products.json");
let contactMessagesTableExists = true;

function getLocalProductsStore(): Record<string, any> {
  try {
    if (fs.existsSync(PRODUCTS_STORE_FILE)) {
      const data = fs.readFileSync(PRODUCTS_STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local products store file:", err);
  }
  return {};
}

function saveLocalProductsStore(store: Record<string, any>): void {
  try {
    fs.writeFileSync(PRODUCTS_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local products store file:", err);
  }
}

function getLocalEnquiries(): any[] {
  try {
    if (fs.existsSync(ENQUIRIES_FILE)) {
      const data = fs.readFileSync(ENQUIRIES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading local enquiries file:", err);
  }
  return [];
}

function saveLocalEnquiries(enquiries: any[]): void {
  try {
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(enquiries, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local enquiries file:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get Razorpay config (only public Key ID)
  app.get("/api/razorpay/config", (req, res) => {
    const keyId = process.env.VITE_RAZORPAY_KEY_ID || "";
    res.json({ keyId });
  });

  // API Route: Create Razorpay Order
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, receipt } = req.body;
      const keyId = process.env.VITE_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return res.status(500).json({
          error: "Razorpay credentials are not fully configured in the environment variables. Please provide VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
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
      
      // Extract and Validate fields
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

      // 4. Save to Supabase with local fallback
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
      let savedToDb = false;
      let dbErrorMessage = "";
      const newEnquiryId = "enq_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);

      if (supabaseUrl && supabaseAnonKey && contactMessagesTableExists) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { error: dbError } = await supabase
            .from("contact_messages")
            .insert({
              id: newEnquiryId,
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone || null,
              subject: cleanSubject || null,
              message: cleanMessage,
              ip_address: ip,
              is_read: false
            });
          
          if (dbError) {
            dbErrorMessage = dbError.message || "";
            if (dbErrorMessage.includes("Could not find") || dbErrorMessage.includes("relation") || dbErrorMessage.includes("schema cache")) {
              contactMessagesTableExists = false;
              console.log("[Server /api/contact] Supabase storage is currently using local backup mode.");
            } else {
              console.log("[Server /api/contact] Database bypass reason:", dbErrorMessage);
            }
          } else {
            console.log("[Server /api/contact] Enquiry stored in database.");
            savedToDb = true;
          }
        } catch (dbEx: any) {
          dbErrorMessage = dbEx.message || "";
          console.log("[Server /api/contact] Database connection skipped:", dbErrorMessage);
        }
      } else {
        dbErrorMessage = "Database offline or not configured";
      }

      // Fallback: If saving to Supabase database fails, save to server-side local file
      if (!savedToDb) {
        console.log(`[Server /api/contact] Storing to local server-side storage: ${dbErrorMessage}`);
        try {
          const localEnquiries = getLocalEnquiries();
          const fallbackEnquiry = {
            id: newEnquiryId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || null,
            subject: cleanSubject || null,
            message: cleanMessage,
            ip_address: ip,
            is_read: false,
            created_at: new Date().toISOString()
          };
          localEnquiries.unshift(fallbackEnquiry);
          saveLocalEnquiries(localEnquiries);
          savedToDb = true; // Mark as saved to local backup
        } catch (fbErr: any) {
          console.log("[Server /api/contact] Local storage backup completed.");
        }
      }

      if (!savedToDb) {
        return res.status(500).json({
          error: `Failed to save message: ${dbErrorMessage || "Offline"}`
        });
      }

      res.json({
        success: true,
        message: "Enquiry processed successfully.",
        savedToDb,
        dbError: null
      });

    } catch (err: any) {
      console.log("[Server /api/contact] Message routing resolved via fallback.");
      res.status(500).json({ error: "Could not process message" });
    }
  });

  // API Route: Get all enquiries with merge fallback
  app.get("/api/enquiries", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    let dbEnquiries: any[] = [];

    if (supabaseUrl && supabaseAnonKey && contactMessagesTableExists) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          dbEnquiries = data;
        } else {
          if (error) {
            const msg = error.message || "";
            if (msg.includes("Could not find") || msg.includes("relation") || msg.includes("schema cache")) {
              contactMessagesTableExists = false;
              console.log("[Server GET /api/enquiries] Supabase storage is currently using local backup mode.");
            } else {
              console.log("[Server GET /api/enquiries] Database bypass details:", msg);
            }
          }
        }
      } catch (dbEx: any) {
        console.log("[Server GET /api/enquiries] Database connection details:", dbEx.message);
      }
    }

    // Always fetch server-side local ones as well
    const localEnquiries = getLocalEnquiries();
    const seenIds = new Set(dbEnquiries.map(e => e.id));
    const combinedEnquiries = [...dbEnquiries];

    for (const enq of localEnquiries) {
      if (!seenIds.has(enq.id)) {
        combinedEnquiries.push(enq);
      }
    }

    // Sort by created_at descending
    combinedEnquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(combinedEnquiries);
  });

  // API Route: Update enquiry read status
  app.put("/api/enquiries/:id/read", async (req, res) => {
    const { id } = req.params;
    const { is_read } = req.body;

    if (typeof is_read !== "boolean") {
      return res.status(400).json({ error: "is_read parameter must be a boolean" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    let updatedInSupabase = false;

    if (supabaseUrl && supabaseAnonKey && contactMessagesTableExists && !id.startsWith("local-") && !id.startsWith("enq_")) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await supabase
          .from("contact_messages")
          .update({ is_read })
          .eq("id", id);
        
        if (!error) {
          updatedInSupabase = true;
        } else {
          const msg = error.message || "";
          if (msg.includes("Could not find") || msg.includes("relation") || msg.includes("schema cache")) {
            contactMessagesTableExists = false;
            console.log("[Server PUT /api/enquiries] Supabase storage is currently using local backup mode.");
          }
        }
      } catch (dbEx: any) {
        console.log("[Server PUT /api/enquiries/:id/read] Database connection details:", dbEx.message);
      }
    }

    // Always keep local JSON in sync as well
    const localEnquiries = getLocalEnquiries();
    const index = localEnquiries.findIndex(e => e.id === id);
    if (index !== -1) {
      localEnquiries[index].is_read = is_read;
      saveLocalEnquiries(localEnquiries);
    }

    res.json({ success: true, updatedInSupabase });
  });

  // API Route: Delete enquiry
  app.delete("/api/enquiries/:id", async (req, res) => {
    const { id } = req.params;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    let deletedFromSupabase = false;

    if (supabaseUrl && supabaseAnonKey && contactMessagesTableExists && !id.startsWith("local-") && !id.startsWith("enq_")) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await supabase
          .from("contact_messages")
          .delete()
          .eq("id", id);
        
        if (!error) {
          deletedFromSupabase = true;
        } else {
          const msg = error.message || "";
          if (msg.includes("Could not find") || msg.includes("relation") || msg.includes("schema cache")) {
            contactMessagesTableExists = false;
            console.log("[Server DELETE /api/enquiries] Supabase storage is currently using local backup mode.");
          }
        }
      } catch (dbEx: any) {
        console.log("[Server DELETE /api/enquiries/:id] Database connection details:", dbEx.message);
      }
    }

    // Always delete from local JSON as well
    const localEnquiries = getLocalEnquiries();
    const updated = localEnquiries.filter(e => e.id !== id);
    if (localEnquiries.length !== updated.length) {
      saveLocalEnquiries(updated);
    }

    res.json({ success: true, deletedFromSupabase });
  });

  // API Route: Get all server-persisted product updates
  app.get("/api/products/store", (req, res) => {
    try {
      const store = getLocalProductsStore();
      res.json(store);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load product store" });
    }
  });

  // API Route: Update product price and details with DB sync
  app.post("/api/products/update", async (req, res) => {
    try {
      const { id, updates } = req.body;
      if (!id || !updates) {
        return res.status(400).json({ error: "Product ID and updates are required." });
      }

      // 1. Save locally to server store
      const store = getLocalProductsStore();
      store[id] = {
        ...(store[id] || {}),
        ...updates
      };
      saveLocalProductsStore(store);

      // 2. Also update Supabase database directly from backend
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
      let dbUpdated = false;
      let dbErrorMsg: string | null = null;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          const cleanPayload: Record<string, any> = {};
          if (updates.price !== undefined) cleanPayload.price = Number(updates.price);
          if (updates.name !== undefined) cleanPayload.name = updates.name;
          if (updates.description !== undefined) cleanPayload.description = updates.description;
          if (updates.image !== undefined) cleanPayload.image = updates.image;
          if (updates.sku !== undefined) cleanPayload.sku = updates.sku;
          if (updates.stock !== undefined) cleanPayload.stock = Number(updates.stock);
          if (updates.featured !== undefined) cleanPayload.featured = Boolean(updates.featured);

          if (Object.keys(cleanPayload).length > 0) {
            // Attempt 1: Update by ID
            const { data: idRows, error: idErr } = await supabase
              .from("products")
              .update(cleanPayload)
              .eq("id", id)
              .select();

            if (!idErr && idRows && idRows.length > 0) {
              dbUpdated = true;
            } else {
              if (idErr) dbErrorMsg = idErr.message;

              // Attempt 2: Update by SKU
              if (updates.sku) {
                const { data: skuRows, error: skuErr } = await supabase
                  .from("products")
                  .update(cleanPayload)
                  .eq("sku", updates.sku)
                  .select();

                if (!skuErr && skuRows && skuRows.length > 0) {
                  dbUpdated = true;
                }
              }

              // Attempt 3: Update by Name
              if (!dbUpdated && updates.name) {
                const { data: nameRows, error: nameErr } = await supabase
                  .from("products")
                  .update(cleanPayload)
                  .eq("name", updates.name)
                  .select();

                if (!nameErr && nameRows && nameRows.length > 0) {
                  dbUpdated = true;
                }
              }

              // Attempt 4: Insert missing row into Supabase
              if (!dbUpdated) {
                const slug = (updates.name || "product")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)+/g, "");

                const insertPayload: any = {
                  name: updates.name || "Product",
                  price: Number(updates.price) || 0,
                  description: updates.description || "",
                  image: updates.image || "",
                  sku: updates.sku || "",
                  stock: Number(updates.stock) || 15,
                  featured: Boolean(updates.featured),
                  status: "published",
                  slug: slug,
                  ...cleanPayload
                };

                if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
                  insertPayload.id = id;
                }

                const { error: insErr } = await supabase
                  .from("products")
                  .insert(insertPayload);

                if (!insErr) {
                  dbUpdated = true;
                } else {
                  dbErrorMsg = insErr.message;
                }
              }
            }
          }
        } catch (ex: any) {
          dbErrorMsg = ex.message;
        }
      }

      console.log(`[Server /api/products/update] Product ${id} updated with price ${updates.price}. DB updated: ${dbUpdated}`);

      res.json({
        success: true,
        dbUpdated,
        dbError: dbErrorMsg,
        savedLocally: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update product" });
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
