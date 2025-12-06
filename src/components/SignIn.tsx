import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail
} from 'firebase/auth';
import { AuthContext } from '../contexts/AuthContext';
import { Tent, Mail, Lock, Loader2 } from 'lucide-react';
import { logSecurityEvent } from '../utils/securityLogger';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential } from 'firebase/auth';

export default function SignIn() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    if (user) return null;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                await logSecurityEvent({ type: 'login', userId: auth.currentUser?.uid || 'unknown', userAgent: navigator.userAgent });
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                await logSecurityEvent({ type: 'signup', userId: auth.currentUser?.uid || 'unknown', userAgent: navigator.userAgent });
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.message.includes('auth/invalid-credential')) {
                setError('Incorrect email or password. Please try again.');
            } else if (err.code === 'auth/user-not-found' || err.message.includes('auth/user-not-found')) {
                setError('No account found with this email. Please sign up.');
            } else if (err.code === 'auth/wrong-password' || err.message.includes('auth/wrong-password')) {
                setError('Incorrect password. Please try again.');
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            if (Capacitor.isNativePlatform()) {
                const result = await FirebaseAuthentication.signInWithGoogle();
                const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                await signInWithCredential(auth, credential);
            } else {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            }
            await logSecurityEvent({ type: 'login_google', userId: auth.currentUser?.uid || 'unknown', userAgent: navigator.userAgent });
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.message.includes('auth/invalid-credential')) {
                setError('Incorrect email or password. Please try again.');
            } else if (err.code === 'auth/user-not-found' || err.message.includes('auth/user-not-found')) {
                setError('No account found with this email. Please sign up.');
            } else if (err.code === 'auth/wrong-password' || err.message.includes('auth/wrong-password')) {
                setError('Incorrect password. Please try again.');
            } else {
                setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Please enter your email address first');
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setError(null);
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Tent className="h-10 w-10 text-green-600" />
                        <span className="font-bold text-2xl text-gray-900">PlanMyEscape</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p className="text-gray-600">
                        {isLogin ? 'Sign in to access your trips' : 'Start planning your next adventure'}
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {resetSent && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                            Password reset email sent! Check your inbox.
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                            Google
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        {isLogin ? (
                            <>
                                <button onClick={handlePasswordReset} className="text-green-600 hover:underline mb-2 block w-full">
                                    Forgot password?
                                </button>
                                <p className="text-gray-600">
                                    Don't have an account?{' '}
                                    <button onClick={() => setIsLogin(false)} className="text-green-600 font-medium hover:underline">
                                        Sign up
                                    </button>
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <button onClick={() => setIsLogin(true)} className="text-green-600 font-medium hover:underline">
                                    Sign in
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-amber-800">
                            <strong>Note:</strong> Without signing in, data stays on this device only.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        Continue without signing in
                    </button>
                </div>
            </div>
        </div>
    );
}
