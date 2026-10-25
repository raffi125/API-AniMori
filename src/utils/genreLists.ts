import http from './http.js';
import 'dotenv/config';
import scrapeGenreLists from '../lib/scrapeGenreLists.js';
import type { genre as genreType } from '../types/types.js';

const { BASEURL } = process.env;
const genreLists = async (): Promise<genreType[]> => {
  const response = await http.get(`${BASEURL}/genre-list`);
  const result = scrapeGenreLists(response.data);

  return result;
};

export default genreLists;
