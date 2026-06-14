import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('InfluenceOpsSecretPass123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('influencer');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.user.role === 'admin') navigate('/admin');
        else navigate('/influencer');
      } else {
        await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role });
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Network Error: Backend server is offline! Please make sure the black CMD window for Node.js is running.');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.2rem', background: 'linear-gradient(135deg, #a78bfa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            InfluenceOps AI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Affiliate Sales & Payment Tracker</p>
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-light)', fontWeight: 600 }}>
          {isLogin ? 'Welcome Back' : 'Join Platform'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input">
                  <option value="influencer">Influencer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}
          
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isLogin ? <><LogIn size={18} style={{ marginRight: '8px' }}/> Login</> : <><UserPlus size={18} style={{ marginRight: '8px' }}/> Sign Up</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}
