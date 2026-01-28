export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'URL is required' });
  }

  try {
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'EstateGuard-AI-Agent/1.0 (Mozilla/5.0)'
      }
    });

    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).json({ error: `Failed to fetch URL: ${fetchResponse.statusText}` });
    }

    const text = await fetchResponse.text();
    return response.status(200).send(text);
  } catch (error) {
    return response.status(500).json({ error: `Server error: ${error.message}` });
  }
}
