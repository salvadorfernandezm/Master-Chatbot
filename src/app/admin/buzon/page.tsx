"use client";
import { useState, useEffect } from "react";

export default function AdminBuzonPage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/buzon/directora')
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>ADMINISTRACION DE BUZON - VERSION LIMPIA</h1>
      {tickets.map((t) => (
        <div key={t.id} style={{ border: '1px solid black', margin: '10px', padding: '10px' }}>
          <p>Folio: {t.folio}</p>
          <p>Contenido: {t.content}</p>
          <p>Estado: {t.status}</p>
        </div>
      ))}
    </div>
  );
}