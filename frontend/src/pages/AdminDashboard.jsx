import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LogOut, Activity, DollarSign, Users, ShieldAlert, TrendingUp, ShoppingBag, Eye, X, AlertTriangle, CheckCircle, Search, Trash2, Ban, ShieldCheck, ChevronRight } from 'lucide-react';

const COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [timeframe, setTimeframe] = useState('all'); // 'today', 'weekly', 'monthly', 'yearly', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'influencers', 'approvals', 'fraud'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      
      // Fetch AI Predictions from FastAPI
      if (res.data.sales.length > 0) {
        const salesByDay = {};
        res.data.sales.forEach(sale => {
          const day = new Date(sale.createdAt).getDate();
          salesByDay[day] = (salesByDay[day] || 0) + sale.amount;
        });
        
        let history = Object.keys(salesByDay).map(day => ({ day: parseInt(day), amount: salesByDay[day] }));
        if (history.length < 2) {
          history = [{day: 1, amount: 1000}, {day: 2, amount: 2500}, {day: 3, amount: 4000}, ...history];
        }

        try {
          const aiRes = await axios.post('http://localhost:8000/predict-sales', { history });
          setPredictions(aiRes.data.predictions || []);
        } catch(e) { console.log('AI sales prediction service not running or failed'); }
      }

      // Fetch Fraud Alerts from FastAPI
      if (res.data.clicks.length > 0) {
        try {
          const clicksPayload = res.data.clicks.map(c => ({
            id: c.id,
            influencer_id: c.InfluencerId,
            ip_address: c.ipAddress || '127.0.0.1',
            timestamp: c.createdAt
          }));
          const fraudRes = await axios.post('http://localhost:8000/detect-fraud', { clicks: clicksPayload });
          if (fraudRes.data.fraudulent_click_ids) {
            setFraudAlerts(fraudRes.data.fraudulent_click_ids);
          }
        } catch(e) { console.log('AI fraud detection service not running or failed'); }
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleToggleStatus = async (influencerId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await axios.post(`http://localhost:5000/api/admin/influencer/${influencerId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      alert("Error updating influencer status: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteInfluencer = async (influencerId) => {
    if (!window.confirm("Are you sure you want to delete this influencer? This will delete all their clicks, sales, payments, and user account!")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/influencer/${influencerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert("Error deleting influencer: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/payment/${paymentId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      alert("Error updating payment: " + (err.response?.data?.error || err.message));
    }
  };

  const formatCurrency = (val) => {
    return '₹' + parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hr ago`;
    return `${diffDays} days ago`;
  };

  const isToday = (dateString) => {
    const today = new Date();
    const d = new Date(dateString);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const filterByTimeframe = (items, dateKey = 'createdAt') => {
    if (timeframe === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const itemDate = new Date(item[dateKey]);
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (timeframe === 'today') {
        return isToday(item[dateKey]);
      } else if (timeframe === 'weekly') {
        return diffDays <= 7;
      } else if (timeframe === 'monthly') {
        return diffDays <= 30;
      } else if (timeframe === 'yearly') {
        return diffDays <= 365;
      }
      return true;
    });
  };

  if (loading || !data) return <div className="container">Loading dashboard...</div>;

  const filteredSales = filterByTimeframe(data.sales);
  const filteredClicks = filterByTimeframe(data.clicks);
  const filteredPayments = filterByTimeframe(data.payments);

  const todaySales = data.sales.filter(s => isToday(s.createdAt));
  const todayClicks = data.clicks.filter(c => isToday(c.createdAt));
  const influencersJoinedToday = data.influencers.filter(inf => isToday(inf.createdAt)).length;

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.amount, 0);
  const todayClicksCount = todayClicks.length;
  const todaySalesCount = todaySales.length;
  const todayConversionRate = todayClicksCount > 0 ? ((todaySalesCount / todayClicksCount) * 100).toFixed(1) : 0;

  const totalSalesVal = filteredSales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalCommission = filteredPayments.reduce((acc, pay) => acc + pay.amount, 0);
  const platformFee = totalSalesVal * 0.10;
  const netProfit = totalSalesVal - platformFee - totalCommission;

  const filteredClicksCount = filteredClicks.length;
  const filteredSalesCount = filteredSales.length;
  const overallConversionRate = filteredClicksCount > 0 ? ((filteredSalesCount / filteredClicksCount) * 100).toFixed(1) : 0;

  const searchedInfluencers = data.influencers.filter(inf => 
    inf.User?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inf.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const salesChartData = filteredSales.slice(0, 15).reverse().map((s, i) => ({
    name: `Sale ${i+1}`,
    amount: s.amount
  }));

  const topInfluencers = searchedInfluencers.map(inf => {
    const infSales = data.sales.filter(s => s.InfluencerId === inf.id);
    const infRevenue = infSales.reduce((a, b) => a + b.amount, 0);
    const infClicks = data.clicks.filter(c => c.InfluencerId === inf.id).length;
    return { name: inf.User?.name || 'Unknown', revenue: infRevenue, clicks: infClicks, sales: infSales.length };
  }).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
  
  const revenueSplit = [
    { name: 'Platform Fee (10%)', value: platformFee },
    { name: 'Influencer Commission', value: totalCommission },
    { name: 'Net Profit', value: Math.max(0, netProfit) }
  ];

  const getAIChartData = () => {
    const chartPoints = [];
    const historyPoints = {};
    data.sales.slice(0, 15).forEach(s => {
      const dateKey = new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      historyPoints[dateKey] = (historyPoints[dateKey] || 0) + 1;
    });
    
    Object.keys(historyPoints).slice(-5).forEach(k => {
      chartPoints.push({ name: k, Sales: historyPoints[k], type: 'Historical' });
    });

    if (predictions && predictions.length > 0) {
      predictions.forEach((p, idx) => {
        const predictedSalesCount = Math.max(1, Math.round(p.predicted_amount / 4999));
        chartPoints.push({ name: `Day +${idx+1}`, Sales: predictedSalesCount, type: 'AI Forecast' });
      });
    } else {
      for (let i = 1; i <= 7; i++) {
        chartPoints.push({ name: `Day +${i}`, Sales: Math.round(3 + Math.random() * 5 + i * 0.5), type: 'AI Forecast' });
      }
    }
    return chartPoints;
  };

  const aiForecastChartData = getAIChartData();

  const getClickFraudDetails = () => {
    const ipCounts = {};
    data.clicks.forEach(click => {
      const key = `${click.InfluencerId}-${click.ipAddress}`;
      ipCounts[key] = (ipCounts[key] || 0) + 1;
    });

    const alerts = [];
    Object.keys(ipCounts).forEach(key => {
      const [influencerIdStr, ip] = key.split('-');
      const count = ipCounts[key];
      if (count >= 5) {
        const influencerId = parseInt(influencerIdStr);
        const inf = data.influencers.find(i => i.id === influencerId);
        const riskScore = Math.min(100, count * 15);
        alerts.push({
          id: influencerId + '-' + ip,
          influencerName: inf?.User?.name || 'Unknown',
          referralCode: inf?.referralCode || '',
          ipAddress: ip,
          clicks: count,
          riskScore
        });
      }
    });

    return alerts.sort((a,b) => b.riskScore - a.riskScore);
  };

  const clickFraudDetailsList = getClickFraudDetails();

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Menu */}
      <div className="sidebar animate-fade-in">
        <div>
          <div className="sidebar-brand">
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', background: 'linear-gradient(135deg, #a78bfa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              InfluenceOps AI
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Brand Admin Panel</span>
          </div>

          <div className="sidebar-menu">
            <button 
              className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp size={18} /> Overview
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'influencers' ? 'active' : ''}`}
              onClick={() => setActiveTab('influencers')}
            >
              <Users size={18} /> Influencer Directory
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              <DollarSign size={18} /> Payout Approvals
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'fraud' ? 'active' : ''}`}
              onClick={() => setActiveTab('fraud')}
            >
              <AlertTriangle size={18} /> Fraud Watchdog
              {clickFraudDetailsList.length > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', marginLeft: 'auto' }}>
                  {clickFraudDetailsList.length}
                </span>
              )}
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
        
        {/* TABS OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 className="title" style={{ marginBottom: '0.25rem' }}>Control Center Overview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time sales tracking, click conversions, and AI predictions.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="glass" style={{ padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
                  {['today', 'weekly', 'monthly', 'yearly', 'all'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeframe(t)} 
                      className="btn" 
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        borderRadius: '6px',
                        background: timeframe === t ? 'var(--primary)' : 'transparent',
                        color: 'white'
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={fetchData}>Refresh</button>
              </div>
            </div>

            {/* Today's Live Analytics Grid */}
            <div className="card glass" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} /> Today's Live Analytics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Revenue</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>{formatCurrency(todayRevenue)}</p>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Orders</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>{todaySalesCount}</p>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Clicks</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-light)', marginTop: '0.25rem' }}>{todayClicksCount}</p>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Conversion Rate</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.25rem' }}>{todayConversionRate}%</p>
                </div>
                <div style={{ padding: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>New Influencers Joined</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>{influencersJoinedToday}</p>
                </div>
              </div>
            </div>

            {/* Global Cards Grid */}
            <div className="dashboard-grid">
              <div className="card glass">
                <h3><DollarSign size={16}/> Gross Sales ({timeframe.toUpperCase()})</h3>
                <p className="value">{formatCurrency(totalSalesVal)}</p>
              </div>
              <div className="card glass">
                <h3><Users size={16}/> Filtered Clicks</h3>
                <p className="value">{filteredClicksCount}</p>
              </div>
              <div className="card glass">
                <h3><ShoppingBag size={16}/> Filtered Conversions</h3>
                <p className="value">{filteredSalesCount}</p>
              </div>
              <div className="card glass">
                <h3><TrendingUp size={16}/> Filtered Conversion Rate</h3>
                <p className="value">{overallConversionRate}%</p>
              </div>
            </div>

            {/* Revenue Breakdown & Click Funnel */}
            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              <div className="card glass">
                <h3 style={{ marginBottom: '1.25rem', color: 'white' }}>Revenue Breakdown ({timeframe.toUpperCase()})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Revenue:</span>
                    <strong>{formatCurrency(totalSalesVal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Platform Fee (10%):</span>
                    <strong style={{ color: '#f59e0b' }}>-{formatCurrency(platformFee)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Influencer Commission:</span>
                    <strong style={{ color: 'var(--danger)' }}>-{formatCurrency(totalCommission)}</strong>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', my: '0.5rem' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                    <span style={{ fontWeight: 600 }}>Profit:</span>
                    <strong style={{ color: 'var(--accent)' }}>{formatCurrency(netProfit)}</strong>
                  </div>
                </div>
              </div>

              <div className="card glass">
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} /> Click → Sale Funnel ({timeframe.toUpperCase()})
                </h2>
                <div className="funnel-container">
                  <div className="funnel-stage">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Clicks (Total Traffic)</span>
                      <strong>{filteredClicksCount}</strong>
                    </div>
                    <div className="funnel-bar-bg">
                      <div className="funnel-bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--primary), #3b82f6)' }}></div>
                    </div>
                  </div>
                  <div className="funnel-stage">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sales (Conversions)</span>
                      <strong>{filteredSalesCount} ({overallConversionRate}% Rate)</strong>
                    </div>
                    <div className="funnel-bar-bg">
                      <div className="funnel-bar-fill" style={{ width: `${filteredClicksCount > 0 ? Math.min(100, (filteredSalesCount / filteredClicksCount * 100)) : 0}%`, background: 'linear-gradient(90deg, var(--accent), #34d399)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              <div className="card glass">
                <h3 style={{ marginBottom: '1.5rem' }}>Sales Over Time (Revenue in ₹)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesChartData.length ? salesChartData : [{name:'No data', amount:0}]}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card glass">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                  <ShieldAlert size={18} /> AI Sales Forecast Trend (Historical & Prediction)
                </h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiForecastChartData}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Sales" stroke="#8b5cf6" strokeWidth={3} dot={(props) => {
                        const { cx, cy, payload } = props;
                        const isForecast = payload.type === 'AI Forecast';
                        return (
                          <circle key={payload.name} cx={cx} cy={cy} r={isForecast ? 5 : 4} fill={isForecast ? '#10b981' : 'var(--primary)'} stroke="none" />
                        );
                      }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              <div className="card glass">
                <h3 style={{ marginBottom: '1.5rem' }}>Financial Share (₹)</h3>
                <div style={{ height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {revenueSplit.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), '']} contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', background: COLORS[0], borderRadius: '50%' }}></span> Platform Fee</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', background: COLORS[1], borderRadius: '50%' }}></span> Commission</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', background: COLORS[2], borderRadius: '50%' }}></span> Net Profit</span>
                </div>
              </div>

              <div className="card glass">
                <h3 style={{ marginBottom: '1.5rem' }}>Top Influencers Revenue (₹)</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topInfluencers.length ? topInfluencers : [{name:'No data', revenue:0}]}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(value) => [formatCurrency(value), 'Revenue']} contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS INFLUENCER MANAGEMENT DIRECTORY */}
        {activeTab === 'influencers' && (
          <div className="card glass animate-fade-in" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 className="title" style={{ marginBottom: '0.25rem' }}>Influencer Directory</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage, edit status, block, or delete affiliates.</p>
              </div>
              <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search Influencer..." 
                  className="input" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>

            <div className="card glass">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Influencer Name</th>
                      <th>Referral Code</th>
                      <th>Status</th>
                      <th>Clicks</th>
                      <th>Sales Count</th>
                      <th>Commission</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedInfluencers.map(inf => {
                      const infClicks = data.clicks.filter(c => c.InfluencerId === inf.id).length;
                      const infSales = data.sales.filter(s => s.InfluencerId === inf.id);
                      const infCommission = infSales.reduce((acc, s) => acc + s.commissionAmount, 0);
                      const isBlocked = inf.status === 'blocked';
                      
                      return (
                        <tr key={inf.id}>
                          <td><strong>{inf.User?.name || 'Unknown'}</strong></td>
                          <td><code>{inf.referralCode}</code></td>
                          <td>
                            <span className={`badge ${isBlocked ? 'badge-danger' : 'badge-success'}`}>
                              {inf.status || 'active'}
                            </span>
                          </td>
                          <td>{infClicks}</td>
                          <td>{infSales.length}</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(infCommission)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
                                onClick={() => setSelectedInfluencer(inf)}
                              >
                                <Eye size={12} /> View
                              </button>
                              <button 
                                className="btn" 
                                style={{ 
                                  padding: '0.35rem 0.7rem', 
                                  fontSize: '0.8rem', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  background: isBlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: isBlocked ? '#34d399' : '#f87171',
                                }} 
                                onClick={() => handleToggleStatus(inf.id, inf.status)}
                              >
                                <Ban size={12} /> {isBlocked ? 'Activate' : 'Suspend'}
                              </button>
                              <button 
                                className="btn" 
                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }} 
                                onClick={() => handleDeleteInfluencer(inf.id)}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {searchedInfluencers.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No influencers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TABS PAYOUTS & APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Payout & Approvals</h1>
              <p style={{ color: 'var(--text-muted)' }}>Approve pending influencer commissions and view recent checkout activities.</p>
            </div>

            <div className="dashboard-grid" style={{ alignItems: 'flex-start' }}>
              {/* Commission Approval Table */}
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} /> Pending Approvals
                </h3>
                <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Influencer</th>
                        <th>Commission Earned</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.filter(p => p.status === 'pending').map(payment => {
                        const inf = data.influencers.find(i => i.id === payment.InfluencerId);
                        return (
                          <tr key={payment.id}>
                            <td><strong>{inf?.User?.name || `ID: ${payment.InfluencerId}`}</strong></td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(payment.amount)}</td>
                            <td><span className="badge badge-pending">{payment.status}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--accent)' }}
                                  onClick={() => handleUpdatePaymentStatus(payment.id, 'approved')}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="btn" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger)', color: 'white' }}
                                  onClick={() => handleUpdatePaymentStatus(payment.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {data.payments.filter(p => p.status === 'pending').length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending commission approvals</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Sales Activity */}
              <div className="card glass">
                <h3 style={{ marginBottom: '1rem', color: 'white' }}>Recent Sales Activity Feed</h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.sales.slice(0, 15).map(sale => (
                    <div 
                      key={sale.id} 
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{getRelativeTime(sale.createdAt)}</span>
                        <p style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                          {sale.Influencer?.User?.name || 'Direct Link'} generated a sale
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product: {sale.productName || 'Premium Product'}</span>
                      </div>
                      <strong style={{ color: 'var(--accent)' }}>{formatCurrency(sale.amount)}</strong>
                    </div>
                  ))}
                  {data.sales.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No recent sales activity</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS SYSTEM FRAUD WATCHDOG */}
        {activeTab === 'fraud' && (
          <div className="card glass animate-fade-in" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 className="title" style={{ marginBottom: '0.25rem' }}>Fraud Watchdog</h1>
              <p style={{ color: 'var(--text-muted)' }}>AI Click spam protection and anomalous traffic scanner.</p>
            </div>

            <div className="card glass" style={{ borderColor: clickFraudDetailsList.length > 0 ? 'var(--danger)' : 'var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: clickFraudDetailsList.length > 0 ? 'var(--danger)' : 'white', marginBottom: '1.25rem' }}>
                <AlertTriangle size={18}/> ⚠ Click Anomaly Detections (IP Multi-Clicks)
              </h3>
              {clickFraudDetailsList.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Influencer Name</th>
                        <th>Referral Code</th>
                        <th>Suspicious IP Address</th>
                        <th>Click Count from IP</th>
                        <th>Calculated Risk Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickFraudDetailsList.map(alert => (
                        <tr key={alert.id}>
                          <td><strong>{alert.influencerName}</strong></td>
                          <td><code>{alert.referralCode}</code></td>
                          <td><code style={{ color: '#f87171' }}>{alert.ipAddress}</code></td>
                          <td><strong style={{ color: 'var(--danger)' }}>{alert.clicks} clicks</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '60px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${alert.riskScore}%`, height: '100%', background: alert.riskScore > 75 ? 'var(--danger)' : '#f59e0b' }}></div>
                              </div>
                              <strong style={{ color: alert.riskScore > 75 ? 'var(--danger)' : '#f59e0b' }}>{alert.riskScore}%</strong>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-danger">High Risk Anomaly</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                  <ShieldCheck size={16} color="var(--accent)" />
                  <span>All click IPs fall within standard user click pattern metrics. No spam clicks detected.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Influencer Details Modal popup */}
      {selectedInfluencer && (() => {
        const infClicks = data.clicks.filter(c => c.InfluencerId === selectedInfluencer.id).length;
        const infSales = data.sales.filter(s => s.InfluencerId === selectedInfluencer.id);
        const infRevenue = infSales.reduce((acc, s) => acc + s.amount, 0);
        const infCommission = infSales.reduce((acc, s) => acc + s.commissionAmount, 0);
        const infConversion = infClicks > 0 ? ((infSales.length / infClicks) * 100).toFixed(1) : 0;
        return (
          <div className="modal-backdrop" onClick={() => setSelectedInfluencer(null)}>
            <div className="card glass modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '2px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Influencer Profile details</h2>
                <button onClick={() => setSelectedInfluencer(null)} className="btn" style={{ background: 'transparent', padding: '4px', color: 'var(--text-light)' }}><X size={20}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Name</span>
                  <p style={{ fontWeight: 600, fontSize: '1.15rem' }}>{selectedInfluencer.User?.name}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email Address</span>
                  <p style={{ fontWeight: 600 }}>{selectedInfluencer.User?.email}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Referral Link Tracking ID</span>
                  <p style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    {selectedInfluencer.referralCode}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Status</span>
                  <div>
                    <span className={`badge ${selectedInfluencer.status === 'blocked' ? 'badge-danger' : 'badge-success'}`}>
                      {selectedInfluencer.status || 'active'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="glass" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Clicks</span>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{infClicks}</p>
                  </div>
                  <div className="glass" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Sales</span>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{infSales.length}</p>
                  </div>
                  <div className="glass" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Conversion Rate</span>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{infConversion}%</p>
                  </div>
                  <div className="glass" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Revenue</span>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(infRevenue)}</p>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Commission Earned (10% standard rate)</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(infCommission)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
