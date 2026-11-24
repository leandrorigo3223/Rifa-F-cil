import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqtfvgpnwpabxlwzafwm.supabase.co';
const supabaseKey = 'sb_publishable_LhA69MvVcAFmsmIuyVbdpA_8Y8BNkHz';

export const supabase = createClient(supabaseUrl, supabaseKey);
