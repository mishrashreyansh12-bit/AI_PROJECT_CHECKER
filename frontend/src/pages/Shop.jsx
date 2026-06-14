import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, Trash2, Check, Star, Shield, ArrowRight, X } from "lucide-react";

const PRODUCTS = [
  {
    id: "prod-1",
    name: "Premium Analytics Suite",
    price: 4999,
    rating: 4.8,
    reviews: 142,
    description: "Get advanced web traffic insights, click heatmaps, and referrer tracking dashboards in real-time.",
    features: ["Real-time Tracking", "Click Heatmaps", "Unlimited Domains", "API Access"],
    imageColor: "linear-gradient(135deg, #a78bfa, #3b82f6)"
  },
  {
    id: "prod-2",
    name: "Creator Pro Gear Bundle",
    price: 9999,
    rating: 4.9,
    reviews: 89,
    description: "Perfect kit for streaming: Ring light, high-fidelity studio condenser microphone, and heavy-duty tripod.",
    features: ["10-inch Ring Light", "Studio USB Mic", "Adjustable Metal Tripod", "Noise isolation mount"],
    imageColor: "linear-gradient(135deg, #10b981, #059669)"
  },
  {
    id: "prod-3",
    name: "SaaS Starter Kit Boilerplate",
    price: 2499,
    rating: 4.7,
    reviews: 216,
    description: "Ready-to-deploy Next.js boilerplates, preconfigured databases, styling templates, and Auth logic.",
    features: ["Next.js & React 19", "Sequelize/SQLite config", "Tailwind components", "JWT Auth prebuilt"],
    imageColor: "linear-gradient(135deg, #f59e0b, #d97706)"
  }
];

export default function Shop() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("shop"); // 'shop', 'checkout', 'success'
  const [formData, setFormData] = useState({ name: "", email: "", card: "4111 2222 3333 4444" });
  const [orderSummary, setOrderSummary] = useState(null);

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, amount) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + amount;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const subtotal = getSubtotal();
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    try {
      // If referred, track sales in backend
      if (referralCode) {
        for (const item of cart) {
          await axios.post("http://localhost:5000/api/track/sale", {
            referralCode: referralCode,
            amount: item.product.price * item.quantity,
            productName: item.product.name,
            orderId: `${orderId}-${item.product.id}`,
            customerName: formData.name,
            customerEmail: formData.email
          });
        }
      }
      
      // Save order details to show on success screen
      setOrderSummary({
        orderId,
        items: [...cart],
        total: subtotal,
        name: formData.name,
        email: formData.email
      });

      setCart([]);
      setCheckoutStep("success");
    } catch (error) {
      console.error("Sale checkout error:", error.response?.data || error.message);
      alert("Error processing checkout: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "sans-serif" }}>
      
      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", sticky: "top", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(10px)" }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", fontWeight: 700, background: "linear-gradient(135deg, #a78bfa, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          InfluenceOps AI Store
        </h2>
        
        {/* Referral info badge */}
        {referralCode && (
          <span style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "999px", color: "#c084fc", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", background: "#a78bfa", borderRadius: "50%" }}></span>
            Referred by: <strong>{referralCode}</strong>
          </span>
        )}

        <button 
          onClick={() => setIsCartOpen(true)} 
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.6rem 1rem", borderRadius: "8px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
        >
          <ShoppingCart size={18} />
          <strong>Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</strong>
        </button>
      </nav>

      {/* Main Shop View */}
      {checkoutStep === "shop" && (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Premium Tools for Creators</h1>
            <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Level up your streaming, analytics, and software deployments instantly.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {PRODUCTS.map(product => (
              <div 
                key={product.id} 
                className="glass" 
                style={{ 
                  background: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "16px", 
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s"
                }}
              >
                <div>
                  {/* Mock Image Placeholder */}
                  <div style={{ width: "100%", height: "180px", background: product.imageColor, borderRadius: "10px", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingCart size={48} color="white" style={{ opacity: 0.8 }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{product.name}</h2>
                  </div>

                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", color: "#fbbf24" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{product.rating} ({product.reviews} reviews)</span>
                  </div>

                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>{product.description}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {product.features.map((f, idx) => (
                      <span key={idx} style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1" }}>
                        <Check size={14} color="#10b981" /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Price</span>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "white" }}>₹{product.price.toLocaleString("en-IN")}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    style={{ backgroundColor: "#8b5cf6", color: "white", border: "none", padding: "0.75rem 1.25rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }}
                  >
                    Add to Cart <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "420px", height: "100vh", backgroundColor: "#1e293b", borderLeft: "1px solid rgba(255,255,255,0.1)", zIndex: 1100, display: "flex", flexDirection: "column", padding: "1.5rem", boxShadow: "-5px 0 25px rgba(0,0,0,0.5)", animation: "slideIn 0.3s ease" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Your Shopping Cart</h3>
            <button onClick={() => setIsCartOpen(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", margin: "1rem 0" }}>
            {cart.map(item => (
              <div key={item.product.id} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
                <div style={{ width: "50px", height: "50px", background: item.product.imageColor, borderRadius: "6px" }}></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>{item.product.name}</h4>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>₹{item.product.price.toLocaleString("en-IN")}</span>
                </div>
                
                {/* Quantity Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => updateQuantity(item.product.id, -1)} style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", border: "none", color: "white", cursor: "pointer" }}>-</button>
                  <span style={{ fontSize: "0.9rem", width: "16px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", border: "none", color: "white", cursor: "pointer" }}>+</button>
                </div>

                <button onClick={() => removeFromCart(item.product.id)} style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", marginLeft: "10px" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 1rem" }}>
                <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: "#94a3b8" }}>Subtotal:</span>
              <strong style={{ fontSize: "1.2rem" }}>₹{getSubtotal().toLocaleString("en-IN")}</strong>
            </div>

            {referralCode && (
              <div style={{ fontSize: "0.8rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "#34d399", marginBottom: "1rem" }}>
                ✔ 10% Influencer Payout will be tracked under: <strong>{referralCode}</strong>
              </div>
            )}

            <button 
              onClick={() => {
                setIsCartOpen(false);
                setCheckoutStep("checkout");
              }} 
              disabled={cart.length === 0}
              style={{ width: "100%", backgroundColor: cart.length > 0 ? "#8b5cf6" : "#475569", color: "white", border: "none", padding: "1rem", borderRadius: "8px", fontWeight: 600, cursor: cart.length > 0 ? "pointer" : "not-allowed" }}
            >
              Checkout Order
            </button>
          </div>
        </div>
      )}

      {/* Checkout Steps (Overlay Form) */}
      {checkoutStep === "checkout" && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
          <div className="card glass" style={{ width: "90%", maxWidth: "480px", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", color: "white" }}>Secure Checkout</h2>
              <button onClick={() => setCheckoutStep("shop")} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="input-group">
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="input" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5e1" }}>Card Details (Mock)</label>
                <input 
                  type="text" 
                  required 
                  className="input" 
                  value={formData.card}
                  onChange={(e) => setFormData({ ...formData, card: e.target.value })}
                />
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span>Total Amount:</span>
                  <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>₹{getSubtotal().toLocaleString("en-IN")}</strong>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", background: "#10b981" }}>
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Screen */}
      {checkoutStep === "success" && orderSummary && (
        <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
          <div className="card glass animate-fade-in" style={{ width: "100%", maxWidth: "520px", padding: "2.5rem", textAlign: "center", border: "2px solid var(--accent)" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(16,185,129,0.15)", border: "2px solid var(--accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <Check size={36} color="#10b981" />
            </div>

            <h1 style={{ fontSize: "2rem", color: "white", marginBottom: "0.5rem" }}>Payment Successful!</h1>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>Your order has been placed. A confirmation email has been sent to {orderSummary.email}.</p>

            <div className="glass" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)", borderRadius: "10px", textAlign: "left", marginBottom: "2rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#94a3b8" }}>Order ID:</span>
                <strong><code>{orderSummary.orderId}</code></strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#94a3b8" }}>Customer:</span>
                <strong>{orderSummary.name}</strong>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.75rem 0" }} />
              
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "0.5rem" }}>Items:</span>
                {orderSummary.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span>{item.product.name} (x{item.quantity})</span>
                    <strong>₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</strong>
                  </div>
                ))}
              </div>
              
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.75rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem" }}>
                <span style={{ fontWeight: 600 }}>Total Paid:</span>
                <strong style={{ color: "var(--accent)" }}>₹{orderSummary.total.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <button 
              onClick={() => setCheckoutStep("shop")} 
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );
}