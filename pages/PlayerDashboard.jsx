import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, Timestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import PlayerChart from "../components/PlayerChart";
import './PlayerDashboard.css';
import logo from '../assets/logo.png';

export default function PlayerDashboard() {
  const [playerData, setPlayerData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [songs, setSongs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [simData, setSimData] = useState({
    songId: "",
    accuracy: "",
    comboMax: "",
    duration: "",
    score: ""
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        const playerRef = doc(db, "players", user.uid);
        const playerSnap = await getDoc(playerRef);

        if (playerSnap.exists()) {
          const data = playerSnap.data();
          setPlayerData(data);
          setNewUsername(data.username);

          const q = query(
            collection(db, "game_sessions"),
            where("playerEmail", "==", data.email)
          );
          const sessionSnap = await getDocs(q);

          const allSessions = [];

          for (const docSnap of sessionSnap.docs) {
            const s = docSnap.data();
            const songDoc = await getDoc(s.songId);
            const songTitle = songDoc.exists() ? songDoc.data().title : "Desconocida";

            allSessions.push({
              id: docSnap.id,
              date: s.date?.toDate?.() || new Date(),
              accuracy: s.accuracy,
              comboMax: s.comboMax,
              duration: s.duration,
              score: s.score,
              songTitle
            });
          }

          const sorted = allSessions.sort((a, b) => b.date - a.date);
          setSessions(sorted);
          recalculateStats(sorted);

          const songSnap = await getDocs(collection(db, "songs"));
          setSongs(songSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [user, navigate]);

  const recalculateStats = (sessionList) => {
    const totalAccuracy = sessionList.reduce((sum, s) => sum + s.accuracy, 0);
    const maxScore = sessionList.reduce((max, s) => Math.max(max, s.score), 0);
    const totalDuration = sessionList.reduce((sum, s) => sum + s.duration, 0);
    const sessionCount = sessionList.length;

    setStats({
      avgAccuracy: sessionCount > 0 ? (totalAccuracy / sessionCount) : 0,
      maxScore,
      totalDuration,
      sessionCount,
      lastSession: sessionList.length > 0 ? sessionList[0].date : null
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleSaveUsername = async () => {
    try {
      const playerRef = doc(db, "players", user.uid);
      await updateDoc(playerRef, { username: newUsername });
      setPlayerData({ ...playerData, username: newUsername });
      setEditing(false);
    } catch (error) {
      console.error("Error updating username:", error);
    }
  };

  const handleSimChange = (e) => {
    setSimData({ ...simData, [e.target.name]: e.target.value });
  };

  const handleSimSubmit = async () => {
    if (!simData.songId || !simData.accuracy || !simData.comboMax || !simData.duration || !simData.score) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "game_sessions"), {
        songId: doc(db, "songs", simData.songId),
        playerEmail: playerData.email,
        accuracy: parseFloat(simData.accuracy),
        comboMax: parseInt(simData.comboMax),
        duration: parseInt(simData.duration),
        score: parseInt(simData.score),
        date: Timestamp.now()
      });

      const newSession = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date(),
        accuracy: parseFloat(simData.accuracy),
        comboMax: parseInt(simData.comboMax),
        duration: parseInt(simData.duration),
        score: parseInt(simData.score),
        songTitle: songs.find(song => song.id === simData.songId)?.title || "Desconocida"
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      recalculateStats(updatedSessions);

      setSimData({ songId: "", accuracy: "", comboMax: "", duration: "", score: "" });
      alert("¡Sesión simulada guardada con éxito!");
    } catch (error) {
      console.error("Error al guardar sesión:", error);
      alert("Error al guardar la sesión. Por favor intenta nuevamente.");
    }
  };

  if (loading || !user || !playerData) {
    return (
      <div className="player-dashboard">
        <div className="loading">
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-dashboard">
      <img src={logo} alt="Logo" className="logo" />

      <div className="header">
        <div>
          <h1>Bienvenido, {playerData.username}!</h1>
          <p>Tu centro de rendimiento y estadísticas</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z"/>
            <path fillRule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"/>
          </svg>
          Cerrar sesión
        </button>
      </div>

      <div className="section">
        <h2>Mi perfil</h2>
        <div className="profile-grid">
          <div className="profile-info">
            <p><strong>Email:</strong> {playerData.email}</p>
            <p><strong>País:</strong> {playerData.country}</p>
            <p><strong>Fecha de registro:</strong> {new Date(playerData.registrationDate.seconds * 1000).toLocaleDateString()}</p>
          </div>
          <div className="profile-info">
            <p>
              <strong>Nombre de usuario:</strong> {!editing ? (
                <>
                  {playerData.username}
                  <button onClick={() => setEditing(true)} className="edit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                    Editar
                  </button>
                </>
              ) : (
                <div className="edit-username">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="Nuevo nombre de usuario"
                  />
                  <button onClick={handleSaveUsername} className="save-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                    </svg>
                    Guardar
                  </button>
                </div>
              )}
            </p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="section">
          <h2>Estadísticas personales</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Sesiones jugadas</h3>
              <p>{stats.sessionCount}</p>
            </div>
            <div className="stat-card">
              <h3>Precisión promedio</h3>
              <p>{stats.avgAccuracy.toFixed(2)}%</p>
            </div>
            <div className="stat-card">
              <h3>Puntaje máximo</h3>
              <p>{stats.maxScore}</p>
            </div>
            <div className="stat-card">
              <h3>Tiempo total jugado</h3>
              <p>{(stats.totalDuration / 60).toFixed(1)} min</p>
            </div>
            {stats.lastSession && (
              <div className="stat-card">
                <h3>Última sesión</h3>
                <p>{stats.lastSession.toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section">
        <h2>Mis sesiones de juego</h2>
        {sessions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Canción</th>
                <th>Fecha</th>
                <th>Precisión</th>
                <th>Combo Máx</th>
                <th>Duración</th>
                <th>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td>{s.songTitle}</td>
                  <td>{s.date.toLocaleDateString()}</td>
                  <td>{s.accuracy.toFixed(2)}%</td>
                  <td>{s.comboMax}</td>
                  <td>{s.duration}s</td>
                  <td>{s.score.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay sesiones registradas todavía.</p>
        )}
      </div>

      {sessions.length > 0 && <PlayerChart sessions={sessions} />}

      <div className="section">
        <h2>Simulador de partida</h2>
        <div className="input-grid">
          <select 
            name="songId" 
            value={simData.songId} 
            onChange={handleSimChange}
            required
          >
            <option value="">Selecciona una canción</option>
            {songs.map(song => (
              <option key={song.id} value={song.id}>
                {song.title} - {song.artist}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="accuracy"
            placeholder="Precisión (%)"
            value={simData.accuracy}
            onChange={handleSimChange}
            min="0"
            max="100"
            step="0.01"
            required
          />

          <input
            type="number"
            name="comboMax"
            placeholder="Combo Máximo"
            value={simData.comboMax}
            onChange={handleSimChange}
            min="0"
            required
          />

          <input
            type="number"
            name="duration"
            placeholder="Duración (segundos)"
            value={simData.duration}
            onChange={handleSimChange}
            min="0"
            required
          />

          <input
            type="number"
            name="score"
            placeholder="Puntaje"
            value={simData.score}
            onChange={handleSimChange}
            min="0"
            required
          />
        </div>

        <button onClick={handleSimSubmit} className="simulate-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
          </svg>
          Guardar sesión simulada
        </button>
      </div>
    </div>
  );
}