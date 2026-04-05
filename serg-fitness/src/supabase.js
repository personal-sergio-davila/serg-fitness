import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qcripgcsugvdamldufvd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcmlwZ2NzdWd2ZGFtbGR1ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTUxMTEsImV4cCI6MjA5MDkzMTExMX0.dMIp06HNqmHRfTG0oZxqwH5fhL_jVQ53PREdMPb3Okg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
