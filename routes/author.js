const express = require('express');
const router = express.Router();
const AuthorControl = require('../controllers/listing');
const wrapAsync = require('../utils/wrapAsync.js');
const { authenticateToken, isOwner } = require('../middleware/auth.js'); 
router.get('/', wrapAsync(AuthorControl.home));


router.get('/search', wrapAsync(AuthorControl.searchAuthor));
// router.get('/suggestions', wrapAsync(AuthorControl.searchSuggestions));
router.post(
    '/:id/follow',
    authenticateToken,
    AuthorControl.follow
)

router.get('/:id', wrapAsync(AuthorControl.showMaterials));

router.get('/material/:id', wrapAsync(AuthorControl.materialDetails));

router.post(
    '/:id/like',
    authenticateToken, 
    wrapAsync(AuthorControl.Liked)
);
router.post(  //"/author/new"
    '/new',
    authenticateToken, 
    AuthorControl.createNew
);

router.post( //"/author/new/:id"
    "/new/:id",
    authenticateToken,
    AuthorControl.createNewMaterial
)

router.get(
    '/edit/:id',
    authenticateToken, 
    isOwner,
    wrapAsync(AuthorControl.getMaterial)
);

router.post(
    '/edit/:id',
    authenticateToken, 
    isOwner,         
    wrapAsync(AuthorControl.updateMaterial)
);

router.delete(
    '/deleteAuthor/:id',
    authenticateToken, 
    isOwner,          
    AuthorControl.deleteAuthor
);

router.delete(
    '/:id',
    authenticateToken, 
    isOwner,          
    wrapAsync(AuthorControl.deleteMaterial)
);

module.exports = router;