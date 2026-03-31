const express = require('express');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = 'https://api.github.com';

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json'
};

const tools = [
  {
    name: 'create_repo',
    description: 'Create a new GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name' },
        description: { type: 'string', description: 'Repository description' },
        private: { type: 'boolean', description: 'Make repo private', default: false }
      },
      required: ['name']
    }
  },
  {
    name: 'list_repos',
    description: 'List all repositories for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'delete_repo',
    description: 'Delete a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner username' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'create_issue',
    description: 'Create an issue in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body' }
      },
      required: ['owner', 'repo', 'title']
    }
  },
  {
    name: 'list_issues',
    description: 'List issues in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub username' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Folder path, leave empty for root', default: '' }
      },
      required: ['owner', 'repo']
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

    if (name === 'create_repo') {
      const response = await fetch(`${BASE_URL}/user/repos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: args.name,
          description: args.description || '',
          private: args.private || false
        })
      });
      result = await response.json();

    } else if (name === 'list_repos') {
      const response = await fetch(`${BASE_URL}/user/repos?per_page=100`, { headers });
      const repos = await response.json();
      result = repos.map(r => ({
        name: r.name,
        description: r.description,
        private: r.private,
        url: r.html_url,
        stars: r.stargazers_count
      }));

    } else if (name === 'delete_repo') {
      const response = await fetch(`${BASE_URL}/repos/${args.owner}/${args.repo}`, {
        method: 'DELETE',
        headers
      });
      result = response.status === 204
        ? { success: true, message: `Repo ${args.repo} deleted` }
        : { success: false, message: 'Failed to delete repo' };

    } else if (name === 'create_issue') {
      const response = await fetch(`${BASE_URL}/repos/${args.owner}/${args.repo}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: args.title, body: args.body || '' })
      });
      result = await response.json();

    } else if (name === 'list_issues') {
      const response = await fetch(`${BASE_URL}/repos/${args.owner}/${args.repo}/issues`, { headers });
      const issues = await response.json();
      result = issues.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        url: i.html_url
      }));

    } else if (name === 'list_files') {
      const path = args.path || '';
      const response = await fetch(`${BASE_URL}/repos/${args.owner}/${args.repo}/contents/${path}`, { headers });
      const files = await response.json();
      if (!Array.isArray(files)) throw new Error(JSON.stringify(files));
      result = files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        path: f.path
      }));

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

const PORT = 1800;
app.listen(PORT, () => {
  console.log(`GitHub MCP Server running on port ${PORT}`);
});