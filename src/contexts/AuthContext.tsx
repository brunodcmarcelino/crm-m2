import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
        };

        loadSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    const signIn = (email, password) =>
        supabase.auth.signInWithPassword({ email, password });

    const signUp = (email, password) =>
        supabase.auth.signUp({ email, password });

    const signOut = () => supabase.auth.signOut();

    return (
        <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
