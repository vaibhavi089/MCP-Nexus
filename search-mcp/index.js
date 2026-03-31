const express = require('express');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(express.json());

const SERPER_API_KEY = process.env.SERPER_API_KEY;

const tools = [
  {
    name: 'search_web',
    description: 'Search the web for current information on any topic. Returns titles, links, snippets, and dates. Use this for general knowledge, explanations, how-tos, and factual queries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_news',
    description: 'Search for the latest news articles on a topic. Use this for current events, recent developments, and breaking news.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'News topic to search for' }
      },
      required: ['query']
    }
  }
];

app.post('/tools/list', (req, res) => {
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: { tools }
  });
});

app.post('/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body.params;

  try {
    let result;

    // WEB SEARCH
    if (name === 'search_web') {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: args.query, num: 6 })
      });

      const data = await response.json();

      result = {
        answerBox: data.answerBox || null,
        knowledgeGraph: data.knowledgeGraph?.description || null,
        results: data.organic?.slice(0, 6).map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          date: item.date || null
        })) || []
      };
    }

    // NEWS SEARCH
    else if (name === 'search_news') {
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: args.query, num: 6 })
      });

      const data = await response.json();

      result = {
        results: data.news?.slice(0, 6).map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet || '',
          source: item.source,
          date: item.date || null
        })) || []
      };
    }

    else {
      return res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        error: { code: -32601, message: 'Tool not found' }
      });
    }

    res.json({ jsonrpc: "2.0", id: req.body.id, result });

  } catch (error) {
    console.error(`Tool ${name} error:`, error.message);
    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32000, message: error.message }
    });
  }
});

const PORT = 1900;
app.listen(PORT, () => {
  console.log(`Search MCP Server running on port ${PORT}`);
});