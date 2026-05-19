import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { User } from '@supabase/supabase-js';
import { authMiddleware } from './middleware/auth';
import { me } from './routes/me';
import { donorsRouter } from './routes/donors';
import { financialsRouter } from './routes/financials';
import { aiRouter } from './routes/ai';

type Variables = {
    user: User;
};

const app = new Hono<{ Variables: Variables }>();
const allowedOrigins = (process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'])
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin) => !origin || allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        credentials: true,
    })
);

app.use('/uploads/*', serveStatic({ root: process.cwd() }));

app.onError((err, c) => {
    console.error(err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
});

app.get('/', (c) => c.text('Hono!'));

app.get('/health', (c) => {
    return c.json({
        ok: true,
        message: 'hello hono!',
    });
});

app.get('/protected', authMiddleware, (c) => {
    return c.json(c.get('user'));
});

app.route('/me', me);
app.route('/donors', donorsRouter);
app.route('/financials', financialsRouter);
app.route('/ai', aiRouter);

const port = Number(process.env.PORT) || 3000;

serve({
    fetch: app.fetch,
    port,
});

console.log(`API running on http://localhost:${port}`);
