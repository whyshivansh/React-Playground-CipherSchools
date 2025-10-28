import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthPage from './AuthPage';
import Ide from './Ide';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start in a loading state

  // Check if user is already logged in (persistent session)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Call the /profile endpoint
        const { data } = await axios.get('http://localhost:5000/api/users/profile');
        setUser(data); // If successful, set the user
      } catch (error) {
        console.log("No valid session found.");
        setUser(null); // Ensure user is logged out if token is invalid
      }
      setLoading(false); // Done loading
    };

    checkLoggedIn();
  }, []); // Empty array means this runs once on app load

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // Updated logout to call the API
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/users/logout');
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      setUser(null); // Force logout on frontend anyway
    }
  };

  // Show a loading spinner (styled with Tailwind)
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl font-semibold text-gray-700">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Authenticating...
      </div>
    );
  }

  return (
    // Replaced 'app-container' with Tailwind classes
    <div className="w-screen h-screen">
      {user ? (
        // If user is logged in, show the IDE
        <Ide user={user} onLogout={handleLogout} />
      ) : (
        // If user is not logged in, show the AuthPage
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;

