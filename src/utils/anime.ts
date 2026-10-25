import http from './http.js';
import scrapeSingleAnime from '../lib/scrapeSingleAnime.js';
import type { anime as animeType } from '../types/types.js';

const { BASEURL } = process.env;
const anime = async (slug: string): Promise<animeType | undefined> => {
  const { data } = await http.get(`${BASEURL}/anime/${slug}`);
  const result = scrapeSingleAnime(data);

  return result;
};

export default anime;