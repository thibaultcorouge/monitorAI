"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { database } from "../../lib/firebase/config";
import { ref, get } from "firebase/database";

const Banner = () => {
    const { user } = useAuth();
    const [userName, setUserName] = useState({ firstName: '', lastName: '' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {

        setIsLoading(true);

        if (user) {
            const userRef = ref(database, `users/${user.uid}`);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setUserName({
                        firstName: data.firstName || '',
                        lastName: data.lastName || ''
                    });
                }
                setIsLoading(false);
            }).catch(error => {
                console.error("Error fetching user data:", error);
                setIsLoading(false);
            });
        } else {

            setIsLoading(false);
        }
    }, [user]);

    const formattedFirstName = userName.firstName ? userName.firstName.charAt(0).toUpperCase() + userName.firstName.slice(1)
    : '';


    return (
        <div className=" m-5 mb-9 bg-background text-fontdark w-full max-w-4xl mx-auto flex flex-col items-center justify-center ">
            <div className="flex flex-col items-center gap-1 justify-center transition-all  duration-300 ease">
               {isLoading ? (
                  <div className="flex flex-col items-center gap-1 animate-pulse">
                  <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-7 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : (
                <>
                <p className="text-xl text-[var(--fontdark)] ">
                  {formattedFirstName 
                    ? `Bienvenue ${formattedFirstName}, voici votre veille du jour.`
                    : "Bienvenue sur Cognivis pour une vision humaine de l'Intelligence artificielle."}
                </p>
                {/* <p className="text-xl text-[var(--fontdark)]">Voici votre veille du jour ; bonne lecture !</p> */}
              </>
            )}
            </div>
        </div>
    );
};

export default Banner;