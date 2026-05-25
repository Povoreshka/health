// src/pages/DbTest.jsx
import { useEffect, useState } from "react";
import { usersAPI } from "../api/users.api";

const DbTest = () => {
  const [status, setStatus] = useState("Проверка...");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      const usersList = await usersAPI.getAll();
      setStatus("Подключено ✅");
      setUsers(usersList);
      setError(null);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message);
      setStatus("Ошибка подключения ❌");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Проверка подключения...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Статус подключения к БД</h2>
      <p>PostgreSQL: <b>{status}</b></p>
      
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <p>Ошибка: {error}</p>
          <button onClick={testConnection}>Повторить</button>
        </div>
      )}
      
      {users.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Пользователи в базе данных:</h3>
          <ul>
            {users.map(user => (
              <li key={user.id}>
                {user.name} - Возраст: {user.age} - Пол: {user.gender === 'male' ? 'Мужской' : 'Женский'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {users.length === 0 && !error && (
        <p style={{ marginTop: "20px", color: "#666" }}>
          В базе данных пока нет пользователей. Создайте нового через онбординг.
        </p>
      )}
    </div>
  );
};

export default DbTest;