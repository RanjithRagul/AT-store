import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight, Loader2, Lock, AlertCircle, MessageSquare } from 'lucide-react';
import { UserRole } from '../types';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to show the "sent" OTP for demo purposes
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // Handle navigation after user state is updated in context
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.OWNER) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDemoOtp(null);
    
    const response = await mockBackend.login(phone);
    setLoading(false);
    
    if (response.success && response.otp) {
        setStep('OTP');
        setDemoOtp(response.otp);
        // We also alert just in case, but the UI notification is better
        // alert(`Your Login Code is: ${response.otp}`); 
    } else {
        setError('Failed to send verification code. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const verifiedUser = await mockBackend.verifyOtp(phone, otp.trim());
    setLoading(false);
    
    if (verifiedUser) {
      login(verifiedUser);
      // Navigation handled by useEffect
    } else {
      setError('Invalid Verification Code. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        
        {/* Demo OTP Notification Banner */}
        {demoOtp && step === 'OTP' && (
          <div className="absolute top-0 left-0 w-full bg-green-50 border-b border-green-100 p-3 animate-slide-down">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-0.5">New Message</p>
                <p className="text-sm text-green-700">
                  Lumina Verification Code: <span className="font-bold text-lg">{demoOtp}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`text-center mb-8 ${demoOtp ? 'mt-12' : ''}`}>
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'PHONE' ? <Smartphone className="w-8 h-8 text-indigo-600" /> : <Lock className="w-8 h-8 text-indigo-600" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 'PHONE' ? 'Welcome Back' : 'Verify Identity'}
          </h1>
          <p className="text-slate-500 mt-2">
            {step === 'PHONE' ? 'Enter your phone number to continue' : `Enter code sent to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="1234567890"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <>Send Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">One-Time Password</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
                maxLength={4}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center tracking-widest text-2xl"
                placeholder="XXXX"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Verify & Login'}
            </button>
            <button 
              type="button" 
              onClick={() => { setStep('PHONE'); setError(null); setDemoOtp(null); }}
              className="w-full text-slate-500 text-sm py-2 hover:text-slate-700"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;