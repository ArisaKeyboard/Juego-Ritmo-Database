import React, { useState } from "react";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/logo.png";
import logIcon from "../assets/log_icon.png"; 

export default function Login() {
  const navigate = useNavigate();
  const [newUser, setNewUser] = useState(false);
  const [uid, setUid] = useState("");
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    country: ""
  });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitData = async () => {
    if (!formData.username || !formData.country) {
      return alert("Completa ambos campos");
    }

    await setDoc(doc(db, "players", uid), {
      ...formData,
      email: user.email,
      level: 1,
      registrationDate: new Date(),
      role: "player"
    });

    navigate("/player");
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setUser(user);
      const userRef = doc(db, "players", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setUid(user.uid);
        setNewUser(true);
        return;
      }

      const userData = userSnap.data();
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/player");
      }
    } catch (err) {
      console.error("Error en login:", err);
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo del juego" className="main-logo" />

      <div className="login-card">
        <img src={logIcon} alt="Icono de usuario" className="login-icon" />

        {!newUser ? (
          <>
            <h1 className="login-title">Inicia sesión</h1>
            <button onClick={loginWithGoogle} className="login-button">
              Iniciar sesión con Google
            </button>
          </>
        ) : (
          <>
            <h2 className="login-subtitle">¡Bienvenido!</h2>
            <p className="login-text">Completa tu perfil:</p>
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              className="login-input"
            />
            <input
              type="text"
              name="country"
              placeholder="País"
              value={formData.country}
              onChange={handleChange}
              className="login-input"
            />
            <button onClick={submitData} className="login-button">
              Guardar y continuar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
