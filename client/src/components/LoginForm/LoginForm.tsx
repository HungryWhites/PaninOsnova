import { FormEvent, useState } from "react";
import styles from "./LoginForm.module.css";

export type LoginFormData = {
  login: string;
  password: string;
}

type FormProps = {
  onSubmit: (data: LoginFormData) => void;
}

export default function LoginForm({onSubmit}: FormProps) {
  const [login, setLogin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const isValid = (): boolean => {
    let result = true;

    // очищаем ошибки
    setLoginError("");

    if (!/^([a-z0-9]{6,20})$/.test(login)) {
      setLoginError("Логин должен содержать от 6 до 20 символов латинского алфавита и цифры.");
      result = false;
    }

    if (login.length === 0) {
      setLoginError("Логин не может быть пустым.");
      result = false;
    }

    setPasswordError("");

    if (password.length === 0) {
      setPasswordError("Пароль не может быть пустым.");
      result = false;
    }

    return result;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValid()) {
      onSubmit({
        login,
        password
      });
    }
  };

  return <>
    <h3>Логин</h3>
    <form onSubmit={handleSubmit}>
      <div>
        <label>Логин:
          <input value={login} onChange={e => setLogin(e.target.value)}/>
        </label>
        {loginError && <div className={styles.error}>
          {loginError}
        </div>}
      </div>
      <div>
        <label>Пароль:
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
        </label>
        {passwordError && <div className={styles.error}>
          {passwordError}
        </div>}
      </div>
      <button type="submit">Войти</button>
    </form>
  </>;
}