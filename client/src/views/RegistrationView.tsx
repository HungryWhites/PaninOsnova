import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { API } from "../services/api";

const RegistrationView = () => {
  const [companyType, setCompanyType] = useState("ooo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    companyName: "", inn: "", kpp: "", ogrn: "", legalAddress: "",
    actualAddress: "", bankName: "", bik: "", corrAccount: "", settlAccount: "",
    firstName: "", lastName: "", patronymic: "", position: "",
    email: "", phone: "", login: "", password: "", passwordConfirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.companyName || !form.inn || !form.firstName || !form.lastName || !form.email || !form.phone || !form.login || !form.password) {
      setError("Заполните все обязательные поля");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (companyType === "ooo" && !form.kpp) {
      setError("Для ООО необходимо указать КПП");
      return;
    }

    setLoading(true);
    try {
      await API.user.register({
        companyType, companyName: form.companyName, inn: form.inn, kpp: form.kpp,
        ogrn: form.ogrn, legalAddress: form.legalAddress, actualAddress: form.actualAddress,
        bankName: form.bankName, bik: form.bik, corrAccount: form.corrAccount, settlAccount: form.settlAccount,
        firstName: form.firstName, lastName: form.lastName, patronymic: form.patronymic,
        position: form.position, email: form.email, phone: form.phone,
        login: form.login, password: form.password,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Ошибка регистрации");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-page" style={{background: 'var(--bg-main)'}}>
        <div className="auth-container" style={{maxWidth: 600}}>
          <div className="card" style={{padding: 48, textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>&#9989;</div>
            <h2 style={{marginBottom: 12, color: 'var(--primary-dark)'}}>Заявка отправлена!</h2>
            <p style={{color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20}}>
              Ваша заявка на регистрацию компании принята. После проверки данных администратор активирует ваш аккаунт.
              Обычно это занимает 1-2 рабочих дня.
            </p>
            <p style={{color: 'var(--accent)', fontWeight: 600, marginBottom: 24}}>
              Мы свяжемся с вами по указанному email и телефону.
            </p>
            <Link to="/login" className="btn btn-primary">Перейти к входу</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{background: 'var(--bg-main)', paddingTop: 32, paddingBottom: 60}}>
      <div className="register-container" style={{width: '100%', maxWidth: 800}}>
        <div className="card register-card">
          <div className="auth-header">
            <h1>Регистрация компании</h1>
            <p>Заполните данные для создания аккаунта на B2B платформе</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="register-section">
              <h3>&#127970; Тип организации</h3>
              <p>Выберите организационно-правовую форму</p>
              <div style={{display: 'flex', gap: 12}}>
                <button type="button" className={`btn ${companyType === 'ooo' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCompanyType('ooo')}>ООО (Юридическое лицо)</button>
                <button type="button" className={`btn ${companyType === 'ip' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCompanyType('ip')}>ИП (Индивидуальный предприниматель)</button>
              </div>
            </div>

            <div className="register-section">
              <h3>&#128188; Данные компании</h3>
              <p>Юридические реквизиты организации</p>
              <div className="form-group">
                <label className="form-label">{companyType === 'ooo' ? 'Наименование ООО *' : 'Наименование ИП *'}</label>
                <input className="form-input" name="companyName" placeholder={companyType === 'ooo' ? 'ООО «Компания»' : 'ИП Иванов И.И.'} value={form.companyName} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ИНН *</label>
                  <input className="form-input" name="inn" placeholder={companyType === 'ooo' ? '10 цифр' : '12 цифр'} value={form.inn} onChange={handleChange} />
                </div>
                {companyType === 'ooo' && (
                  <div className="form-group">
                    <label className="form-label">КПП *</label>
                    <input className="form-input" name="kpp" placeholder="9 цифр" value={form.kpp} onChange={handleChange} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{companyType === 'ooo' ? 'ОГРН' : 'ОГРНИП'}</label>
                  <input className="form-input" name="ogrn" placeholder={companyType === 'ooo' ? '13 цифр' : '15 цифр'} value={form.ogrn} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Юридический адрес</label>
                <input className="form-input" name="legalAddress" placeholder="Юридический адрес компании" value={form.legalAddress} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Фактический адрес</label>
                <input className="form-input" name="actualAddress" placeholder="Фактический адрес (для доставки)" value={form.actualAddress} onChange={handleChange} />
              </div>
            </div>

            <div className="register-section">
              <h3>&#127974; Банковские реквизиты</h3>
              <p>Данные для формирования счетов</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Наименование банка</label>
                  <input className="form-input" name="bankName" placeholder="Название банка" value={form.bankName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">БИК</label>
                  <input className="form-input" name="bik" placeholder="9 цифр" value={form.bik} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Корр. счёт</label>
                  <input className="form-input" name="corrAccount" placeholder="20 цифр" value={form.corrAccount} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Расчётный счёт</label>
                  <input className="form-input" name="settlAccount" placeholder="20 цифр" value={form.settlAccount} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="register-section">
              <h3>&#128100; Контактное лицо</h3>
              <p>Данные ответственного сотрудника</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Фамилия *</label>
                  <input className="form-input" name="lastName" placeholder="Иванов" value={form.lastName} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Имя *</label>
                  <input className="form-input" name="firstName" placeholder="Иван" value={form.firstName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Отчество</label>
                  <input className="form-input" name="patronymic" placeholder="Иванович" value={form.patronymic} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Должность</label>
                  <input className="form-input" name="position" placeholder="Менеджер по закупкам" value={form.position} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" name="email" type="email" placeholder="email@company.ru" value={form.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон *</label>
                  <input className="form-input" name="phone" placeholder="+7 (999) 999-99-99" value={form.phone} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="register-section">
              <h3>&#128274; Данные для входа</h3>
              <p>Логин и пароль для доступа к платформе</p>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <input className="form-input" name="login" placeholder="Логин для входа в систему" value={form.login} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Пароль *</label>
                  <input className="form-input" name="password" type="password" placeholder="Минимум 6 символов" value={form.password} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Подтверждение пароля *</label>
                  <input className="form-input" name="passwordConfirm" type="password" placeholder="Повторите пароль" value={form.passwordConfirm} onChange={handleChange} />
                </div>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn btn-primary btn-lg" style={{width: '100%'}} type="submit" disabled={loading}>
              {loading ? 'Отправка заявки...' : 'Отправить заявку на регистрацию'}
            </button>
          </form>

          <div className="auth-footer">
            Уже есть аккаунт? <Link to="/login">Войти в систему</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationView;