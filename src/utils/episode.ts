import http from './http.js';
import episodes from './episodes.js';
import scrapeEpisode from '../lib/scrapeEpisode.js';
import { filterStreamsByTier, resolveStreams } from '../lib/resolveStreams.js';

const { BASEURL } = process.env;
const episode = async ({ episodeSlug, animeSlug, episodeNumber, premium = false }: {
  episodeSlug?: string | undefined, animeSlug?: string | undefined, episodeNumber?: number | undefined, premium?: boolean
}) => {
  let slug = '';

  if (episodeSlug) slug = episodeSlug;
  if (animeSlug && episodeNumber) {
    const episodeLists = await episodes(animeSlug);
    if (!episodeLists) return undefined;

    const splittedEpisodeSlug = episodeLists[0].slug?.split('-episode-') as string[];
    const prefixEpisodeSlug = splittedEpisodeSlug[0];
    const firstEpisodeNumber = splittedEpisodeSlug[1].replace('-sub-indo', '');

    slug = `${prefixEpisodeSlug}-episode-${episodeNumber - (parseInt(firstEpisodeNumber) == 0 ? 1 : 0)}-sub-indo`;
  }

  const { data } = await http.get(`${BASEURL}/episode/${slug}`);
  const result = scrapeEpisode(data);
  if (!result) return undefined;

  const resolved = await resolveStreams(result.stream_url, result.download_urls?.mp4);
  const { streams, premiumRequired } = filterStreamsByTier(resolved, premium);

  return {
    ...result,
    streams,
    premium_required: premiumRequired,
  };
};

export default episode;
