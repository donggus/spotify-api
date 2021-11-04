const { Pool } = require('pg');
const SpotifyWebApi = require('spotify-web-api-node');

// PostgreSQL Config - Should be inside a .env file but for practical purposes for the challenge they are hardcoded.
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: 'admin',
  database: 'fitback_challenge',
  port: '5432'
});

// Spotify API Keys - Should be inside a .env file but for practical purposes for the challenge they are hardcoded.
const clientId = '20f1ef38ace849b08c9548f7bd476da7',
  clientSecret = '4946363c38c6431ca6126a3bd0343dbb';

// Create the api object with the credentials
const spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret
});

// Retrieve an access token.
const getSpotifyToken = async (req, res) => {

    try {
        const { body } = await spotifyApi.clientCredentialsGrant()
        console.log(`The access token expires in ${body['expires_in']} or on server reboot.`)
        console.log(`The access token is ${body['access_token']}`);
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(body['access_token']);
        res.status(200).json({ token: body['access_token'] });
    } catch (error) {
        console.log('Something went wrong when retrieving an access token', error)
        res.status(400).json({ error: error.error.message});
    }

}

const getArtistTopTracks = async (req, res) => {

  const { artistId } = req.body 

  try {
      // Get Artist Name by ID
      const { body: artist } = await spotifyApi.getArtist(artistId)

      // Get Artist's tracks data by ID
      const { body } = await spotifyApi.getArtistTopTracks(artistId, 'ES')
      // Management of the API response to get only necessary data.
      let songsData = []
      body.tracks.map( items => {
        songsData.push({
          songName: items.name,
          songId: items.id
        })
      })
      
      // [Extra] Array of data to save it into the DB. 
      const arrayOfSongs = body.tracks.map( items => items.name )
      await pool.query('INSERT INTO artists (name, songs) VALUES ($1, $2)', [artist.name.toLocaleUpperCase(), arrayOfSongs]);

      // Response
      res.status(200).json({
        message: 'Saved on DB Succesfully',
        artist: artist.name,
        songs: songsData,
      });
  } catch (error) {
      console.log('Something went wrong!', error);
      res.status(400).json({ error: error.message});
  }

}
  
const getSongsByArtist = async(req, res) => {

    const { artist } = req.body

    // Catch queries from URL
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)

    // Pagination Settings / Initial config to display the pagination of the results
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const results = {}
    
    try {
      // SQL query to find the Artist name even if it's not written exactly
      const { rows } = await pool.query('SELECT * FROM artists WHERE name LIKE $1', [`%${artist.toLocaleUpperCase()}%`]);
      results.artist = rows[0].name
      results.songs = rows[0].songs.slice(startIndex, endIndex)
      if (!startIndex && !endIndex) {
        results.songs = rows[0].songs
      }

      if ( endIndex < rows[0].songs.length ) {
        results.next = {
          page: page + 1, 
          last_page: Math.ceil(rows[0].songs.length / limit)
        }
      }
  
      if ( startIndex > 0) {
        results.previous = {
          page: page - 1, 
        }
      }
      res.status(200).json(results)
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: `Couldn't find an artist called ${artist.toLocaleUpperCase()}` })
    }

}

const getSongsById = async(req, res) => {
    // Catch params from URL
    const songId = req.params.songId

    try {

      const { body } = await spotifyApi.getTrack(songId)
      res.status(200).json({
        artists: body.artists,
        disc_number: body.disc_number,
        duration_ms: body.duration_ms,
        explicit: body.explicit,
        external_urls: body.external_urls,
        href: body.href,
        id: body.id,
        is_local: body.is_local,
        is_playable: body.is_playable,
        name: body.name,
        preview_url: body.preview_url,
        track_number: body.track_number,
        type: body.type,
        uri: body.uri
      })

    } catch (error) {

      console.log(error)
      res.status(400).json({ error: `Couldn't find any song with the id ${songId}` })

    }
}

module.exports = {
    getSpotifyToken,
    getArtistTopTracks,
    getSongsByArtist,
    getSongsById
}