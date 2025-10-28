import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // For parsing cookies
import connectDB from './config/db.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// --- Middleware ---


app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://react-playground-cipher-schools-ykn.vercel.app"
  ],
  credentials: true, // Allow cookies, auth headers, etc.
}));

// Enable CORS (Cross-Origin Resource Sharing)
// This is crucial for your frontend (on a different domain) to talk to your backend

// Body parser for JSON
app.use(express.json());

// Cookie parser to read cookies (for our auth token)
app.use(cookieParser());

// --- API Routes ---



// --- 2. CORS Configuration ---
// This MUST come before your routes
// --------------------------

// Default test route
app.get('/', (req, res) => {
  res.send('CipherStudio Backend API Running');
});

// Use the routes we defined
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

