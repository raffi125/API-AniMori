import http from './http.js';
import scrapeAnimeByGenre from '../lib/scrapeAnimeByGenre.js';
const { BASEURL } = process.env;
const animeByGenre = async (genre, page = 1) => {
    const response = await http.get(`${BASEURL}/genres/${genre}/page/${page}`);
    const result = scrapeAnimeByGenre(response.data);
    return result;
};
export default animeByGenre;
