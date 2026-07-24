import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const handleSheetProxy = async (req: any, res: any) => {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const targetUrl = urlObj.searchParams.get('url');
    if (!targetUrl) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing url parameter' }));
      return;
    }

    const sheetIdMatch = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;

    const urlsToTry: string[] = [];
    if (sheetId) {
      urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);
      urlsToTry.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
    }
    if (!urlsToTry.includes(targetUrl)) {
      urlsToTry.push(targetUrl);
    }

    let csvText = '';
    let success = false;

    for (const u of urlsToTry) {
      try {
        const response = await fetch(u, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/csv;q=0.8,*/*;q=0.7'
          }
        });
        if (response.ok) {
          const text = await response.text();
          if (text && text.length > 15 && !text.trim().toLowerCase().startsWith('<!doctype html')) {
            csvText = text;
            success = true;
            break;
          }
        }
      } catch (e) {
        console.error('Sheet proxy fetch error for:', u, e);
      }
    }

    if (success) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 200;
      res.end(csvText);
    } else {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Could not retrieve Google Sheet CSV' }));
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Proxy server error' }));
  }
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sheet-proxy-plugin',
        configureServer(server) {
          server.middlewares.use('/api/proxy-sheet', handleSheetProxy);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/proxy-sheet', handleSheetProxy);
        }
      }
    ],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
