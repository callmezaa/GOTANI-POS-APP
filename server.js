const express = require("express");
const cors = require("cors");
const midtransClient = require("midtrans-client");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MIDTRANS CLIENT INIT
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// ✅ Buat Snap Token
app.post("/create-transaction", async (req, res) => {
  const { orderId, grossAmount, customerName } = req.body;

  try {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customerName || "Pelanggan",
      },
    };

    const transaction = await snap.createTransaction(parameter);
    res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Gagal membuat transaksi" });
  }
});

// ✅ Webhook untuk update status pembayaran
app.post("/webhook", (req, res) => {
  const payload = req.body;

  console.log("Webhook received:", payload);

  // TODO: Di sini kamu bisa update status pembayaran ke Firebase pakai Admin SDK

  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("Midtrans Server is running!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
