const User = require('../models/user');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const generateToken = (user) => {
    return jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const sendVerificationEmail = async (user) => {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); //6character code
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 3600000; //1 hour
    await user.save();

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email to enjoy </EasyNotes>',
        html: `<h3>Hello ${user.username},</h3>
               <p>Thank you for registering. Please use the following code to verify your account:</p>
               <h2><strong>${code}</strong></h2>
               <p>This code is valid for 1 hour.</p>`,
    });
};

const sendResetCodeEmail = async (user) => {
  const code = String(crypto.randomInt(100000, 1000000)); //6-digit num
  user.resetPasswordCode = code;
  user.resetPasswordExpires = Date.now() + 15*60*1000; //15 minutes
  await user.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Your </EasyNotes> password reset code',
    html: `<h3>Hello ${user.username},</h3>
           <p>Use this code to reset your password:</p>
           <h2><strong>${code}</strong></h2>
           <p>This code expires in 15 minutes.</p>`,
  });
};


module.exports.signup = async (req, res) => {
    try { 
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email or username already exists.' });
        }
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        await sendVerificationEmail(registeredUser);

        res.status(201).json({ message: 'Registration successful! Please check your email for a verification code.' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Error occurred during registration." });
    }
};

module.exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        const token = generateToken(user);
        res.status(200).json({ message: 'Email verified successfully! You are now logged in.', token, user: { _id: user._id, username: user.username } });
    } catch (error) {
        console.error("Email Verification Error:", error);
        res.status(500).json({ message: "An error occurred during email verification." });
    }
};

module.exports.login = async (req, res) => {
    try { 
        const { username, password } = req.body;
        const { user, error } = await User.authenticate()(username, password);

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // if (!user.isVerified) {
        //     await sendVerificationEmail(user);
        //     return res.status(403).json({ message: 'Your account is not verified. A new verification code has been sent to your email.' });
        // }

        const token = generateToken(user);
        res.status(200).json({ message: 'Logged in successfully!', token, user: { _id: user._id, username: user.username } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
};

module.exports.getCurrentUser = async (req, res) => {
    try { 
        const user = await User.findById(req.user._id).select('username email');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Get Current User Error:", error);
        res.status(500).json({ message: "An error occurred fetching user data." });
    }
};


module.exports.forgotPass = async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      return res.status(400).json({ message: 'Email and username are required.' });
    }
    const user = await User.findOne({ email, username });
    if (!user) {
      return res.status(200).json({ message: 'Username or email not found' });
    }

    await sendResetCodeEmail(user);
    res.status(200).json({ message: 'A reset code has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        if(!email) return res.status(400).json({ message: 'Email is required.' });
        else if(!code) return res.status(400).json({ message: 'Invalid or expired code' });
        else return res.status(400).json({ message: 'Enter New Password' });
    }

    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    await new Promise((resolve, reject) => {
      user.setPassword(newPassword, (err) => (err ? reject(err) : resolve()));
    });
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      message: 'Password reset successful! You are now logged in.',
      token,
      user: { _id: user._id, username: user.username },
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};
