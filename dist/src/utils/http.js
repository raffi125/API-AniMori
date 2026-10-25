import axios from 'axios';
// @ts-ignore
import { HttpsProxyAgent } from 'https-proxy-agent';
const { PROXY_URL } = process.env;
const http = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    },
    ...(PROXY_URL ? { httpsAgent: new HttpsProxyAgent(PROXY_URL), proxy: false } : {})
});
export default http;
