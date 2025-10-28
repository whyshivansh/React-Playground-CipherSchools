import { useState } from 'react';
import axios from 'axios';

// Define your backend API URL
const API_URL = 'http://localhost:5000/api/users';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  // Note: axios.defaults.withCredentials = true;
  // This is already set in App.jsx, so we don't need it here.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    const payload = isLogin
      ? { email, password }
      : { email, password, firstName, lastName };

    try {
      const response = await axios.post(url, payload);
      if (response.data) {
        // Call the function from App.jsx to set the user
        onLoginSuccess(response.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred';
      setError(message);
      console.error('Auth error:', message);
    }
  };

  return (
    // Main page container: Full screen, centered
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {/* Form container: White bg, padding, shadow, rounded corners */}
      <div className="p-8 sm:p-10 bg-white rounded-xl shadow-xl w-full max-w-md">
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {/* Form: Uses flex-col and gap for spacing */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Register-only fields */}
          {!isLogin && (
            <>
              {/* First/Last name container: responsive row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* First Name */}
                <div className="flex-1">
                  <label className="block mb-2 font-semibold text-gray-600 text-sm">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Last Name */}
                <div className="flex-1">
                  <label className="block mb-2 font-semibold text-gray-600 text-sm">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block mb-2 font-semibold text-gray-600 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 font-semibold text-gray-600 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2.5 mt-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Button */}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="bg-transparent border-none text-blue-600 hover:underline cursor-pointer mt-6 text-sm w-full text-center"
        >
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );
}

