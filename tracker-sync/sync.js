#!/usr/bin/env node

// Simple sync script: Local PostgreSQL → Hasura
// Maps: app_names → tracker_apps, sessions → tracker_sessions

const { Pool } = require('pg');
require('dotenv').config();
const fetch = require('node-fetch');

console.log('process.env.API_ENDPOINT', process.env.API_ENDPOINT);

const CONFIG = {
    local: {
        host: 'localhost',
        port: 5432,
        database: 'hustle-tracker',
        user: 'timetracker',
        password: 'changeme'
    },
    hasura: {
        url: process.env.API_ENDPOINT,
        adminSecret: process.env.HASURA_ADMIN_SECRET
    },
    userId: process.env.USER_ID
};

if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    CONFIG.local = {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        password: url.password
    };
}
if (process.env.HASURA_URL) CONFIG.hasura.url = process.env.HASURA_URL;
if (process.env.HASURA_SECRET) CONFIG.hasura.adminSecret = process.env.HASURA_SECRET;
if (process.env.USER_ID) CONFIG.userId = process.env.USER_ID;

const pool = new Pool(CONFIG.local);

async function hasuraQuery(query, variables = {}) {
    const response = await fetch(CONFIG.hasura.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': CONFIG.hasura.adminSecret
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.errors) throw new Error(JSON.stringify(result.errors));
    return result.data;
}

// Sync app names (local app_names → hasura tracker_apps)
async function syncApps() {
    console.log('📱 Syncing apps...');

    const { rows } = await pool.query('SELECT id, name, category FROM app_names');

    const apps = rows.map(row => ({
        ...row,
        user_id: CONFIG.userId
    }));

    const mutation = `
    mutation ($apps: [tracker_apps_insert_input!]!) {
      insert_tracker_apps(
        objects: $apps,
        on_conflict: {
          constraint: tracker_apps_name_key,
          update_columns: [category, user_id]
        }
      ) {
        affected_rows
        returning { id name }
      }
    }
  `;

    const result = await hasuraQuery(mutation, { apps });
    console.log(`✓ Synced ${result.insert_tracker_apps.affected_rows} apps`);

    // Build ID map: local_id → hasura_id
    const idMap = {};
    result.insert_tracker_apps.returning.forEach(app => {
        const localApp = rows.find(r => r.name === app.name);
        if (localApp) idMap[localApp.id] = app.id;
    });

    return idMap;
}

async function syncSessions(idMap) {
    console.log('⏱️  Syncing sessions...');

    const { rows } = await pool.query(`
    SELECT id, app_name_id, window_title, start_time, end_time, duration_seconds
    FROM sessions
    ORDER BY start_time DESC
    LIMIT 10000
  `);

    const sessions = rows.map(row => ({
        app_id: idMap[row.app_name_id],
        window_title: row.window_title,
        start_time: row.start_time,
        end_time: row.end_time,
        duration_seconds: row.duration_seconds,
        user_id: CONFIG.userId
    })).filter(s => s.app_id);

    const mutation = `
    mutation ($sessions: [tracker_sessions_insert_input!]!) {
      insert_tracker_sessions(
        objects: $sessions,
        on_conflict: {
          constraint: tracker_sessions_pkey,
          update_columns: []
        }
      ) {
        affected_rows
      }
    }
  `;

    let total = 0;
    for (let i = 0; i < sessions.length; i += 500) {
        const batch = sessions.slice(i, i + 500);
        const result = await hasuraQuery(mutation, { sessions: batch });
        total += result.insert_tracker_sessions.affected_rows;
        console.log(`  → Batch ${Math.floor(i / 500) + 1}: ${result.insert_tracker_sessions.affected_rows} sessions`);
    }

    console.log(`✓ Synced ${total} sessions total`);
}

async function sync() {
    const startTime = Date.now();

    try {
        console.log('\n🚀 Starting sync...\n');

        await pool.query('SELECT 1');
        console.log('✓ Local database connected');

        await hasuraQuery('{ __typename }');
        console.log('✓ Hasura connected\n');

        const idMap = await syncApps();
        await syncSessions(idMap);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Sync completed in ${duration}s`);

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

sync();