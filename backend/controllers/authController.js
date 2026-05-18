const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if user exists
    const existingUser = db.get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user
    const newUser = db.insert({ name, email, password: hashedPassword });
    
    const token = jwt.sign({ id: newUser.id, email, name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'User registered successfully',
      token,
      user: { name, email, avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${email}&backgroundColor=f5efe6` }
    });
  } catch (err) {
    console.error('[Auth] Register Error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.get(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: { name: user.name, email: user.email, avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${user.email}&backgroundColor=f5efe6` }
    });
  } catch (err) {
    console.error('[Auth] Login Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
