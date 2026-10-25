import http from './http.js';
import scrapeAnimeEpisodes from '../lib/scrapeAnimeEpisodes.js';
const { BASEURL } = process.env;
const episodes = async (slug) => {
    const { data } = await http.get(`${BASEURL}/anime/${slug}`);
    const result = scrapeAnimeEpisodes(data);
    return result;
};
export default episodes;
