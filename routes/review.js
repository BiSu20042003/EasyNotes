const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params from parent router (listing router)
const commentControl = require('../controllers/listing'); // The review controller logic is now in listingControl
const wrapAsync = require('../utils/wrapAsync.js');
const { authenticateToken } = require('../middleware/auth.js');
router.post(
    '/',
    authenticateToken, 
    wrapAsync(commentControl.createComment)
);

router.delete(
    '/:commentId',
    authenticateToken,    
    wrapAsync(commentControl.deleteComment)
);
module.exports = router;