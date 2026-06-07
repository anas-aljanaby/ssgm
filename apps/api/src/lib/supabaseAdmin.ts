import { createClient } from '@supabase/supabase-js';

// Service-role client for privileged admin operations (creating staff accounts).
// Never expose the service-role key to the browser.
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
