// lib/firebase/auth.ts
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    UserCredential
  } from 'firebase/auth';
  import { ref, set } from 'firebase/database';
  import { auth, database } from './config';
  import { UserData } from '../../lib/utils/types';
  
  export const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };
  
  export const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  export const createUser = async (email: string, password: string, userData: Omit<UserData, 'createdAt'>): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save additional user data to Realtime Database
      await set(ref(database, `users/${userCredential.user.uid}`), {
        ...userData,
        email,
        createdAt: new Date().toISOString(),
        authId: userCredential.user.uid
      });
      
      return userCredential;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };