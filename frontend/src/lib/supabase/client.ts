import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@rexera/database';

export const supabase = createClientComponentClient<Database>();