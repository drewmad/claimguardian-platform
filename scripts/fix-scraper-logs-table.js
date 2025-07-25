const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createScraperLogsTable() {
  try {
    console.log('Creating scraper_logs table...');
    
    const { error } = await supabase.rpc('query', {
      query: `
        -- Create scraper_logs table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.scraper_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source TEXT NOT NULL,
            level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
            message TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            timestamp TIMESTAMPTZ DEFAULT now()
        );

        -- Create indexes for efficient querying
        CREATE INDEX IF NOT EXISTS idx_scraper_logs_source ON public.scraper_logs(source);
        CREATE INDEX IF NOT EXISTS idx_scraper_logs_level ON public.scraper_logs(level);
        CREATE INDEX IF NOT EXISTS idx_scraper_logs_timestamp ON public.scraper_logs(timestamp DESC);

        -- Enable RLS
        ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Service role can manage scraper logs" ON public.scraper_logs;
        DROP POLICY IF EXISTS "Authenticated users can read scraper logs" ON public.scraper_logs;

        -- Create policies
        CREATE POLICY "Service role can manage scraper logs"
        ON public.scraper_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

        CREATE POLICY "Authenticated users can read scraper logs"
        ON public.scraper_logs FOR SELECT TO authenticated USING (true);

        -- Grant permissions
        GRANT SELECT, INSERT ON public.scraper_logs TO anon;
        GRANT ALL ON public.scraper_logs TO service_role;
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      
      // Try a simpler approach with individual statements
      console.log('Trying individual SQL statements...');
      
      // Just try to create the table first
      const { data, error: createError } = await supabase
        .from('scraper_logs')
        .select('id')
        .limit(1);
      
      if (createError && createError.code === '42P01') {
        console.log('Table does not exist, creating it now...');
        
        // Since we can't execute raw SQL directly, let's use the migration approach
        console.log('\nThe scraper_logs table needs to be created.');
        console.log('Please run the following command to apply the migration:');
        console.log('\nsupabase db push --include-all\n');
        console.log('When prompted, type "Y" to apply the migrations.');
        console.log('\nNote: Some migrations may fail due to missing extensions, but the scraper_logs table should be created.');
      } else if (!createError) {
        console.log('Table already exists!');
      } else {
        console.error('Unexpected error:', createError);
      }
    } else {
      console.log('Table created successfully!');
    }
    
    // Test the table
    console.log('\nTesting table by inserting a log entry...');
    const { data: testData, error: testError } = await supabase
      .from('scraper_logs')
      .insert({
        source: 'test',
        level: 'INFO',
        message: 'Test log entry to verify table creation',
        metadata: { test: true }
      })
      .select();
    
    if (testError) {
      console.error('Test insert failed:', testError);
    } else {
      console.log('Test insert successful:', testData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createScraperLogsTable();