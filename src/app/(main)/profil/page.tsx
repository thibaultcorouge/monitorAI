
"use client";

import { useState, useEffect } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User } from "firebase/auth";
import TransitionLayout from "../../components/TransitionLayout";


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Add CSS keyframes for animations
  useEffect(() => {
    // Add a style tag with our custom animations
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Get current user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        setError("Utilisateur non connecté ou email manquant");
        return;
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Votre mot de passe a été mis à jour avec succès");
    } catch (error) {
      console.error("Error changing password:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "auth/wrong-password"
      ) {
        setError("Le mot de passe actuel est incorrect");
      } else {
        if (typeof error === "object" && error !== null && "message" in error) {
          setError(`Erreur lors de la mise à jour du mot de passe: ${(error as { message: string }).message}`);
        } else {
          setError("Erreur lors de la mise à jour du mot de passe.");
        }
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Loading skeleton
  const ProfileSkeleton = () => (
    <div className="bg-greenwhite rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="h-6 w-1/4 bg-gray-200 rounded mb-6"></div>
      <div className="h-10 w-full bg-gray-200 rounded mb-4"></div>
      <div className="h-10 w-full bg-gray-200 rounded mb-4"></div>
      <div className="h-10 w-full bg-gray-200 rounded mb-6"></div>
      <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
    </div>
  );

  if (loading) {
    return (
      <TransitionLayout>
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Mon profil</h1>
          <ProfileSkeleton />
        </div>
      </TransitionLayout>
    );
  }

  // Redirect if not logged in
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Format dates safely
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <TransitionLayout>
      <div 
        className="container mx-auto p-4 mb-15 "
        style={{
          animation: `fadeIn 600ms ease-out forwards`,
        }}
      >

        <h1 className="text-3xl font-bold mb-6 mt-6">Mon profil</h1>
        
        <div className="bg-greenwhite rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informations du compte</h2>
          <div className="mb-4">
            <p className=" font-medium">Email</p>
            <p className="text-fontdark">{user.email || 'N/A'}</p>
          </div>
          <div className="mb-4">
            <p className=" font-medium">Compte créé le</p>
            <p className="text-fontdark">
              {formatDate(user.metadata.creationTime)} à {formatTime(user.metadata.creationTime)}
            </p>
          </div>
          <div className="mb-4">
            <p className=" font-medium">Dernière connexion</p>
            <p className="text-fontdark">
              {formatDate(user.metadata.lastSignInTime)} à {formatTime(user.metadata.lastSignInTime)}
            </p>
          </div>
        </div>
        
        <div className="bg-greenwhite rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Changer de mot de passe</h2>
          
          {error && (
            <div className="alert-error px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert-validation px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label 
                htmlFor="currentPassword" 
                className="block text-fontdark font-medium mb-2"
              >
                Mot de passe actuel
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border input inputfocus rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label 
                htmlFor="newPassword" 
                className="block text-fontdark font-medium mb-2"
              >
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border input inputfocus rounded "
                required
              />
            </div>
            
            <div className="mb-6">
              <label 
                htmlFor="confirmPassword" 
                className="block text-fontdark font-medium mb-2"
              >
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border input inputfocus rounded "
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isChangingPassword}
              className={`px-4 py-2 rounded text-white font-medium ${
                isChangingPassword
                  ? 'bg-darkgreenbutton cursor-not-allowed' 
                  : 'bg-darkgreenbutton bg-dar transition-colors'
              }`}
            >
              {isChangingPassword ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Modification en cours...
                </div>
              ) : (
                "Changer le mot de passe"
              )}
            </button>
          </form>
        </div>
      </div>
    </TransitionLayout>
  );
}