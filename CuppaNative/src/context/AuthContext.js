import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import messaging from '@react-native-firebase/messaging';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    // 1. Auth State Listener
    const unsubscribeAuth = auth.onAuthStateChanged(async (authUser) => {
      setLoading(true); // Ensure we are in loading state while determining user data
      if (authUser) {
        setUser(authUser);

        // --- Push Notification Registration ---
        const registerForPush = async () => {
          try {
            const authStatus = await messaging().requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
              const token = await messaging().getToken();
              await db.collection('users').doc(authUser.uid).set({
                pushToken: token,
                lastTokenUpdate: new Date().toISOString()
              }, { merge: true });
            }
          } catch (e) {
            console.log("Push registration failed", e);
          }
        };
        registerForPush();

        // 2. Real-time User Doc Listener
        unsubscribeUserDoc = db.collection('users')
          .doc(authUser.uid)
          .onSnapshot(async (doc) => {
            try {
              if (doc.exists) {
                const data = doc.data();

                // Check for Daily Reset
                const today = new Date().toISOString().split('T')[0];
                if (data.lastResetDate !== today) {
                  // Use a transaction for the reset to ensure consistency
                  db.runTransaction(async (transaction) => {
                    const userRef = db.collection('users').doc(authUser.uid);
                    transaction.update(userRef, {
                      likesSentToday: 0,
                      messagesSentToday: 0,
                      introsAcceptedToday: 0,
                      lastResetDate: today
                    });
                  }).catch(e => console.error("Daily reset failed:", e));
                  
                  // Optimistic local update
                  setUserData({ 
                    ...data, 
                    likesSentToday: 0, 
                    messagesSentToday: 0, 
                    introsAcceptedToday: 0,
                    lastResetDate: today 
                  });
                } else {
                  setUserData(data);
                }
              } else {
                setUserData(null);
              }
            } catch (err) {
              console.error("Error processing user doc:", err);
            } finally {
              setLoading(false);
            }
          }, (err) => {
            console.error("User doc listener error:", err);
            setLoading(false);
          });
      } else {
        setUser(null);
        setUserData(null);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  // Helper function to update local context data and sync with DB
  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const purchasePlan = async (planType) => {
    if (!user) return;
    const planData = {
      isPro: true,
      planType: planType, // 'Basic', 'Standard', 'Premium'
      planExpiry: calculateExpiry(planType),
      updatedAt: new Date().toISOString()
    };

    try {
      await db.collection('users').doc(user.uid).update(planData);
      setUserData(prev => ({ ...prev, ...planData }));
      return true;
    } catch (e) {
      console.error("Purchase sync failed", e);
      return false;
    }
  };

  const calculateExpiry = (plan) => {
    const d = new Date();
    if (plan === 'Basic') d.setDate(d.getDate() + 7); // Basic is weekly (99)
    else if (plan === 'Standard') d.setMonth(d.getMonth() + 1); // Standard is monthly (399)
    else if (plan === 'Premium') d.setMonth(d.getMonth() + 6); // Premium is 6 months (1999)
    return d.toISOString();
  };

  return (
    <AuthContext.Provider value={{ user, userData, updateUserData, purchasePlan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
