const express = require('express');
const app = express();
app.use(express.json());

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" }
];

const jokes = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
  { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese!" },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she'll let it go!" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" }
];

const tools = [
  {
    name: 'random_quote',
    description: 'Get a random inspirational quote',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'random_joke',
    description: 'Get a random joke',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'multiple_quotes',
    description: 'Get multiple random quotes at once',
    inputSchema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'How many quotes to return max 5', default: 3 }
      }
    }
  },
  {
    name: 'multiple_jokes',
    description: 'Get multiple random jokes at once',
    inputSchema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'How many jokes to return max 5', default: 3 }
      }
    }
  },
  {
    name: 'quote_by_author',
    description: 'Get a quote by a specific author',
    inputSchema: {
      type: 'object',
      properties: {
        author: { type: 'string', description: 'Author name e.g. Einstein, Jobs, Churchill' }
      },
      required: ['author']
    }
  }
];

app.post('/tools/list', (req, res) => {
  res.json({ jsonrpc: "2.0", id: req.body.id, result: { tools } });
});

app.post('/tools/call', (req, res) => {
  const { name, arguments: args } = req.body.params;

  try {
    let result;

    if (name === 'random_quote') {
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      result = { quote: quote.text, author: quote.author };

    } else if (name === 'random_joke') {
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      result = { setup: joke.setup, punchline: joke.punchline };

    } else if (name === 'multiple_quotes') {
      const count = Math.min(args?.count || 3, 5);
      const shuffled = [...quotes].sort(() => Math.random() - 0.5);
      result = shuffled.slice(0, count).map(q => ({ quote: q.text, author: q.author }));

    } else if (name === 'multiple_jokes') {
      const count = Math.min(args?.count || 3, 5);
      const shuffled = [...jokes].sort(() => Math.random() - 0.5);
      result = shuffled.slice(0, count).map(j => ({ setup: j.setup, punchline: j.punchline }));

    } else if (name === 'quote_by_author') {
      const found = quotes.filter(q =>
        q.author.toLowerCase().includes(args.author.toLowerCase())
      );
      if (found.length === 0) {
        result = {
          message: `No quotes found for "${args.author}"`,
          available_authors: quotes.map(q => q.author)
        };
      } else {
        const quote = found[Math.floor(Math.random() * found.length)];
        result = { quote: quote.text, author: quote.author };
      }

    } else {
      return res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        error: { code: -32601, message: 'Tool not found' }
      });
    }

    res.json({ jsonrpc: "2.0", id: req.body.id, result });

  } catch (error) {
    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32000, message: error.message }
    });
  }
});

const PORT = 3005;
app.listen(PORT, () => console.log(`Fun MCP Server running on port ${PORT}`));