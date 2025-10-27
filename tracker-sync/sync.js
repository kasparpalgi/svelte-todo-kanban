#!/usr/bin/env node
const { Pool } = require('pg');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const LAST_SYNC_FILE = path.join(__dirname, '.last-sync');

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
    try {
        const url = new URL(process.env.DATABASE_URL);
        CONFIG.local = {
            host: url.hostname,
            port: url.port || 5432,
            database: url.pathname.slice(1),
            user: url.username,
            password: url.password
        };
        console.log('✓ Using DATABASE_URL from environment');
    } catch (error) {
        console.error('⚠️  Invalid DATABASE_URL:', error.message);
    }
}

if (!CONFIG.hasura.url) {
    console.error('❌ Missing API_ENDPOINT');
    process.exit(1);
}
if (!CONFIG.hasura.adminSecret) {
    console.error('❌ Missing HASURA_ADMIN_SECRET');
    process.exit(1);
}
if (!CONFIG.userId) {
    console.error('❌ Missing USER_ID');
    process.exit(1);
}

const pool = new Pool(CONFIG.local);

function getLastSyncTime() {
    try {
        if (fs.existsSync(LAST_SYNC_FILE)) {
            const timestamp = fs.readFileSync(LAST_SYNC_FILE, 'utf8').trim();
            return timestamp ? new Date(timestamp) : null;
        }
    } catch (error) {
        console.warn('⚠️  Could not read last sync time:', error.message);
    }
    return null;
}

function saveLastSyncTime(timestamp) {
    try {
        fs.writeFileSync(LAST_SYNC_FILE, timestamp.toISOString());
    } catch (error) {
        console.warn('⚠️  Could not save last sync time:', error.message);
    }
}

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
    if (result.errors) {
        throw new Error(JSON.stringify(result.errors, null, 2));
    }
    return result.data;
}

function sanitizeText(text) {
    if (!text) return '';
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/[^\x20-\x7E\u00A0-\uD7FF\uE000-\uFFFD]/g, '')
        .trim();
}

async function syncApps() {
    console.log('📱 Syncing apps...');

    const { rows } = await pool.query(`
        SELECT DISTINCT 
            app_name as name,
            COALESCE(category, 'Other') as category
        FROM sessions
        WHERE app_name IS NOT NULL
        ORDER BY app_name
    `);

    console.log(`   Found ${rows.length} unique apps`);

    const apps = rows.map(row => ({
        name: sanitizeText(row.name) || 'Unknown',
        category: sanitizeText(row.category.replace(/[📱💬🌐📦🎵📧📝⚙️]/g, '')) || 'Other',
        user_id: CONFIG.userId
    })).filter(app => app.name && app.name !== 'Unknown');

    // Deduplicate
    const uniqueApps = [];
    const seen = new Set();
    for (const app of apps) {
        if (!seen.has(app.name)) {
            seen.add(app.name);
            uniqueApps.push(app);
        }
    }

    console.log(`   Deduplicated to ${uniqueApps.length} unique apps`);

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

    const result = await hasuraQuery(mutation, { apps: uniqueApps });
    console.log(`✓ Synced ${result.insert_tracker_apps.affected_rows} apps`);

    const appMap = {};
    result.insert_tracker_apps.returning.forEach(app => {
        appMap[app.name] = app.id;
    });

    return appMap;
}

async function syncSessions(appMap, lastSyncTime) {
    console.log('⏱️  Syncing sessions...');

    let whereClause = 'WHERE app_name IS NOT NULL';
    const params = [];

    if (lastSyncTime) {
        whereClause += ' AND start_time > $1';
        params.push(lastSyncTime.toISOString());
        console.log(`   Only syncing sessions after ${lastSyncTime.toLocaleString()}`);
    } else {
        console.log(`   First sync - getting last 10000 sessions`);
    }

    const query = `
        SELECT 
            id,
            app_name,
            window_name,
            start_time,
            duration as duration_seconds,
            category,
            browser_url,
            browser_page_title,
            editor_filename,
            editor_language,
            ide_project_name,
            terminal_directory,
            is_afk
        FROM sessions
        ${whereClause}
        ORDER BY start_time DESC
        ${lastSyncTime ? '' : 'LIMIT 10000'}
    `;

    const { rows } = await pool.query(query, params);
    console.log(`   Found ${rows.length} sessions to sync`);

    if (rows.length === 0) {
        console.log('   No new sessions to sync');
        return;
    }

    // Map to Hasura schema
    const sessions = rows.map(row => {
        const app_id = appMap[sanitizeText(row.app_name)];
        if (!app_id) return null;

        const startTime = new Date(row.start_time);
        const endTime = new Date(startTime.getTime() + (row.duration_seconds * 1000));

        return {
            app_id: app_id,
            window_title: sanitizeText(row.window_name) || '',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_seconds: parseInt(row.duration_seconds),
            user_id: CONFIG.userId
        };
    }).filter(s => s !== null);

    console.log(`   Mapped ${sessions.length} sessions (${rows.length - sessions.length} skipped)`);

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
    const batchSize = 500;

    for (let i = 0; i < sessions.length; i += batchSize) {
        const batch = sessions.slice(i, i + batchSize);
        try {
            const result = await hasuraQuery(mutation, { sessions: batch });
            total += result.insert_tracker_sessions.affected_rows;
            console.log(`  → Batch ${Math.floor(i / batchSize) + 1}: ${result.insert_tracker_sessions.affected_rows} sessions`);
        } catch (error) {
            console.error(`  ✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        }
    }

    console.log(`✓ Synced ${total} sessions total`);
}

async function sync() {
    const startTime = Date.now();
    const syncStartTime = new Date();

    try {
        console.log('\n🚀 Starting sync...\n');

        const lastSyncTime = getLastSyncTime();
        if (lastSyncTime) {
            console.log(`📅 Last sync: ${lastSyncTime.toLocaleString()}`);
            console.log(`   (${Math.round((syncStartTime - lastSyncTime) / 1000 / 60)} minutes ago)\n`);
        } else {
            console.log('📅 First sync - will sync last 10000 sessions\n');
        }

        console.log('Configuration:');
        console.log(`  Local DB: ${CONFIG.local.user}@${CONFIG.local.host}:${CONFIG.local.port}/${CONFIG.local.database}`);
        console.log(`  Hasura: ${CONFIG.hasura.url}`);
        console.log(`  User ID: ${CONFIG.userId}\n`);

        await pool.query('SELECT 1');
        console.log('✓ Local database connected');

        await hasuraQuery('{ __typename }');
        console.log('✓ Hasura connected\n');

        const appMap = await syncApps();
        await syncSessions(appMap, lastSyncTime);

        saveLastSyncTime(syncStartTime);
        console.log(`\n💾 Saved sync timestamp: ${syncStartTime.toISOString()}`);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Sync completed in ${duration}s`);

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Check: Is Docker running?');
        } else if (error.message.includes('password authentication')) {
            console.error('\n💡 Check: DATABASE_URL credentials');
        } else if (error.message.includes('fetch')) {
            console.error('\n💡 Check: API_ENDPOINT and HASURA_ADMIN_SECRET');
        }

        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

sync();