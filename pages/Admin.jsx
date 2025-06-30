import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import SessionChart from "../components/SessionChart";
import "./Admin.css";

export default function Admin() {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    genre: "",
    difficulty: 1,
    duration: 120
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarCancion = async () => {
    const newSong = {
      ...form,
      difficulty: Number(form.difficulty),
      duration: Number(form.duration)
    };
    await addDoc(collection(db, "songs"), newSong);
    alert("Canción agregada");
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Panel de Administrador</h2>

      <div className="form-box">
        <h3 className="admin-subtitle">Agregar nueva canción</h3>
        <div className="form-grid">
          <input type="text" name="title" placeholder="Título" onChange={handleChange} className="admin-input" />
          <input type="text" name="artist" placeholder="Artista" onChange={handleChange} className="admin-input" />
          <input type="text" name="genre" placeholder="Género" onChange={handleChange} className="admin-input" />
          <input type="number" name="difficulty" placeholder="Dificultad" onChange={handleChange} className="admin-input" />
          <input type="number" name="duration" placeholder="Duración (seg)" onChange={handleChange} className="admin-input" />
        </div>
        <button onClick={agregarCancion} className="admin-button">
          Agregar canción
        </button>
      </div>

      <SessionChart />
    </div>
  );
}
