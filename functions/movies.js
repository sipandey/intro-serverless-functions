const { URL } = require('url');
const fetch = require('node-fetch');
// const movies = require('../data/movies.json');
const { query } = require('./util/hasura');

exports.handler = async () => {
  const { movies } = await query({
    query: `
        query {
            movies {
                id
                title
                tagline
                poster
            }
        }
        `,
  });

  const api = new URL('https://www.omdbapi.com/');

  // adding secret key to the API
  api.searchParams.set('apikey', process.env.OMDB_API_KEY);

  // https://www.learnwithjason.dev/blog/keep-async-await-from-blocking-execution/
  const promises = movies.map(movie => {
    api.searchParams.set('i', movie.id);

    return fetch(api)
      .then(response => response.json())
      .then(data => {
        const scores = data.Ratings;

        return { ...movie, scores };
      });
  });

  const moviesWithRatings = await Promise.all(promises);

  return {
    statusCode: 200,
    body: JSON.stringify(moviesWithRatings),
  };
};
