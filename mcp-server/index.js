const express = require('express');
const app = express();
app.use(express.json());

let tasks = [];
let nextId = 1;

const tools = [
  {
    name: 'addTask',
    description: 'Add a new task',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'listTasks',
    description: 'List all tasks',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'completeTask',
    description: 'Mark a task as completed',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' }
      },
      required: ['id']
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

app.post('/tools/call', (req, res) => {
  const { name, arguments: args } = req.body.params;
  try {
    if (name === 'addTask') {
      const task = { id: nextId++, title: args.title, completed: false };
      tasks.push(task);
      res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        result: task
      });
    } else if (name === 'listTasks') {
      res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        result: tasks
      });
    } else if (name === 'completeTask') {
      const task = tasks.find(t => t.id === args.id);
      if (task) {
        task.completed = true;
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          result: task
        });
      } else {
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          error: { code: -32000, message: 'Task not found' }
        });
      }
    } else {
      res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        error: { code: -32601, message: 'Method not found' }
      });
    }
  } catch (error) {
    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32000, message: error.message }
    });
  }
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Task Manager MCP Server running on port ${PORT}`);
});