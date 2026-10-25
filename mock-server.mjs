// Local mock API for emulator UI testing. Not part of production.
// Run: node mock-server.mjs  (port 3000)
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const img = (seed) => `https://picsum.photos/seed/${seed}/400/600`;

const titles = [
  'Kuzu no Honkai', 'Hibike! Euphonium', 'Bocchi the Rock!',
  'Frieren: Beyond Journey\'s End', 'Jujutsu Kaisen Season 2',
  'Sousou no Frieren', 'Oshi no Ko', 'Blue Lock'
];

const anime = () => titles.map((t, i) => ({
  title: t,
  slug: `anime-${i + 1}`,
  poster: img(`ani${i}`),
  current_episode: `Episode ${8 + i}`,
  episode_count: `${12 + i} Episode`,
  rating: (7 + (i % 3) * 0.5).toFixed(2),
  release_day: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][i % 7],
  newest_release_date: `${i + 1} Okt`,
  last_release_date: `${i + 1} Okt`,
  otakudesu_url: 'https://example.com'
}));

const home = { ongoing_anime: anime().slice(0, 5), complete_anime: anime().slice(3) };

const episodes = Array.from({ length: 12 }, (_, i) => ({
  episode: `Episode ${i + 1}`,
  slug: `anime-1-episode-${i + 1}-sub-indo`,
  otakudesu_url: 'https://example.com'
}));

const detail = {
  title: 'Kuzu no Honkai',
  japanese_title: 'クズの本懐',
  poster: img('ani0'),
  rating: '7.50',
  produser: 'Aniplex',
  type: 'TV',
  status: 'Completed',
  episode_count: '12',
  duration: '23 Menit',
  release_date: '2017',
  studio: 'Lerche',
  genres: [
    { name: 'Drama', slug: 'drama' },
    { name: 'Romance', slug: 'romance' },
    { name: 'Psychological', slug: 'psychological' },
    { name: 'Seinen', slug: 'seinen' }
  ],
  synopsis:
    'Hanabi dan Mugi adalah dua siswa SMA yang tampak seperti pasangan sempurna. ' +
    'Namun di balik itu, mereka berdua menyimpan perasaan yang rumit dan saling ' +
    'memanfaatkan untuk mengobati rasa sakit hati masing-masing.',
  episode_lists: episodes,
  batch: null,
  recommendations: []
};

const streams = [
  { quality: '1080p', label: '1080p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
  { quality: '720p', label: '720p', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'hls' },
  { quality: '480p', label: '480p', url: 'https://www.w3schools.com/html/mov_bbb.mp4', type: 'mp4' }
];

const licenses = new Map();

app.get('/v1/home', (_, res) => res.json({ status: 'Ok', data: home }));

app.get('/v1/search/:keyword', (req, res) => {
  const list = anime()
    .filter((a) => a.title.toLowerCase().includes(req.params.keyword.toLowerCase()))
    .map((a) => ({ title: a.title, slug: a.slug, poster: a.poster, status: 'Completed', rating: a.rating, genres: [], url: '' }));
  res.json({ status: 'Ok', data: list });
});

app.get('/v1/anime/:slug', (_, res) => res.json({ status: 'Ok', data: detail }));
app.get('/v1/anime/:slug/episodes', (_, res) => res.json({ status: 'Ok', data: episodes }));

function episodePayload(premium) {
  const visible = premium ? streams : streams.filter((s) => s.quality === '480p');
  return {
    episode: 'Kuzu no Honkai Episode 1',
    anime: { slug: 'anime-1', otakudesu_url: '' },
    has_next_episode: true,
    next_episode: { slug: 'anime-1-episode-2-sub-indo', otakudesu_url: '' },
    has_previous_episode: false,
    previous_episode: null,
    stream_url: 'https://example.com/embed',
    streams: visible,
    premium_required: !premium
  };
}

app.get('/v1/episode/:slug', (req, res) => {
  const key = String(req.query.license ?? '');
  const dev = String(req.query.device ?? '');
  const rec = licenses.get(key);
  const premium = !!(rec && dev && rec.device === dev);
  res.json({ status: 'Ok', data: episodePayload(premium) });
});

app.post('/v1/license/activate', (req, res) => {
  const { license, device } = req.body ?? {};
  if (!license || !device) return res.status(400).json({ status: 'Error', message: 'license and device required' });
  const existing = licenses.get(license);
  if (existing && existing.device !== device) {
    return res.status(400).json({ status: 'Error', message: 'License already bound to another device' });
  }
  licenses.set(license, { device });
  res.json({ status: 'Ok', message: 'Activated', data: { premium: true } });
});

app.get('/v1/license/check', (req, res) => {
  const rec = licenses.get(String(req.query.license ?? ''));
  const premium = !!(rec && rec.device === String(req.query.device ?? ''));
  res.json({ status: 'Ok', data: { premium } });
});

app.listen(3000, () => console.log('Mock API on http://localhost:3000'));
