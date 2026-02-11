import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { API } from "../services/api";

const LoginView = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login || !password) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      await API.auth.login({ login, password });
      navigate("/");
    } catch (e: any) {
      setError(e.message || "Ошибка авторизации");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page" style={{background: 'var(--bg-main)'}}>
      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-header">
            <div style={{fontSize: 48, marginBottom: 16}}>&#128274;</div>
            <h1>Вход в систему</h1>
            <p>Введите данные вашей учётной записи</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Логин или Email</label>
              <input
                className="form-input"
                type="text"
                placeholder="Введите логин или email"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                className="form-input"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn btn-primary btn-lg" style={{width: '100%'}} type="submit" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="auth-footer">
            Нет аккаунта? <Link to="/registration">Зарегистрировать компанию</Link>
          </div>
        </div>

        <div className="b2b-banner" style={{marginTop: 24}}>
          <div className="b2b-banner-icon">&#128188;</div>
          <div>
            <h4>Платформа для юридических лиц</h4>
            <p>Для доступа к каталогу и ценам необходима регистрация компании (ООО или ИП).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;