import http from '../utils/http.js';

export type Stream = {
  quality: string;
  label: string;
  url: string;
  type: 'hls' | 'mp4' | 'embed';
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const QUALITY_ORDER: Record<string, number> = {
  '4k': 2160,
  '2160p': 2160,
  '1440p': 1440,
  '1080p': 1080,
  '720p': 720,
  '576p': 576,
  '480p': 480,
  '360p': 360,
  '240p': 240,
};

const detectQuality = (raw: string): string | undefined => {
  const m = raw.toLowerCase().match(/(2160|1440|1080|720|576|480|360|240)p?/);
  if (!m) return undefined;
  const n = parseInt(m[1]);
  if (n >= 2160) return '2160p';
  return `${n}p`;
};

const qualityRank = (q: string): number => QUALITY_ORDER[q] ?? 0;

const isDirectVideo = (url: string): 'hls' | 'mp4' | undefined => {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.m3u8')) return 'hls';
  if (clean.endsWith('.mp4')) return 'mp4';
  return undefined;
};

const extractFromHtml = (html: string): { url: string; type: 'hls' | 'mp4' }[] => {
  const found = new Map<string, 'hls' | 'mp4'>();

  const patterns = [
    /["'](https?:\/\/[^"']+?\.m3u8[^"']*)["']/gi,
    /["'](https?:\/\/[^"']+?\.mp4[^"']*)["']/gi,
    /file\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
    /source\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
    /src\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
    /"(https?:\\\/\\\/[^"]+?\.(?:m3u8|mp4)[^"]*)"/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      let url = m[1].replace(/\\\//g, '/');
      const type = isDirectVideo(url);
      if (type) found.set(url, type);
    }
  }

  return Array.from(found.entries()).map(([url, type]) => ({ url, type }));
};

const safeFetch = async (url: string): Promise<string | undefined> => {
  try {
    const { data, headers } = await http.get(url, {
      timeout: 15000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
      headers: { 'User-Agent': UA, Referer: url, Accept: '*/*' },
    });
    if (typeof data !== 'string') return undefined;
    const ct = String(headers['content-type'] ?? '');
    if (ct.includes('mpegurl')) return data;
    return data;
  } catch {
    return undefined;
  }
};

export const resolveStreams = async (
  embedUrl: string | undefined,
  downloadMp4: { resolution?: string; urls?: { provider?: string; url?: string }[] }[] = []
): Promise<Stream[]> => {
  const streams: Stream[] = [];
  const seen = new Set<string>();

  const push = (s: Stream) => {
    if (seen.has(s.url)) return;
    seen.add(s.url);
    streams.push(s);
  };

  if (embedUrl) {
    push({
      quality: 'auto',
      label: 'Auto (embed)',
      url: embedUrl,
      type: 'embed',
    });

    const html = await safeFetch(embedUrl);
    if (html) {
      for (const { url, type } of extractFromHtml(html)) {
        const q = detectQuality(url) ?? detectQuality(html.slice(Math.max(0, html.indexOf(url) - 120), html.indexOf(url) + 40));
        push({
          quality: q ?? 'auto',
          label: q ? `${q}` : 'Direct',
          url,
          type,
        });
      }
    }
  }

  // Fallback: expose download resolutions as quality hints (some providers serve direct files).
  for (const row of downloadMp4) {
    const q = detectQuality(String(row.resolution ?? '')) ?? 'auto';
    const direct = (row.urls ?? []).find((u) => u.url && isDirectVideo(u.url));
    if (direct?.url) {
      push({
        quality: q,
        label: q === 'auto' ? 'Download source' : q,
        url: direct.url,
        type: isDirectVideo(direct.url) as 'hls' | 'mp4',
      });
    }
  }

  return streams.sort((a, b) => {
    if (a.type === 'embed') return 1;
    if (b.type === 'embed') return -1;
    return qualityRank(b.quality) - qualityRank(a.quality);
  });
};

export const filterStreamsByTier = (streams: Stream[], premium: boolean): { streams: Stream[]; premiumRequired: boolean } => {
  if (premium) return { streams, premiumRequired: false };
  const allowed = streams.filter((s) => s.type === 'embed' || qualityRank(s.quality) <= 480);
  return { streams: allowed, premiumRequired: streams.some((s) => s.type !== 'embed' && qualityRank(s.quality) > 480) };
};
