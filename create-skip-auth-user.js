const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const path = require('path');

config({ path: path.join(__dirname, 'serverless-api/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSkipAuthUser() {
  console.log('Creating SKIP_AUTH user profile...');
  
  const skipAuthUser = {
    id: 'skip-auth-user-12345',
    email: 'admin@rexera.com',
    full_name: 'Admin User',
    role: 'HIL_ADMIN',
    user_type: 'hil_user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert([skipAuthUser])
    .select();
    
  if (error) {
    console.error('❌ Error creating user profile:', error);
  } else {
    console.log('✅ Created SKIP_AUTH user profile:', data[0]);
  }
}

createSkipAuthUser();
EOF < /dev/null
