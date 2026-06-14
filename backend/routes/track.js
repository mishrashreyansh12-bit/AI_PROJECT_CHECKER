const express = require("express");
const router = express.Router();

const { Influencer, Sale, Click, Payment } = require("../db");

console.log("TRACK ROUTES LOADED");

// ================= DASHBOARD =================
router.get("/dashboard", async (req, res) => {
  try {
    const totalSales = (await Sale.sum("amount")) || 0;
    const totalClicks = await Click.count();
    const activeInfluencers = await Influencer.count();

    const pendingPayments =
      (await Payment.sum("amount", {
        where: { status: "pending" },
      })) || 0;

    const topInfluencers = await Influencer.findAll({
      include: [{ model: Sale }],
      limit: 5,
    });

    res.json({
      totalSales,
      totalClicks,
      activeInfluencers,
      pendingPayments,
      topInfluencers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= GET SALES =================
router.get("/sales", async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [{ model: Influencer }],
      order: [["createdAt", "DESC"]],
    });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= 🔥 ADD THIS (IMPORTANT) =================
router.post("/sale", async (req, res) => {
  try {
    const { referralCode, amount, orderId, productName, customerName, customerEmail } = req.body;

    const influencer = await Influencer.findOne({
      where: { referralCode }
    });

    if (!influencer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    if (influencer.status === 'blocked') {
      return res.status(403).json({ error: "Affiliate account is suspended" });
    }

    const sale = await Sale.create({
      InfluencerId: influencer.id,
      amount,
      commissionAmount: amount * influencer.commissionRate,
      orderId: orderId || `ORD-${Date.now()}`,
      productName: productName || 'Premium Product',
      customerName: customerName || 'Anonymous Customer',
      customerEmail: customerEmail || 'N/A'
    });

    // Automatically create a corresponding pending payout record
    const payment = await Payment.create({
      InfluencerId: influencer.id,
      amount: amount * influencer.commissionRate,
      status: 'pending'
    });

    res.json({
      message: "Sale tracked successfully",
      sale,
      payment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;