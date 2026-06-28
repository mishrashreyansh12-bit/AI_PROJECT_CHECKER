import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LogOut, Copy, TrendingUp, CheckCircle, DollarSign, ArrowDownToLine, Bell, ShoppingBag, CreditCard, Activity, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';

export default function InfluencerDashboard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'payouts', 'resources'
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchMe = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/influencer/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      generateNotifications(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError(`Backend server is offline or not responding. Make sure backend is running on ${API_URL}`);
      }
    }
  };

  useEffect(() => {
    fetchMe();
  }, [navigate]);

  const generateNotifications = (profileData) => {
    const alerts = [];
    
    // Check for recent sales
    if (profileData.Sales && profileData.Sales.length > 0) {
      const lastSale = profileData.Sales[profileData.Sales.length - 1];
      alerts.push({
        id: 'sale',
        type: 'success',
        message: `✅ New Sale Generated: Earned ${formatCurrency(lastSale.commissionAmount)} commission from Order ${lastSale.orderId}!`
      });
    }

    // Check for approved payouts
    const approvedPayments = profileData.Payments.filter(p => p.status === 'approved');
    if (approvedPayments.length > 0) {
      const totalApproved = approvedPayments.reduce((acc, p) => acc + p.amount, 0);
      alerts.push({
        id: 'payout',
        type: 'info',
        message: `💰 Payout Approved: ${formatCurrency(totalApproved)} is available for immediate withdrawal.`
      });
    }

    // Check for click anomalies
    const ipCounts = {};
    profileData.Clicks.forEach(c => {
      ipCounts[c.ipAddress] = (ipCounts[c.ipAddress] || 0) + 1;
    });
    const hasSpam = Object.values(ipCounts).some(count => count >= 5);
    if (hasSpam) {
      alerts.push({
        id: 'fraud',
        type: 'warning',
        message: `⚠ Fraud Warning: High frequency clicks detected from same IP. Link traffic monitored.`
      });
    }

    setNotifications(alerts);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${API_URL}/t/${data.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawal = async () => {
    setWithdrawing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/influencer/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Withdrawal request processed! ${res.data.processedPaymentsCount} payments updated to PAID.`);
      fetchMe();
    } catch (err) {
      alert("Withdrawal request failed: " + (err.response?.data?.error || err.message));
    } finally {
      setWithdrawing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDownloadLogo = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="400" height="100">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a78bfa" stop-opacity="1" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="1" />
        </linearGradient>
      </defs>
      <text x="20" y="60" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="32" fill="url(#logo-grad)">InfluenceOps AI</text>
      <circle cx="340" cy="50" r="15" fill="none" stroke="url(#logo-grad)" stroke-width="4"/>
      <path d="M 333 50 L 347 50 M 340 43 L 340 57" stroke="url(#logo-grad)" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'influenceops_logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return '₹' + parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const isToday = (dateString) => {
    const today = new Date();
    const d = new Date(dateString);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  if (error) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="card glass animate-fade-in" style={{ maxWidth: '460px', padding: '2.5rem', textAlign: 'center', borderColor: 'var(--danger)', borderWidth: '2px' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={36} color="var(--danger)" />
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.5rem' }}>Connection Failed</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={fetchMe} style={{ width: '100%', background: 'var(--danger)' }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="container">Loading your profile...</div>;

  const totalEarnings = data.Payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const availableBalance = data.Payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0);
  const pendingEarnings = data.Payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const overallClicks = data.Clicks.length;
  const overallSales = data.Sales.length;
  const conversionRate = overallClicks > 0 ? ((overallSales / overallClicks) * 100).toFixed(1) : 0;

  const todayClicks = data.Clicks.filter(c => isToday(c.createdAt));
  const todaySales = data.Sales.filter(s => isToday(s.createdAt));
  const todayClicksCount = todayClicks.length;
  const todaySalesCount = todaySales.length;
  const todayCommission = todaySales.reduce((acc, s) => acc + s.commissionAmount, 0);
  const todayConversionRate = todayClicksCount > 0 ? ((todaySalesCount / todayClicksCount) * 100).toFixed(1) : 0;

  const productSalesMap = {};
  data.Sales.forEach(s => {
    const name = s.productName || 'Premium Product';
    productSalesMap[name] = (productSalesMap[name] || 0) + 1;
  });
  const productSalesList = Object.keys(productSalesMap).map(name => ({
    name,
    sales: productSalesMap[name]
  })).sort((a,b) => b.sales - a.sales);

  const getTrendData = () => {
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      const dayClicks = data.Clicks.filter(c => {
        const cDate = new Date(c.createdAt);
        return cDate.getDate() === d.getDate() && cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
      }).length;
      
      const daySales = data.Sales.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate.getDate() === d.getDate() && sDate.getMonth() === d.getMonth() && sDate.getFullYear() === d.getFullYear();
      });
      
      const dayEarnings = daySales.reduce((acc, s) => acc + s.commissionAmount, 0);
      
      trend.push({
        name: dateStr,
        Clicks: dayClicks,
        Conversions: daySales.length,
        Earnings: dayEarnings
      });
    }
    return trend;
  };

  const trendChartData = getTrendData();

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Menu */}
      <div className="sidebar animate-fade-in">
        <div>
          <div className="sidebar-brand">
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', background: 'linear-gradient(135deg, #a78bfa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              InfluenceOps AI
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Influencer Portal</span>
          </div>

          <div className="sidebar-menu">
            <button 
              className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp size={18} /> Overview
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              <Activity size={18} /> Traffic & Funnels
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'payouts' ? 'active' : ''}`}
              onClick={() => setActiveTab('payouts')}
            >
              <DollarSign size={18} /> Payouts & Products
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <ShoppingBag size={18} /> Brand Creatives
            </button>
          </div>
        </div>

        <div>
          <button onClick={handleLogout} className="sidebar-link" style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)', borderRadius: 0, paddingTop: '1.25rem' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Right Content Panel */}
      <div className="main-content">
        
        {/* TABS OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Welcome Back, {user.name}!</h1>
              <p style={{ color: 'var(--text-muted)' }}>Here is your dashboard for tracking affiliate clicks and commission payouts.</p>
            </div>
            
            {/* Referral Link Card */}
            <div className="card glass animate-fade-in" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
              <div>
                <h3>Your Unique Referral Link</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.2rem', wordBreak: 'break-all', marginTop: '0.25rem' }}>{API_URL}/t/{data.referralCode}</p>
              </div>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? <><CheckCircle size={18} style={{ marginRight: '8px' }}/> Copied!</> : <><Copy size={18} style={{ marginRight: '8px' }}/> Copy Link</>}
              </button>
            </div>

            {/* Dynamic Alerts/Notifications Board */}
            {notifications.length > 0 && (
              <div className="card glass" style={{ marginBottom: '2rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '0.75rem' }}>
                  <Bell size={18} /> Notification Alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map((n, idx) => (
                    <div key={idx} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--primary)', borderRadius: '0 6px 6px 0', fontSize: '0.9rem' }}>
                      {n.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Global Cards Grid */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
              <div className="card glass">
                <h3><TrendingUp size={16}/> Total Clicks</h3>
                <p className="value">{overallClicks}</p>
              </div>
              <div className="card glass">
                <h3><CheckCircle size={16}/> Conversions</h3>
                <p className="value">{overallSales}</p>
              </div>
              <div className="card glass">
                <h3><TrendingUp size={16}/> Conversion Rate</h3>
                <p className="value">{conversionRate}%</p>
              </div>
            </div>

            {/* Today's Live Performance Panel */}
            <div className="card glass" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} /> Today's Live Performance
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clicks Today</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>{todayClicksCount}</p>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sales Today</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>{todaySalesCount}</p>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Commission Today</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.25rem' }}>{formatCurrency(todayCommission)}</p>
                </div>
                <div style={{ padding: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Conversion Rate Today</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>{todayConversionRate}%</p>
                </div>
              </div>
            </div>

            {/* Recent Referral Sales log directly on Overview page */}
            <div className="card glass" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'white' }}>Recent Referral Sales & Customer Log</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Customer Name</th>
                      <th>Customer Email</th>
                      <th>Purchase Date</th>
                      <th>Sale Amount</th>
                      <th>Your Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.Sales.slice().reverse().map(sale => (
                      <tr key={sale.id}>
                        <td><code style={{ color: 'var(--primary)', fontWeight: 600 }}>{sale.orderId}</code></td>
                        <td><strong>{sale.productName || 'Premium Product'}</strong></td>
                        <td><span style={{ fontWeight: 600, color: 'var(--text-light)' }}>{sale.customerName || 'Anonymous Customer'}</span></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{sale.customerEmail || 'N/A'}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(sale.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{formatCurrency(sale.amount)}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCurrency(sale.commissionAmount)}</td>
                      </tr>
                    ))}
                    {data.Sales.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No referral sales tracked yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TABS TRAFFIC & FUNNELS */}
        {activeTab === 'trends' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Traffic & Funnels</h1>
              <p style={{ color: 'var(--text-muted)' }}>Analyze traffic flow and conversion dropoffs.</p>
            </div>

            <div className="dashboard-grid">
              {/* Trend Chart */}
              <div className="card glass">
                <h3 style={{ marginBottom: '1.5rem' }}>Referral Trends (Last 7 Days)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Clicks" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Conversions" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="card glass">
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} /> Click → Sale Funnel
                </h2>
                <div className="funnel-container">
                  <div className="funnel-stage">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Clicks (Total Traffic)</span>
                      <strong>{overallClicks}</strong>
                    </div>
                    <div className="funnel-bar-bg">
                      <div className="funnel-bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--primary), #3b82f6)' }}></div>
                    </div>
                  </div>
                  <div className="funnel-stage">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sales (Conversions)</span>
                      <strong>{overallSales} ({conversionRate}% Rate)</strong>
                    </div>
                    <div className="funnel-bar-bg">
                      <div className="funnel-bar-fill" style={{ width: `${overallClicks > 0 ? Math.min(100, (overallSales / overallClicks * 100)) : 0}%`, background: 'linear-gradient(90deg, var(--accent), #34d399)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS PAYOUTS & PRODUCTS */}
        {activeTab === 'payouts' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Payouts & Products</h1>
              <p style={{ color: 'var(--text-muted)' }}>Request withdrawals, review top-selling items, and check payout logs.</p>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
              {/* Withdrawal Card */}
              <div className="card glass" style={{ borderColor: availableBalance > 0 ? 'var(--accent)' : 'var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16}/> Available Balance</h3>
                  <p className="value" style={{ color: 'var(--accent)' }}>{formatCurrency(availableBalance)}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved payouts ready for withdrawal</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleWithdrawal} 
                  disabled={availableBalance === 0 || withdrawing}
                  style={{ marginTop: '1.25rem', background: availableBalance > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: availableBalance > 0 ? 'white' : 'var(--text-muted)', cursor: availableBalance > 0 ? 'pointer' : 'not-allowed' }}
                >
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </div>

              <div className="card glass">
                <h3><DollarSign size={16}/> Paid Earnings</h3>
                <p className="value">{formatCurrency(totalEarnings)}</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successfully transferred to bank</span>
              </div>
              
              <div className="card glass">
                <h3><TrendingUp size={16}/> Pending Commission</h3>
                <p className="value">{formatCurrency(pendingEarnings)}</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting brand approval</span>
              </div>
            </div>

            <div className="dashboard-grid" style={{ alignItems: 'flex-start' }}>
              {/* Top Products */}
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem' }}>Top Selling Products</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Units Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSalesList.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sales} sales</td>
                        </tr>
                      ))}
                      {productSalesList.length === 0 && (
                        <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products sold yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payout History */}
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem' }}>Payout & Withdrawal History</h3>
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.Payments.slice().reverse().map(payment => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</td>
                          <td>
                            <span className={`badge ${payment.status === 'paid' ? 'badge-success' : payment.status === 'pending' ? 'badge-pending' : 'badge-danger'}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.Payments.length === 0 && (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payout records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Sales Details & Customer Log */}
            <div className="card glass" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'white' }}>Recent Referral Sales & Customer Log</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Customer Name</th>
                      <th>Customer Email</th>
                      <th>Purchase Date</th>
                      <th>Sale Amount</th>
                      <th>Your Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.Sales.slice().reverse().map(sale => (
                      <tr key={sale.id}>
                        <td><code style={{ color: 'var(--primary)', fontWeight: 600 }}>{sale.orderId}</code></td>
                        <td><strong>{sale.productName || 'Premium Product'}</strong></td>
                        <td><span style={{ fontWeight: 600, color: 'var(--text-light)' }}>{sale.customerName || 'Anonymous Customer'}</span></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{sale.customerEmail || 'N/A'}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(sale.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{formatCurrency(sale.amount)}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCurrency(sale.commissionAmount)}</td>
                      </tr>
                    ))}
                    {data.Sales.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No referral sales tracked yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TABS BRAND RESOURCES */}
        {activeTab === 'resources' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Brand Creatives & Assets</h1>
              <p style={{ color: 'var(--text-muted)' }}>Download banners and brand vector logos to promote products.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                <div>
                  <strong style={{ color: 'white', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Affiliate Banner Image</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sleek dark gradient banner for social media and website footers.</span>
                  <div style={{ width: '100%', height: '100px', background: 'url(/banner.png) center/cover no-repeat', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--border)' }}></div>
                </div>
                <a href="/banner.png" download="affiliate_banner.png" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', textDecoration: 'none', fontSize: '0.85rem' }}>
                  <ArrowDownToLine size={16} style={{ marginRight: '6px' }} /> Download Banner
                </a>
              </div>

              <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                <div>
                  <strong style={{ color: 'white', display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Platform Brand Logo SVG</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vector brand assets to insert on review landing pages.</span>
                  
                  <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', background: 'linear-gradient(135deg, #a78bfa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      InfluenceOps AI
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleDownloadLogo} style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}>
                  <ArrowDownToLine size={16} style={{ marginRight: '6px' }} /> Download vector assets
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
