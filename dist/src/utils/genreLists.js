import http from './http.js';
import 'dotenv/config';
import scrapeGenreLists from '../lib/scrapeGenreLists.js';
const { BASEURL } = process.env;
const genreLists = async () => {
    const response = await http.get(`${BASEURL}/genre-list`);
    const result = scrapeGenreLists(response.data);
    return result;
};
export default genreLists;
