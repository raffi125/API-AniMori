import http from './http.js';
import scrapeSingleAnime from '../lib/scrapeSingleAnime.js';
const { BASEURL } = process.env;
const anime = async (slug) => {
    const { data } = await http.get(`${BASEURL}/anime/${slug}`);
    const result = scrapeSingleAnime(data);
    return result;
};
export default anime;
