import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Link as LinkIcon, Copy, TrendingUp, CheckCircle } from 'lucide-react';

export default function InfluencerDashboard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/influencer/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchMe();
  }, [navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://localhost:5000/t/${data.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!data) return <div className="container">Loading your profile...</div>;

  const totalEarnings = data.Payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingEarnings = data.Payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const conversionRate = data.Clicks.length > 0 ? ((data.Sales.length / data.Clicks.length) * 100).toFixed(1) : 0;

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>Welcome, {user.name}</h2>
        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--text-light)' }}><LogOut size={20}/></button>
      </nav>

      <div className="container">
        
        <div className="card glass animate-fade-in" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3>Your Unique Referral Link</h3>
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.2rem' }}>http://localhost:5000/t/{data.referralCode}</p>
          </div>
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? <><CheckCircle size={18} style={{ marginRight: '8px' }}/> Copied!</> : <><Copy size={18} style={{ marginRight: '8px' }}/> Copy Link</>}
          </button>
        </div>

        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Performance Overview</h2>
        
        <div className="dashboard-grid">
          <div className="card glass">
            <h3><TrendingUp size={16}/> Total Clicks</h3>
            <p className="value">{data.Clicks.length}</p>
          </div>
          <div className="card glass">
            <h3><CheckCircle size={16}/> Conversions</h3>
            <p className="value">{data.Sales.length}</p>
          </div>
          <div className="card glass">
            <h3><TrendingUp size={16}/> Conversion Rate</h3>
            <p className="value">{conversionRate}%</p>
          </div>
          <div className="card glass" style={{ borderColor: 'var(--accent)' }}>
            <h3><TrendingUp size={16} color="var(--accent)"/> Pending Earnings</h3>
            <p className="value" style={{ color: 'var(--accent)' }}>${pendingEarnings.toFixed(2)}</p>
          </div>
        </div>

        <div className="card glass" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Sales</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Commission Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.Sales.slice().reverse().map(sale => (
                  <tr key={sale.id}>
                    <td>{sale.orderId}</td>
                    <td>${sale.amount.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>${sale.commissionAmount.toFixed(2)}</td>
                    <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data.Sales.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sales yet. Share your link!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
