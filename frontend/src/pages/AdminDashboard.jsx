import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LogOut, Activity, DollarSign, Users, ShieldAlert } from 'lucide-react';

const COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      
      // Fetch AI Predictions
      if (res.data.sales.length > 0) {
        // Group sales by day for prediction
        const salesByDay = {};
        res.data.sales.forEach(sale => {
          const day = new Date(sale.createdAt).getDate();
          salesByDay[day] = (salesByDay[day] || 0) + sale.amount;
        });
        
        let history = Object.keys(salesByDay).map(day => ({ day: parseInt(day), amount: salesByDay[day] }));
        if (history.length < 2) {
          // Mock some history if not enough real data
          history = [{day: 1, amount: 100}, {day: 2, amount: 150}, {day: 3, amount: 200}, ...history];
        }

        try {
          const aiRes = await axios.post('http://localhost:8000/predict-sales', { history });
          setPredictions(aiRes.data.predictions);
        } catch(e) { console.log('AI service not running or failed'); }
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!data) return <div className="container">Loading dashboard...</div>;
 
  const totalSales = data.sales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalCommission = data.payments.reduce((acc, pay) => acc + pay.amount, 0);
  const netRevenue = totalSales - totalCommission;

  // Chart Data preparation
  const salesChartData = data.sales.map((s, i) => ({ name: `Sale ${i+1}`, amount: s.amount }));
  const topInfluencers = data.influencers.map(inf => {
    const infSales = data.sales.filter(s => s.InfluencerId === inf.id).reduce((a, b) => a + b.amount, 0);
    return { name: inf.User.name, sales: infSales };
  }).sort((a,b) => b.sales - a.sales).slice(0, 5);
  
  const revenueSplit = [
    { name: 'Net Revenue', value: netRevenue },
    { name: 'Influencer Commission', value: totalCommission }
  ];

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>Brand Admin</h2>
        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-light)' }}><LogOut size={20}/></button>
      </nav>

      <div className="container">
        <h1 className="title" style={{ marginBottom: '0.5rem' }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time influencer performance & AI insights.</p>

        <div className="dashboard-grid">
          <div className="card glass">
            <h3><DollarSign size={16}/> Total Sales</h3>
            <p className="value">${totalSales.toFixed(2)}</p>
          </div>
          <div className="card glass">
            <h3><Users size={16}/> Active Influencers</h3>
            <p className="value">{data.influencers.length}</p>
          </div>
          <div className="card glass">
            <h3><Activity size={16}/> Total Clicks</h3>
            <p className="value">{data.clicks.length}</p>
          </div>
          <div className="card glass" style={{ borderColor: 'var(--primary)' }}>
            <h3><ShieldAlert size={16} color="var(--primary)"/> AI Prediction (Next 7 Days)</h3>
            <p className="value" style={{ color: 'var(--primary)' }}>
              {predictions ? `$${predictions.reduce((a, p) => a + p.predicted_amount, 0).toFixed(2)}` : 'Gathering Data...'}
            </p>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
          <div className="card glass">
            <h3 style={{ marginBottom: '1rem' }}>Sales Over Time</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChartData.length ? salesChartData : [{name:'No data', amount:0}]}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card glass">
            <h3 style={{ marginBottom: '1rem' }}>Revenue Split</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {revenueSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card glass" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Top Influencers</h3>
          <div style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInfluencers.length ? topInfluencers : [{name:'No data', sales:0}]}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="sales" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card glass" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Pending Payments</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Influencer ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.filter(p => p.status === 'pending').map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.InfluencerId}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td><span className="badge badge-pending">{payment.status}</span></td>
                  </tr>
                ))}
                {data.payments.filter(p => p.status === 'pending').length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending payments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
