const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary.js');
const { authenticateToken } = require('../middleware/auth.js');

// POST /api/cloudinary/signature

router.post('/signature', authenticateToken, (req, res) => {
  try {
    const folder = (req.body && req.body.folder) || 'Material_HUB';
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { timestamp, folder ,access_mode: "public"};
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.API_SECRET);

    return res.json({
      signature,
      timestamp,
      apiKey: process.env.API_KEY,
      cloudName: process.env.CLOUD_NAME,
      folder
    });
  } catch (err) {
    console.error('cloudinary signature error:', err);
    return res.status(500).json({ message: 'Failed to create Cloudinary signature.' });
  }
});

module.exports = router;
