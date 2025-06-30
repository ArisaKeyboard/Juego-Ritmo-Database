import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";

export default function PlayerChart({ sessions }) {
  const sessionsSorted = [...sessions].sort((a, b) => a.date - b.date);

  const accuracyBySong = (() => {
    const map = {};
    sessions.forEach(s => {
      if (!map[s.songTitle]) map[s.songTitle] = { songTitle: s.songTitle, total: 0, count: 0 };
      map[s.songTitle].total += s.accuracy;
      map[s.songTitle].count++;
    });
    return Object.values(map).map(s => ({
      songTitle: s.songTitle,
      avgAccuracy: s.total / s.count
    }));
  })();

  const scoreOverTime = sessionsSorted.map(s => ({
    date: s.date.toLocaleDateString(),
    score: s.score
  }));

  return (
    <div className="my-8">
      <h3 className="text-lg font-semibold mb-2">Precisión Promedio por Canción</h3>
      <BarChart width={600} height={300} data={accuracyBySong}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="songTitle" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="avgAccuracy" fill="#82ca9d" />
      </BarChart>

      <h3 className="text-lg font-semibold mt-8 mb-2">Evolución de Puntuación</h3>
      <LineChart width={600} height={300} data={scoreOverTime}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
