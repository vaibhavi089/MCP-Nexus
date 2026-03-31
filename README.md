# MCP Chatbot System

A production-ready AI chatbot that integrates with the Model Context Protocol (MCP) to call tools from multiple servers, including GitHub, Supabase, and a custom Task Manager.

## Architecture

```
Frontend (React + Vite + Tailwind)
    ↓ HTTP
Backend (Node.js + Express)
    ↓ MCP Client
MCP Servers:
- GitHub MCP Server (fetches issues)
- Supabase MCP Server (queries database)
- Task Manager MCP Server (add/list/complete tasks)
```

## Features

- **Natural Language Input**: Chat interface similar to ChatGPT
- **MCP Integration**: Calls tools from remote MCP servers
- **Tool Calling**: Google Gemini with function calling
- **Structured Responses**: JSON responses formatted nicely
- **Multiple Servers**: Integrates GitHub, Supabase, and custom tools

## Setup Instructions

1. **Clone and Install Dependencies**:
   ```bash
   cd client && npm install
   cd ../server && npm install
   cd ../github-mcp && npm install
   cd ../supabase-mcp && npm install
   cd ../mcp-server && npm install
   ```

2. **Environment Variables**:
   - Copy `.env` and fill in your API keys:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `GITHUB_TOKEN`: GitHub personal access token
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Supabase anon key

3. **Start MCP Servers**:
   ```bash
   # Terminal 1: GitHub MCP Server
   cd github-mcp && npm start

   # Terminal 2: Supabase MCP Server
   cd supabase-mcp && npm start

   # Terminal 3: Task Manager MCP Server
   cd mcp-server && npm start
   ```

4. **Start Backend**:
   ```bash
   cd server && npm start
   ```

5. **Start Frontend**:
   ```bash
   cd client && npm run dev
   ```

6. **Open Browser**: Go to `http://localhost:5173`

## How MCP Works

The Model Context Protocol (MCP) allows AI models to call tools from external servers:

1. **Tool Discovery**: Backend fetches available tools from MCP servers
2. **Tool Calling**: Gemini decides which tools to call based on user input
3. **Execution**: Backend routes tool calls to appropriate MCP servers
4. **Response**: Tool results are returned to the model for final response

## API Endpoints

- `POST /chat`: Send user message, receive AI response
  ```json
  {
    "message": "Add a task: finish homework"
  }
  ```

## Example Queries

- "Add a task: finish assignment"
- "List my tasks"
- "Create a new repository called test-repo"
- "Show open issues in repo microsoft/vscode"
- "Fetch users from database where status = active"

## MCP Tool Definitions

### Task Manager
- `addTask(title)`: Add a new task
- `listTasks()`: List all tasks
- `completeTask(id)`: Mark task as completed

### GitHub
- `fetch_issues(owner, repo, state)`: Fetch issues from repository
- `create_repo(name, description, private)`: Create a new GitHub repository

### Supabase
- `query_table(table, select, filter)`: Query database table

## Demo Steps

1. Start all servers as described in setup
2. Open the chat interface
3. Try: "Add a task: build MCP chatbot"
4. Try: "List my tasks"
5. Try: "Create a new repository called my-awesome-project"
6. Try: "Show open issues in repo facebook/react"
7. Try: "Fetch all users from users table"

## Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: Google Gemini
- **MCP**: @modelcontextprotocol/sdk
- **APIs**: GitHub API, Supabase
- **Database**: Supabase (for remote queries)

## Security Notes

- Store API keys securely in environment variables
- Use HTTPS in production
- Validate inputs and handle errors properly

## Future Enhancements

- Streaming responses
- Tool usage logging
- User authentication
- More MCP servers integration