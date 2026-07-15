export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { workId } = req.query;
  if (!workId || !/^\d+$/.test(workId)) {
    return res.status(400).json({ error: 'workId inválido' });
  }

  // Estratégia 1: API oficial do AO3 (sem Cloudflare)
  try {
    const apiRes = await fetch(
      `https://archiveofourown.org/works/${workId}.json?view_adult=true`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FicShelf/1.0 (personal fanfic tracker)',
        },
        redirect: 'follow',
      }
    );

    if (apiRes.ok) {
      const data = await apiRes.json();
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json({ source: 'api', data });
    }
  } catch (_) {}

  // Estratégia 2: HTML scraping com headers de navegador
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cookie': 'view_adult=true; accepted_tos=20180523',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  try {
    const htmlRes = await fetch(
      `https://archiveofourown.org/works/${workId}?view_adult=true`,
      { headers: browserHeaders, redirect: 'follow' }
    );

    if (htmlRes.ok) {
      const html = await htmlRes.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json({ source: 'html', html });
    }

    return res.status(htmlRes.status).json({
      error: `AO3 retornou erro ${htmlRes.status}. Tente novamente em alguns instantes.`
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Não foi possível conectar ao AO3. O site pode estar temporariamente inacessível.'
    });
  }
}
