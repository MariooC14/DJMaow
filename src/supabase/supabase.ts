// import { initializeApp } from 'firebase/app';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

// const firebaseConfig = {
//   apiKey: 'AIzaSyAz3TWjinTF9Qk1J94z_u8pFrsricrghCs',
//   authDomain: 'dj-maow.firebaseapp.com',
//   projectId: 'dj-maow',
//   storageBucket: 'dj-maow.appspot.com',
//   messagingSenderId: '271753020072',
//   appId: '1:271753020072:web:e1b91a100d20507249389d',
//   measurementId: 'G-FCZ2RXJ35J',
// };
//
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// Initialize supabase
export const supabase = createClient('https://sktifcjayrnpbinvlhoj.supabase.co', process.env.SUPABASE_KEY || '');

