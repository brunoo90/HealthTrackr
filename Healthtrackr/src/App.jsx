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
  const [arztbesuch, setArztbesuch] = useState([]);
  const [newArztbesuch, setNewArztbesuch] = useState({
    datum: "",
    arzt_name: "",
    grund: "",
  });

  useEffect(() => {
    const fetchSession = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      } else if (session) {
        setUser(session.user); // Benutzer setzen, wenn Session vorhanden
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

  // Funktion zum Abrufen der Arztbesuche des Benutzers
  const fetchArztbesuch = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("arztbesuch")
      .select()
      .eq("benutzer_id", user.id); // Benutzen von benutzer_id für die Abfrage

    if (error) {
      console.error("Error fetching arztbesuch:", error);
    } else {
      setArztbesuch(data);
    }
  };

  // Funktion zum Hinzufügen eines neuen Arztbesuchs
  const addArztbesuch = async () => {
    if (!newArztbesuch.datum || !newArztbesuch.arzt_name || !newArztbesuch.grund) {
      alert("Bitte füllen Sie alle Felder aus!");
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from("arztbesuch")
        .insert([
          {
            benutzer_id: user.id, // Hier wird benutzer_id verwendet
            datum: newArztbesuch.datum,
            arzt_name: newArztbesuch.arzt_name,
            grund: newArztbesuch.grund,
          },
        ]);

      // Überprüfe, ob ein Fehler aufgetreten ist
      if (error) {
        console.error("Fehler beim Hinzufügen des Arztbesuchs:", error);
        alert(`Fehler: ${error.message}`);
        return;
      }

      // Ausgabe der Antwort von Supabase
      console.log("Arztbesuch erfolgreich hinzugefügt:", data);

      // Wenn keine Fehler vorhanden sind, Arztbesuch in den Zustand hinzufügen
      setArztbesuch((prevState) => [...prevState, ...data]);
      setNewArztbesuch({ datum: "", arzt_name: "", grund: "" });
    } catch (err) {
      console.error("Fehler beim Hinzufügen des Arztbesuchs:", err);
      alert(`Fehler: ${err.message}`);
    }
  };

  // Funktion zum Löschen eines Arztbesuchs
  const deleteArztbesuch = async (arztbesuchId) => {
    const { error } = await supabase
      .from("arztbesuch")
      .delete()
      .eq("id", arztbesuchId)
      .eq("benutzer_id", user.id); // Sicherstellen, dass nur der Benutzer seine eigenen Einträge löschen kann

    if (error) {
      console.error("Fehler beim Löschen des Arztbesuchs:", error);
    } else {
      setArztbesuch(arztbesuch.filter((besuch) => besuch.id !== arztbesuchId));
    }
  };

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

          <h3>Your Arztbesuche</h3>
          <ul>
            {arztbesuch.map((besuch) => (
              <li key={besuch.id}>
                {besuch.datum} - {besuch.arzt_name} - {besuch.grund}
                <button onClick={() => deleteArztbesuch(besuch.id)}>Delete</button>
              </li>
            ))}
          </ul>

          <h3>Add New Arztbesuch</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addArztbesuch();
            }}
          >
            <input
              type="date"
              value={newArztbesuch.datum}
              onChange={(e) => setNewArztbesuch({ ...newArztbesuch, datum: e.target.value })}
            />
            <input
              type="text"
              value={newArztbesuch.arzt_name}
              onChange={(e) => setNewArztbesuch({ ...newArztbesuch, arzt_name: e.target.value })}
              placeholder="Doctor's Name"
            />
            <input
              type="text"
              value={newArztbesuch.grund}
              onChange={(e) => setNewArztbesuch({ ...newArztbesuch, grund: e.target.value })}
              placeholder="Reason"
            />
            <button type="submit">Add Arztbesuch</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
