import React, { useEffect, useState } from "react";
import {
  collection, getDocs, doc, getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557', '#6a040f'];

export default function SessionChart() {
  const [sessions, setSessions] = useState([]);
  const [songs, setSongs] = useState([]);
  const [chartType, setChartType] = useState("accuracy_by_country");
  const [filters, setFilters] = useState({
    country: "",
    songID: "",
    dateStart: "",
    dateEnd: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const sessionSnap = await getDocs(collection(db, "game_sessions"));
      const playerSnap = await getDocs(collection(db, "players"));
      const songSnap = await getDocs(collection(db, "songs"));

      const playerMap = {};
      playerSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          playerMap[data.email] = {
            username: data.username || "Desconocido",
            country: data.country || "Desconocido"
          };
        }
      });

      const sessionsData = [];

      for (const docSnap of sessionSnap.docs) {
        const s = docSnap.data();
        const player = playerMap[s.playerEmail] || { username: "Desconocido", country: "Desconocido" };

        let songTitle = "Desconocida";
        let genre = "Otro";

        if (s.songId?.path || typeof s.songId === "string") {
          const ref = s.songId?.path
            ? s.songId
            : doc(db, ...s.songId.replace(/^\/+/, "").split("/"));
          const songDoc = await getDoc(ref);
          if (songDoc.exists()) {
            const song = songDoc.data();
            songTitle = song.title || "Sin título";
            genre = song.genre || "Otro";
          }
        }

        sessionsData.push({
          id: docSnap.id,
          accuracy: parseFloat(s.accuracy) || 0,
          comboMax: parseInt(s.comboMax) || 0,
          date: s.date?.toDate?.() || new Date(),
          duration: parseInt(s.duration) || 0,
          score: parseFloat(s.score) || 0,
          playerName: player.username,
          country: player.country,
          songTitle,
          genre,
          songID: s.songId?.id || ""
        });
      }

      setSessions(sessionsData);
      setSongs(songSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchData();
  }, []);

  const applyFilters = (list) => {
    return list.filter(s => {
      const validCountry = !filters.country || s.country.toLowerCase().includes(filters.country.toLowerCase());
      const validSong = !filters.songID || s.songID === filters.songID;
      const validStart = !filters.dateStart || s.date >= new Date(filters.dateStart);
      const validEnd = !filters.dateEnd || s.date <= new Date(filters.dateEnd);
      return validCountry && validSong && validStart && validEnd;
    });
  };

  const processData = () => {
    const filtered = applyFilters(sessions);

    if (chartType === "accuracy_by_country") {
      const map = {};
      filtered.forEach(s => {
        if (!map[s.country]) map[s.country] = { country: s.country, total: 0, count: 0 };
        map[s.country].total += s.accuracy;
        map[s.country].count++;
      });
      return Object.values(map).map(c => ({
        country: c.country,
        avgAccuracy: c.total / c.count
      }));
    }

    if (chartType === "score_by_song") {
      const map = {};
      filtered.forEach(s => {
        if (!map[s.songTitle]) map[s.songTitle] = { songTitle: s.songTitle, total: 0, count: 0 };
        map[s.songTitle].total += s.score;
        map[s.songTitle].count++;
      });
      return Object.values(map).map(s => ({
        songTitle: s.songTitle,
        avgScore: s.total / s.count
      }));
    }

    if (chartType === "combomax_by_user") {
      const map = {};
      filtered.forEach(s => {
        if (!map[s.playerName]) map[s.playerName] = { playerName: s.playerName, maxCombo: 0 };
        map[s.playerName].maxCombo = Math.max(map[s.playerName].maxCombo, s.comboMax);
      });
      return Object.values(map);
    }

    if (chartType === "duration_by_country") {
      const map = {};
      filtered.forEach(s => {
        if (!map[s.country]) map[s.country] = { country: s.country, totalDuration: 0 };
        map[s.country].totalDuration += s.duration;
      });
      return Object.values(map);
    }

    if (chartType === "genre_distribution") {
      const map = {};
      filtered.forEach(s => {
        if (!map[s.genre]) map[s.genre] = { genre: s.genre, count: 0 };
        map[s.genre].count++;
      });
      return Object.values(map);
    }

    return [];
  };

  const chartData = processData();

  if (loading) return <div className="text-white">Cargando datos...</div>;

  return (
    <div className="mt-10 text-white">
      <h3 className="text-2xl font-bold mb-4">Gráficas interactivas</h3>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="País"
          value={filters.country}
          onChange={e => setFilters({ ...filters, country: e.target.value })}
          className="text-black px-3 py-2 rounded-md"
        />
        <input
          type="date"
          value={filters.dateStart}
          onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
          className="text-black px-3 py-2 rounded-md"
        />
        <input
          type="date"
          value={filters.dateEnd}
          onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
          className="text-black px-3 py-2 rounded-md"
        />
        <select
          value={filters.songID}
          onChange={e => setFilters({ ...filters, songID: e.target.value })}
          className="text-black px-3 py-2 rounded-md"
        >
          <option value="">Todas las canciones</option>
          {songs.map(song => (
            <option key={song.id} value={song.id}>
              {song.title || "Sin título"}
            </option>
          ))}
        </select>
        <select
          value={chartType}
          onChange={e => setChartType(e.target.value)}
          className="text-black px-3 py-2 rounded-md"
        >
          <option value="accuracy_by_country">Precisión por país</option>
          <option value="score_by_song">Puntaje por canción</option>
          <option value="combomax_by_user">Combo máximo por usuario</option>
          <option value="duration_by_country">Duración por país</option>
          <option value="genre_distribution">Distribución por género</option>
        </select>
      </div>

      {chartData.length > 0 ? (
        chartType === "genre_distribution" ? (
          <PieChart width={500} height={300}>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="genre"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#e63946"
              label
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#2c2c2c", border: "none", borderRadius: "0.5rem" }}
              labelStyle={{ color: "#f1faee" }}
              itemStyle={{ color: "#f1faee" }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
          </PieChart>
        ) : (
          <BarChart
            width={700}
            height={300}
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            style={{ backgroundColor: '#1f1f1f', borderRadius: '1rem', padding: '1rem' }}
          >
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis
              dataKey={
                chartType.includes("country") ? "country" :
                chartType.includes("user") ? "playerName" :
                chartType.includes("song") ? "songTitle" : "genre"
              }
              stroke="#ccc"
            />
            <YAxis stroke="#ccc" />
            <Tooltip
              contentStyle={{ backgroundColor: "#2c2c2c", border: "none", borderRadius: "0.5rem" }}
              labelStyle={{ color: "#f1faee" }}
              itemStyle={{ color: "#f1faee" }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            <Bar
              dataKey={
                Object.keys(chartData[0] || {}).find(k => !["country", "playerName", "songTitle", "genre"].includes(k))
              }
              fill="#e63946"
              radius={[4, 4, 0, 0]}
              barSize={35}
            />
          </BarChart>
        )
      ) : (
        <p className="text-gray-400">No hay datos para mostrar.</p>
      )}

      <hr className="my-8 border-gray-600" />

      <h3 className="text-xl font-bold mb-2">Sesiones recientes</h3>
      <table className="w-full text-sm bg-gray-100 text-black rounded-md overflow-hidden">
        <thead className="bg-gray-300 text-black">
          <tr>
            <th className="px-3 py-2">Usuario</th>
            <th>País</th>
            <th>Canción</th>
            <th>Fecha</th>
            <th>Precisión</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {applyFilters(sessions)
            .sort((a, b) => (b.date || new Date(0)) - (a.date || new Date(0)))
            .slice(0, 10)
            .map(s => (
              <tr key={s.id} className="border-t border-gray-300">
                <td className="px-3 py-1">{s.playerName}</td>
                <td>{s.country}</td>
                <td>{s.songTitle}</td>
                <td>{s.date?.toLocaleString() || "N/A"}</td>
                <td>{s.accuracy}</td>
                <td>{s.score}</td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
