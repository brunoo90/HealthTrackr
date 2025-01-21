import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import './style.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,  // URL aus der .env Datei
  import.meta.env.VITE_SUPABASE_API_KEY  // API-Schlüssel aus der .env Datei
);

function App() {
  const [user, setUser] = useState(null);
  const [arztbesuch, setArztbesuch] = useState([]);
  const [benutzer, setBenutzer] = useState(null);
  const [newArztbesuch, setNewArztbesuch] = useState({
    datum: "",
    arzt_name: "",
    grund: "",
  });
  const [editArztbesuch, setEditArztbesuch] = useState(null); 

 
  useEffect(() => {
    const fetchSession = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      } else {
        setUser(session?.user || null); 
      }
    };

    fetchSession();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null); 
    });

    
    return () => {
      authListener.data?.unsubscribe?.();
    };
  }, []);

  
  const fetchBenutzerData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("Benutzer")
      .select("id, name, email")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
      return;
    }

    setBenutzer(data); 
  };

  // Holt alle Arztbesuche des Benutzers
  const fetchArztbesuch = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("Arztbesuch")
      .select("*")
      .eq("benutzer_id", user.id);

    if (error) {
      console.error("Error fetching arztbesuch:", error);
      return;
    }

    setArztbesuch(data); 
  };

  // Wird aufgerufen, wenn ein neuer Arztbesuch hinzugefügt wird
  const addArztbesuch = async () => {
    if (!newArztbesuch.datum || !newArztbesuch.arzt_name || !newArztbesuch.grund) {
      alert("Bitte füllen Sie alle Felder aus!");
      return;
    }

    try {
      // Arztbesuch in Supabase-Datenbank einfügen
      const { data, error } = await supabase
        .from("Arztbesuch")
        .insert([
          {
            benutzer_id: user.id,
            datum: newArztbesuch.datum,
            arzt_name: newArztbesuch.arzt_name,
            grund: newArztbesuch.grund,
          },
        ])
        .single(); // .single() gibt uns nur den neu hinzugefügten Eintrag zurück

      if (error) {
        console.error("Fehler beim Hinzufügen des Arztbesuchs:", error);
        alert(`Fehler: ${error.message}`);
        return;
      }

      // Erfolgreich hinzugefügt, Zustand aktualisieren
      setArztbesuch((prevState) => [...prevState, data]);

      
      setNewArztbesuch({ datum: "", arzt_name: "", grund: "" });
    } catch (err) {
      console.error("Fehler beim Hinzufügen des Arztbesuchs:", err);
      alert(`Fehler: ${err.message}`);
    }
  };

  // Bearbeitet einen bestehenden Arztbesuch
  const editArztbesuchHandler = async () => {
    if (!editArztbesuch.datum || !editArztbesuch.arzt_name || !editArztbesuch.grund) {
      alert("Bitte füllen Sie alle Felder aus!");
      return;
    }

    try {
      // Arztbesuch in der Supabase-Datenbank aktualisieren
      const { data, error } = await supabase
        .from("Arztbesuch")
        .update({
          datum: editArztbesuch.datum,
          arzt_name: editArztbesuch.arzt_name,
          grund: editArztbesuch.grund,
        })
        .eq("id", editArztbesuch.id) 
        .single();

      if (error) {
        console.error("Fehler beim Bearbeiten des Arztbesuchs:", error);
        alert(`Fehler: ${error.message}`);
        return;
      }

      // Erfolgreich aktualisiert, Zustand aktualisieren
      setArztbesuch((prevState) => {
        return prevState.map((besuch) =>
          besuch.id === editArztbesuch.id ? data : besuch
        );
      });

      // Formular zurücksetzen
      setEditArztbesuch(null); 
    } catch (err) {
      console.error("Fehler beim Bearbeiten des Arztbesuchs:", err);
      alert(`Fehler: ${err.message}`);
    }
  };

  // Löscht einen Arztbesuch
  const deleteArztbesuch = async (arztbesuchId) => {
    if (!user) return;

    const { error } = await supabase
      .from("Arztbesuch")
      .delete()
      .eq("id", arztbesuchId)
      .eq("benutzer_id", user.id); // Nur eigene Einträge löschen

    if (error) {
      console.error("Fehler beim Löschen des Arztbesuchs:", error);
      return;
    }

    // Arztbesuch aus dem Zustand entfernen
    setArztbesuch((prevState) => prevState.filter((besuch) => besuch.id !== arztbesuchId));
  };

  // Logout-Funktion
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // useEffect für das Abrufen der Benutzer- und Arztbesuchsdaten bei Benutzerauthentifizierung
  useEffect(() => {
    if (user) {
      fetchBenutzerData(); // Holt Benutzerdaten bei erfolgreicher Anmeldung
      fetchArztbesuch(); // Holt Arztbesuche bei erfolgreicher Anmeldung
    }
  }, [user]); 

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
          <h2>Welcome, {benutzer ? benutzer.name : 'loading...'}</h2>
          <p>Email: {benutzer ? benutzer.email : 'loading...'}</p>
          <button onClick={handleSignOut}>Sign Out</button>

          <h3>Your Arztbesuche</h3>
          {arztbesuch && arztbesuch.length > 0 ? (
            <ul>
              {arztbesuch.map((besuch) => {
                if (besuch) {
                  return (
                    <li key={besuch.id}>
                      {besuch.datum} - {besuch.arzt_name} - {besuch.grund}
                      <button onClick={() => deleteArztbesuch(besuch.id)}>Delete</button>
                      <button onClick={() => setEditArztbesuch(besuch)}>Edit</button>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          ) : (
            <p>Noch keine Arztbesuche.</p>
          )}

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

          {editArztbesuch && (
            <div>
              <h3>Edit Arztbesuch</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editArztbesuchHandler();
                }}
              >
                <input
                  type="date"
                  value={editArztbesuch.datum}
                  onChange={(e) => setEditArztbesuch({ ...editArztbesuch, datum: e.target.value })}
                />
                <input
                  type="text"
                  value={editArztbesuch.arzt_name}
                  onChange={(e) => setEditArztbesuch({ ...editArztbesuch, arzt_name: e.target.value })}
                  placeholder="Doctor's Name"
                />
                <input
                  type="text"
                  value={editArztbesuch.grund}
                  onChange={(e) => setEditArztbesuch({ ...editArztbesuch, grund: e.target.value })}
                  placeholder="Reason"
                />
                <button type="submit">Save Changes</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
