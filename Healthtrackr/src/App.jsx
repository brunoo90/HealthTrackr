import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// Supabase-Client erstellen
const supabase = createClient(
  "https://yqngvcycseboxalkhoif.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxbmd2Y3ljc2Vib3hhbGtob2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NTMzMzcsImV4cCI6MjA1MzAyOTMzN30.sACT8RU4d8wLLWyYD0ih7PUrWMI9Pn9OcxmYJ6dGeVc"
);

function App() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    datum: "",
    arzt_name: "",
    grund: "",
  });

  useEffect(() => {
    const fetchSession = async () => {
      const session = supabase.auth.session();
      if (session) {
        setUser(session.user); 
      }
    };

    fetchSession();

    // Authentifizierungslistener
    const authListener = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user); 
        } else {
          setUser(null); 
        }
      }
    );


    return () => {
      authListener.data?.unsubscribe?.(); 
    };
  }, []);

  // Logout-Funktion
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); 
  };

  

  return (
    <div>
      {!user ? (
        <div>
          <h2>Login / Register</h2>
          {/* Auth-UI von Supabase verwenden */}
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            socialLayout="horizontal"
            providers={['google', 'github']}
          />
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.email}</h2>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
}



export default App;
