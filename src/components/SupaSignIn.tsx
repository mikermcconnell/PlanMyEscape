import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';

export default function SupaSignIn() {
  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'facebook']}
        theme="dark"
      />
    </div>
  );
} 