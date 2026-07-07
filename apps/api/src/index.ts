import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { User } from '@supabase/supabase-js';
import { authMiddleware } from './middleware/auth';
import { me } from './routes/me';
import { donorsRouter } from './routes/donors';
import { beneficiariesRouter } from './routes/beneficiaries';
import { financialsRouter } from './routes/financials';
import { aiRouter } from './routes/ai';
import { projectsRouter } from './routes/projects';
import { bousalaRouter } from './routes/bousala';
import { stakeholdersRouter } from './routes/stakeholders';
import { implementingPartnersRouter } from './routes/implementingPartners';
import { institutionalDonorsRouter } from './routes/institutionalDonors';
import { staffRouter } from './routes/staff';
import { platformRouter } from './routes/platform';
import { modulesRouter } from './routes/modules';
import { grcRouter } from './routes/grc';

type Variables = {
    user: User;
};

const app = new Hono<{ Variables: Variables }>();
const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
];
const allowedOrigins = (process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(',') : defaultOrigins)
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin) => {
            if (!origin) return allowedOrigins[0];
            return allowedOrigins.includes(origin) ? origin : undefined;
        },
        allowHeaders: ['Content-Type', 'Authorization', 'x-org-id'],
        credentials: true,
    })
);

app.use('/uploads/*', serveStatic({ root: process.cwd() }));

app.onError((err, c) => {
    // Always log the full error server-side for diagnostics.
    console.error(err);
    // Only surface messages that were intentionally thrown for the client
    // (via HTTPException). Everything else gets a generic 500 so we never
    // leak internal exception details (stack traces, DB errors, etc.).
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    return c.json({ error: 'Internal server error' }, 500);
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
app.route('/beneficiaries', beneficiariesRouter);
app.route('/financials', financialsRouter);
app.route('/ai', aiRouter);
app.route('/projects', projectsRouter);
app.route('/bousala', bousalaRouter);
app.route('/stakeholders', stakeholdersRouter);
app.route('/implementing-partners', implementingPartnersRouter);
app.route('/institutional-donors', institutionalDonorsRouter);
app.route('/staff', staffRouter);
app.route('/platform', platformRouter);
app.route('/modules', modulesRouter);
app.route('/grc', grcRouter);

const port = Number(process.env.PORT) || 3000;

serve({
    fetch: app.fetch,
    port,
});

console.log(`API running on http://localhost:${port}`);
