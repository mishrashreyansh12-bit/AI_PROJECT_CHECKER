import React from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  const handlePurchase = async () => {
    try {
      await axios.post("http://localhost:5000/api/track/sale", {
  referralCode: referralCode,
  amount: 4999,
  orderId: `ORD-${Date.now()}`
});

      alert("Purchase successful! Sale tracked successfully.");
    } catch (error) {
      console.error("Sale tracking error:", error.response?.data || error.message);
      alert("Error tracking sale.");
    }
  };
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Product Store</h1>
      <div
        style={{
          maxWidth: "400px",
          margin: "20px auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Premium Product</h2>
        <p>Price: ₹4,999</p>
        <button
          onClick={handlePurchase}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default Shop;