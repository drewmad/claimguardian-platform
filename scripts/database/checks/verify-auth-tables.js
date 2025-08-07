const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTables() {
  console.log('🔍 Verifying auth tables in production...\n')

  // Check if profiles table exists
  const { data: profilesTable, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (profilesError) {
    if (profilesError.message.includes('does not exist')) {
      console.log('❌ profiles table: NOT FOUND')
      console.log('   Error:', profilesError.message)
    } else {
      console.log('⚠️  profiles table: Error accessing', profilesError.message)
    }
  } else {
    console.log('✅ profiles table: EXISTS')
  }

  // Check if user_profiles table exists
  const { data: userProfilesTable, error: userProfilesError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(1)

  if (userProfilesError) {
    if (userProfilesError.message.includes('does not exist')) {
      console.log('❌ user_profiles table: NOT FOUND')
    } else {
      console.log('⚠️  user_profiles table: Error accessing', userProfilesError.message)
    }
  } else {
    console.log('✅ user_profiles table: EXISTS')
  }

  // Check if functions exist
  console.log('\n🔍 Checking functions...')

  try {
    const { error: captureError } = await supabase.rpc('capture_signup_data', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_tracking_data: {}
    })

    if (captureError) {
      if (captureError.message.includes('function') || captureError.message.includes('does not exist')) {
        console.log('❌ capture_signup_data function: NOT FOUND')
      } else {
        console.log('✅ capture_signup_data function: EXISTS (test call failed as expected)')
      }
    } else {
      console.log('✅ capture_signup_data function: EXISTS')
    }
  } catch (e) {
    console.log('❌ capture_signup_data function: NOT FOUND')
  }

  try {
    const { error: loginError } = await supabase.rpc('log_login_activity', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_tracking_data: {}
    })

    if (loginError) {
      if (loginError.message.includes('function') || loginError.message.includes('does not exist')) {
        console.log('❌ log_login_activity function: NOT FOUND')
      } else {
        console.log('✅ log_login_activity function: EXISTS (test call failed as expected)')
      }
    } else {
      console.log('✅ log_login_activity function: EXISTS')
    }
  } catch (e) {
    console.log('❌ log_login_activity function: NOT FOUND')
  }

  console.log('\n💡 If tables are missing, please run the SQL script in Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new')
  console.log('   File: ./scripts/fix-production-auth-complete.sql')
  console.log('\n⚠️  Note: After running the SQL, it may take 1-2 minutes for changes to propagate')
}

verifyTables().catch(console.error)
