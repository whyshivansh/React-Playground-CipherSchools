import User from '../model/User.js';
import generateToken from '../utils/generateToken.js';
// --- @desc    Register a new user
// --- @route   POST /api/users/register
// --- @access  Public
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create new user
    // Password hashing is handled automatically by the User model's .pre('save') hook
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    // 3. If user created successfully
    if (user) {
      // 4. Generate a token and set the cookie
      generateToken(res, user._id);

      // 5. Send back user data (without the password)
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        theme: user.settings.theme,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- @desc    Authenticate user & get token (Login)
// --- @route   POST /api/users/login
// --- @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    // 2. Check if user exists AND password matches
    // We use the .comparePassword() method we defined in the User model
    if (user && (await user.comparePassword(password))) {
      // 3. Generate token and set cookie
      generateToken(res, user._id);
      
      // 4. Send back user data
      res.status(200).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        theme: user.settings.theme,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- @desc    Logout user / clear cookie
// --- @route   POST /api/users/logout
// --- @access  Private (requires token)
const logoutUser = (req, res) => {
  // Clear the cookie by setting it to an empty value and expiring it
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export { registerUser, loginUser, logoutUser };
