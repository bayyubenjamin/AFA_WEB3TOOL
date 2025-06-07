// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxoykbwigsfheaegpwke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b3lrYndpZ3NmaGVhZWdwd2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NzcxMzUsImV4cCI6MjA2NDQ1MzEzNX0.yooMcQ6e2CSFdnNm9ogOiLrc8i09LS2MUNdI8WzNy8c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
