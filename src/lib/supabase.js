// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dbnccxgoqywoypywpyqt.supabase.co"; // Replace with your actual URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRibmNjeGdvcXl3b3lweXdweXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mzk1MTQsImV4cCI6MjA2OTUxNTUxNH0.F54Mj-Lg8-Tj1xXfs4WZdEPChnCoMeu7mHQYg-TePFk"; // Replace with your anon/public key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
