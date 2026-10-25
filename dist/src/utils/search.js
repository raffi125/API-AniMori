import http from './http.js';
import scrapesearchresult from '../lib/scrapeSearchResult.js';
const { BASEURL } = process.env;
const search = async (keyword) => {
    const response = await http.get(`${BASEURL}/?s=${keyword}&post_type=anime`);
    const html = response.data;
    const searchResult = scrapesearchresult(html);
    return searchResult;
};
export default search;
