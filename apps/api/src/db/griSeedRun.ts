import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { seedGri } from './griSeed';

const ORG_NAME = 'MSS Test Organization';

const client = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

(async () => {
    try {
        const [org] = await db
            .select({ id: schema.organizations.id, name: schema.organizations.name })
            .from(schema.organizations)
            .where(eq(schema.organizations.name, ORG_NAME))
            .limit(1);
        if (!org) throw new Error(`Org not found: ${ORG_NAME}`);
        const result = await seedGri(db, org.id);
        console.log(`Seeded GRI for ${org.name} (${org.id}) → report ${result.reportId}, ${result.count} responses`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
