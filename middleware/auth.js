const jwt = require('jsonwebtoken');
const Material = require('../models/Material');
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired.' });
        }
        req.user = user;
        next();
    });
};

const isOwner = async (req, res, next) => {
    const {id} = req.params;
    const material = await Material.findById(id);
    if (!material) {
        return res.status(404).json({ message: 'Material not found!' });
    }
    if (!material.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'You are not authorized to perform this action.' });
    }
    next();
};

module.exports = { authenticateToken, isOwner };