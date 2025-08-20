// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dcpiemhpdcpqysnqqdmg.supabase.co"; // Replace with your actual URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcGllbWhwZGNwcXlzbnFxZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODI5OTYsImV4cCI6MjA3MTE1ODk5Nn0.dXPB1fR8o1G_s5mCzQFSqIZqc0ltUPj-n5NVGN2H8cQ"; // Replace with your anon/public key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
