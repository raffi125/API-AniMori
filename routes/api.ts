import { Router } from 'express';
import handler from '../handler/handler.js';
import {
  activateHandler,
  checkHandler,
  generateHandler,
  listHandler,
  revokeHandler
} from '../handler/licenseHandler.js';

const api = Router();

api.get('/', (_, res) =>  res.status(200).json({ status: 'OK', message: 'AniMori API' }));
api.get('/home', handler.homeHandler);
api.get('/search/:keyword', handler.searchAnimeHandler);
api.get('/ongoing-anime/:page?', handler.ongoingAnimeHandler);
api.get('/complete-anime/:page?', handler.completeAnimeHandler);
api.get('/anime/:slug', handler.singleAnimeHandler);
api.get('/anime/:slug/episodes', handler.episodesHandler);
api.get('/anime/:slug/episodes/:episode', handler.episodeByEpisodeNumberHandler);
api.get('/episode/:slug', handler.episodeByEpisodeSlugHandler);
api.get('/batch/:slug', handler.batchByBatchSlugHandler);
api.get('/anime/:slug/batch', handler.batchHandler);
api.get('/genres', handler.genreListsHandler);
api.get('/genres/:slug/:page?', handler.animeByGenreHandler);

api.post('/license/activate', activateHandler);
api.get('/license/check', checkHandler);
api.post('/license/check', checkHandler);

api.post('/admin/licenses', generateHandler);
api.get('/admin/licenses', listHandler);
api.delete('/admin/licenses/:id', revokeHandler);

export default api;
