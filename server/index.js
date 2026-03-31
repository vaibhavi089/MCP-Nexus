const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const mcpServers = [
  { name: 'github',      url: 'http://localhost:1800' },
  { name: 'supabase',    url: 'http://localhost:3003' },
  { name: 'taskmanager', url: 'http://localhost:3004' },
  { name: 'fun', url: 'http://localhost:3005'}
];

async function getAllTools() {
  const allTools = [];
  for (const server of mcpServers) {
    try {
      const response = await fetch(`${server.url}/tools/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
      });
      const data = await response.json();
      if (data.result?.tools) {
        data.result.tools.forEach(tool => {
          allTools.push({ ...tool, name: `${server.name}_${tool.name}`, _server: server.name });
        });
      }
    } catch (err) {
      console.error(`Error fetching tools from ${server.name}:`, err.message);
    }
  }
  return allTools;
}

function convertToGroqTools(tools) {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));
}

async function callTool(toolFullName, args) {
  const parts = toolFullName.split('_');
  const serverName = parts[0];
  const toolName = parts.slice(1).join('_');

  const server = mcpServers.find(s => s.name === serverName);
  if (!server) throw new Error(`Server "${serverName}" not found`);

  const response = await fetch(`${server.url}/tools/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "tools/call",
      params: { name: toolName, arguments: args }
    })
  });
  const data = await response.json();
  if (data.result) return data.result;
  throw new Error(data.error?.message || 'Unknown error from MCP server');
}

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  console.log('User:', message);

  try {
    const tools = await getAllTools();
    const groqTools = tools.length > 0 ? convertToGroqTools(tools) : undefined;

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant with access to GitHub, Supabase, and Task Manager and Fun (quotes & jokes) tools. Use them when needed.'
      },
      { role: 'user', content: message }
    ];

    // Agentic loop
    while (true) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: groqTools,
        tool_choice: 'auto',
        max_tokens: 1024
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;
      messages.push(assistantMessage);

      // No tool calls — return final response
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        console.log('Final response:', assistantMessage.content);
        return res.json({ response: assistantMessage.content });
      }

      // Execute tool calls
      console.log(`Calling ${assistantMessage.tool_calls.length} tool(s)...`);

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`Tool: ${toolName}`, args);

        try {
          const result = await callTool(toolName, args);
          console.log(`Result:`, result);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        } catch (err) {
          console.error(`Tool ${toolName} failed:`, err.message);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: err.message })
          });
        }
      }
      // Loop again so Groq processes the tool results
    }

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ response: `Error: ${err.message}` });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));