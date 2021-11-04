const { Router } = require('express');
const router = Router();
const { getSpotifyToken, getArtistTopTracks, getSongsByArtist, getSongsById } = require('../controllers/spotify.controller');

router.get('/access', getSpotifyToken);
router.post('/artistTracks', getArtistTopTracks);
router.post('/songs', getSongsByArtist);
router.get('/songs/:songId', getSongsById);

module.exports = router;