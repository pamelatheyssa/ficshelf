/**
 * Vercel Serverless Function — proxy para o AO3.
 * Roda no servidor, sem restrições de CORS.
 * URL: /api/ao3proxy?workId=12345
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { workId } = req.query;
  if (!workId || !/^\d+$/.test(workId)) {
    return res.status(400).json({ error: 'workId inválido' });
  }

  try {
    const url = `https://archiveofourown.org/works/${workId}?view_adult=true`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'accepted_tos=20180523; _otwarchive_session=; view_adult=true',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `AO3 retornou ${response.status}` });
    }

    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
