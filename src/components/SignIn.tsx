import React, { useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { app } from '../firebase';

const auth = getAuth(app);

const uiConfig = {
  signInSuccessUrl: '/', // Redirect to home on success
  signInOptions: [
    // List of OAuth providers supported
    {
      provider: 'google.com',
      // Additional config options if needed
    },
    {
      provider: 'password',
    },
  ],
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  callbacks: {
    signInSuccessWithAuthResult: () => false, // Prevents redirect, handle in app if needed
  },
};

export default function SignIn() {
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the FirebaseUI Widget using Firebase.
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    if (uiRef.current) {
      ui.start(uiRef.current, uiConfig);
    }
    return () => {
      ui.reset();
    };
  }, []);

  return (
    <div>
      <h2>Sign In to PlanMyEscape</h2>
      <div ref={uiRef} />
    </div>
  );
} 