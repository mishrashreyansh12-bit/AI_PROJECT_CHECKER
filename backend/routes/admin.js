const express = require("express");
const router = express.Router();

const { Influencer, Sale, Click, Payment } = require("../db");

console.log("ADMIN ROUTES LOADED");

// ================= SALES API =================
router.get("/sales", async (req, res) => {
  try {
    console.log("SALES API HIT");

    const sales = await Sale.findAll({
      include: [{ model: Influencer }],
      order: [["createdAt", "DESC"]],
    });

    return res.json(sales);
  } catch (error) {
    console.error("SALES ERROR:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;