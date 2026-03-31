const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;
const MANAGEMENT_URL = 'https://api.supabase.com/v1';

const mgmtHeaders = {
  'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
  'Content-Type': 'application/json'
};

const tools = [
  // ─── PROJECT TOOLS ───
  {
    name: 'list_projects',
    description: 'List all Supabase projects in your account',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'create_project',
    description: 'Create a new Supabase project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        organization_id: { type: 'string', description: 'Organization ID (get from list_organizations)' },
        region: { type: 'string', description: 'Region e.g. us-east-1, ap-south-1', default: 'us-east-1' },
        db_pass: { type: 'string', description: 'Database password (min 8 chars)' }
      },
      required: ['name', 'organization_id', 'db_pass']
    }
  },
  {
    name: 'list_organizations',
    description: 'List all organizations in your Supabase account',
    inputSchema: { type: 'object', properties: {} }
  },

  // ─── TABLE TOOLS ───
  {
    name: 'create_table',
    description: 'Create a new table in the database using SQL',
    inputSchema: {
      type: 'object',
      properties: {
        project_ref: { type: 'string', description: 'Project ref ID' },
        table_name: { type: 'string', description: 'Table name' },
        columns: {
          type: 'array',
          description: 'Array of column definitions',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', description: 'e.g. text, integer, boolean, uuid, timestamp' },
              nullable: { type: 'boolean', default: true },
              primary_key: { type: 'boolean', default: false },
              default_value: { type: 'string' }
            }
          }
        }
      },
      required: ['project_ref', 'table_name', 'columns']
    }
  },
  {
    name: 'run_sql',
    description: 'Run any SQL query on a Supabase project',
    inputSchema: {
      type: 'object',
      properties: {
        project_ref: { type: 'string', description: 'Project ref ID' },
        query: { type: 'string', description: 'SQL query to run' }
      },
      required: ['project_ref', 'query']
    }
  },
  {
    name: 'list_tables',
    description: 'List all tables in a Supabase project',
    inputSchema: {
      type: 'object',
      properties: {
        project_ref: { type: 'string', description: 'Project ref ID' }
      },
      required: ['project_ref']
    }
  },
  {
    name: 'delete_table',
    description: 'Delete a table from the database',
    inputSchema: {
      type: 'object',
      properties: {
        project_ref: { type: 'string', description: 'Project ref ID' },
        table_name: { type: 'string', description: 'Table name to delete' }
      },
      required: ['project_ref', 'table_name']
    }
  },

  // ─── DATA TOOLS ───
  {
    name: 'query_table',
    description: 'Query rows from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        select: { type: 'string', description: 'Columns to select, default *' },
        filter: { type: 'object', description: 'Filter as key-value pairs' },
        limit: { type: 'number', description: 'Max rows to return' }
      },
      required: ['table']
    }
  },
  {
    name: 'insert_row',
    description: 'Insert a new row into a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Row data as key-value pairs' }
      },
      required: ['table', 'data']
    }
  },
  {
    name: 'update_row',
    description: 'Update rows in a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Fields to update' },
        filter: { type: 'object', description: 'Which rows to update' }
      },
      required: ['table', 'data', 'filter']
    }
  },
  {
    name: 'delete_row',
    description: 'Delete rows from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        filter: { type: 'object', description: 'Which rows to delete' }
      },
      required: ['table', 'filter']
    }
  },
  {
    name: 'count_rows',
    description: 'Count rows in a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        filter: { type: 'object', description: 'Optional filter' }
      },
      required: ['table']
    }
  }
];

// ─── Helper: run SQL via Management API ───
async function runSQL(project_ref, query) {
  const response = await fetch(`${MANAGEMENT_URL}/projects/${project_ref}/database/query`, {
    method: 'POST',
    headers: mgmtHeaders,
    body: JSON.stringify({ query })
  });
  return response.json();
}

app.post('/tools/list', (req, res) => {
  res.json({ jsonrpc: "2.0", id: req.body.id, result: { tools } });
});

app.post('/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body.params;

  try {
    let result;

    // ─── PROJECT ───
    if (name === 'list_organizations') {
      const r = await fetch(`${MANAGEMENT_URL}/organizations`, { headers: mgmtHeaders });
      result = await r.json();

    }  else if (name === 'list_projects') {
      const r = await fetch(`${MANAGEMENT_URL}/projects`, { headers: mgmtHeaders });
      const projects = await r.json();
      console.log('Supabase projects raw response:', JSON.stringify(projects));
      if (!Array.isArray(projects)) {
        throw new Error(`API error: ${JSON.stringify(projects)}`);
      }
      result = projects.map(p => ({
        id: p.id,
        name: p.name,
        region: p.region,
        status: p.status,
        ref: p.ref
      }));
    } else if (name === 'create_project') {
      const r = await fetch(`${MANAGEMENT_URL}/projects`, {
        method: 'POST',
        headers: mgmtHeaders,
        body: JSON.stringify({
          name: args.name,
          organization_id: args.organization_id,
          region: args.region || 'us-east-1',
          db_pass: args.db_pass
        })
      });
      result = await r.json();

    // ─── TABLES ───
    } else if (name === 'create_table') {
      // Build CREATE TABLE SQL from columns array
      const columnDefs = args.columns.map(col => {
        let def = `"${col.name}" ${col.type.toUpperCase()}`;
        if (col.primary_key) def += ' PRIMARY KEY';
        if (col.default_value) def += ` DEFAULT ${col.default_value}`;
        if (!col.nullable && !col.primary_key) def += ' NOT NULL';
        return def;
      }).join(',\n  ');

      const sql = `CREATE TABLE IF NOT EXISTS "${args.table_name}" (\n  ${columnDefs}\n);`;
      result = await runSQL(args.project_ref, sql);

    } else if (name === 'run_sql') {
      result = await runSQL(args.project_ref, args.query);

    } else if (name === 'list_tables') {
      const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
      const r = await runSQL(args.project_ref, sql);
      result = r;

    } else if (name === 'delete_table') {
      const sql = `DROP TABLE IF EXISTS "${args.table_name}";`;
      result = await runSQL(args.project_ref, sql);

    // ─── DATA ───
    } else if (name === 'query_table') {
      let query = supabase.from(args.table).select(args.select || '*');
      if (args.filter) Object.entries(args.filter).forEach(([k, v]) => { query = query.eq(k, v); });
      if (args.limit) query = query.limit(args.limit);
      const { data, error } = await query;
      if (error) throw error;
      result = data;

    } else if (name === 'insert_row') {
      const { data, error } = await supabase.from(args.table).insert(args.data).select();
      if (error) throw error;
      result = { success: true, inserted: data };

    } else if (name === 'update_row') {
      let query = supabase.from(args.table).update(args.data);
      Object.entries(args.filter).forEach(([k, v]) => { query = query.eq(k, v); });
      const { data, error } = await query.select();
      if (error) throw error;
      result = { success: true, updated: data };

    } else if (name === 'delete_row') {
      let query = supabase.from(args.table).delete();
      Object.entries(args.filter).forEach(([k, v]) => { query = query.eq(k, v); });
      const { error } = await query;
      if (error) throw error;
      result = { success: true, message: 'Row(s) deleted' };

    } else if (name === 'count_rows') {
      let query = supabase.from(args.table).select('*', { count: 'exact', head: true });
      if (args.filter) Object.entries(args.filter).forEach(([k, v]) => { query = query.eq(k, v); });
      const { count, error } = await query;
      if (error) throw error;
      result = { table: args.table, count };

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

const PORT = 3003;
app.listen(PORT, () => console.log(`Supabase MCP Server running on port ${PORT}`));