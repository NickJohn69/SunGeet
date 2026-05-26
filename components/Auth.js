import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

export default function Auth() {
  const { setSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'error' or 'success'
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ 
          text: 'Check your email for the confirmation link! You can sign in once verified.', 
          type: 'success' 
        });
        if (data?.session) setSession(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
      }
    } catch (error) {
      setMessage({ 
        text: error.error_description || error.message, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="subtitle">{isRegistering ? 'Join SunGeet today' : 'Sign in to continue'}</p>
        
        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="toggle-button"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          padding: 20px;
        }
        .auth-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 8px;
          color: #fff;
        }
        .subtitle {
          color: #888;
          margin-bottom: 24px;
        }
        .auth-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 24px;
          text-align: left;
          line-height: 1.4;
        }
        .auth-message.error {
          background: rgba(250, 45, 72, 0.1);
          border: 1px solid rgba(250, 45, 72, 0.2);
          color: #fa2d48;
        }
        .auth-message.success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        label {
          font-size: 0.9rem;
          color: #ccc;
        }
        input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #3b82f6;
        }
        .auth-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 14px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          margin-top: 10px;
        }
        .auth-button:hover:not(:disabled) {
          transform: translateY(-2px);
          opacity: 0.9;
        }
        .auth-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .auth-footer {
          margin-top: 24px;
        }
        .toggle-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
