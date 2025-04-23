/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState(''); // Separate state for reset email
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Function to trigger RSS update - moved from HomePage
  const triggerRssUpdate = async () => {
    setUpdating(true);

    try {
      const response = await fetch("/api/update-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour des flux RSS");
      }

      const data = await response.json();
      console.log("RSS update successful:", data);
      
      // Update timestamp
      updateTimestamp();
    } catch (error) {
      console.error("Error updating RSS feeds", error);
      // Don't show error to user during login process
    } finally {
      setUpdating(false);
    }
  };

  // Function to update the timestamp in Firebase
  const updateTimestamp = async () => {
    const now = new Date();
    const formattedTime =
      now.toLocaleDateString() +
      " à " +
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    // Import needed Firebase functions at the top level
    try {
      // Import Firebase functions
      const { ref, set } = await import("firebase/database");
      const { database } = await import("../lib/firebase/config");
      
      // Update timestamp in Firebase
      await set(ref(database, "system/lastRssUpdate"), {
        timestamp: now.getTime(),
        formattedTime: formattedTime
      });
      
      console.log("Updated RSS timestamp in Firebase");
      
      // Still keep local storage for fallback
      localStorage.setItem("last_rss_update_time", now.getTime().toString());
      localStorage.setItem("last_update_formatted", formattedTime);
      
      return formattedTime;
    } catch (error) {
      console.error("Error updating timestamp in Firebase:", error);
      
      // Fallback to local storage if Firebase update fails
      localStorage.setItem("last_rss_update_time", now.getTime().toString());
      localStorage.setItem("last_update_formatted", formattedTime);
      
      return formattedTime;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Attempt to sign in
      await signIn(email, password);
      
      // If sign in is successful, trigger RSS update
      await triggerRssUpdate();
      
      // Navigate to home page
      router.push('/home');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou mot de passe invalide');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Votre compte a été désactivé.');
      } else {
        setError('Échec de la connexion. Veuillez vérifier vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Separate function to handle password reset
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetError("Veuillez entrer votre email");
      return;
    }
    
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, resetEmail);
      
      // Firebase always returns success, even if the email isn't registered
      // This is a security feature to prevent email enumeration
      setResetSuccess(
        "Si cet email est associé à un compte, un lien de réinitialisation a été envoyé. " +
        "Vérifiez votre boîte de réception et les spams."
      );
      
      // Don't close modal immediately so user can see success message
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
      }, 5000); // Increased to 5 seconds so users have time to read the longer message
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      // Firebase will only throw errors for invalid format, rate limiting, etc.
      // It won't throw an error for non-existent emails
      if (error.code === 'auth/invalid-email') {
        setResetError("Format d'email invalide.");
      } else if (error.code === 'auth/too-many-requests') {
        setResetError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setResetError("Une erreur est survenue lors de la réinitialisation.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Initialize reset email when opening the modal
  const openResetModal = () => {
    setResetEmail(email); // Pre-fill with the login email as a convenience
    setResetError('');
    setResetSuccess('');
    setShowResetModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-60 h-60 relative">
            {/* Replace with your actual logo */}
            <div className="w-full h-full flex items-center justify-center rounded-full text-2xl font-bold text-white">
              <Image 
              src="/images/logo-cognivis.png" 
              alt="logo Cognivis" 
              width={300} 
              height={300} 
              className="opacity-40"
              >
              </Image>
            </div>
          </div>
        </div>
        {error && (
          <div className="alert-error px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight input inputfocus"
              placeholder="exemple@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2" htmlFor="password">
              Mot de Passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight input inputfocus"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading || updating}
              className="bg-darkgreenbutton text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full hover:bg-opacity-90 transition-all"
            >
              {loading || updating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {updating ? 'Mise à jour des articles...' : 'Connexion en cours...'}
                </div>
              ) : (
                'Se Connecter'
              )}
            </button>
          </div>
        </form>
        
        {/* Password reset link - moved outside the form */}
        <p className="text-sm text-center mt-4">
          <button
            type="button"
            onClick={openResetModal}
            className="text-darkgreenbutton hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </p>
      </div>

      {/* Password reset modal - outside the form */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowResetModal(false)}
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-4">Réinitialiser le mot de passe</h2>
            
            {resetSuccess && (
              <div className="alert-validation px-4 py-3 rounded mb-4">
                {resetSuccess}
              </div>
            )}
            
            {resetError && (
              <div className="alert-error px-4 py-3 rounded mb-4">
                {resetError}
              </div>
            )}
            
            <div>
              <input
                type="email"
                placeholder="Entrez votre email"
                className="w-full border px-3 py-2 mb-4 rounded"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <button
                className="w-full bg-darkgreenbutton text-white py-2 rounded hover:bg-opacity-90"
                onClick={handlePasswordReset}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}