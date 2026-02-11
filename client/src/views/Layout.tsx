import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { API } from "../services/api";

// Unicode icons to avoid HTML entity rendering issues
const ICONS = {
  search: '\uD83D\uDD0D',
  cart: '\uD83D\uDED2',
  user: '\uD83D\uDC64',
  pin: '\uD83D\uDCCD',
  phone: '\uD83D\uDCDE',
  email: '\u2709',
  clock: '\uD83D\uDD51',
  logout: '\uD83D\uDEAA',
};

const Layout = () => {
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await API.user.getCurrentUser();
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      const fetchCart = async () => {
        try {
          const cart = await API.cart.get();
          setCartCount(cart.count || 0);
        } catch (e) {}
      };
      fetchCart();
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    try {
      await API.auth.logout();
      setUser(null);
      setCartCount(0);
      navigate("/");
    } catch (e) {}
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return <>
    <header className="header">
      <div className="container">
        <div className="header-top">
          <div className="header-top-left">
            <span>г. Новосибирск, ул. Промышленная, д. 1</span>
            <span>Пн-Пт: 8:00 — 18:00</span>
          </div>
          <div className="header-top-right">
            <a href="mailto:info@promstroy.ru">info@promstroy.ru</a>
            <a href="tel:+73830000001" style={{color: 'var(--accent)', fontWeight: 600}}>
              +7 (383) 000-00-01
            </a>
          </div>
        </div>
        <div className="header-main">
          <Link to="/" className="header-logo">
            <div className="header-logo-icon">ПС</div>
            <div className="header-logo-text">
              <div className="header-logo-name">ПРОМСТРОЙ</div>
              <div className="header-logo-sub">B2B Платформа</div>
            </div>
          </Link>
          <form className="header-search" onSubmit={handleSearch}>
            <span className="header-search-icon">{ICONS.search}</span>
            <input
              type="text"
              placeholder="Поиск: вентиляторы, клапаны, калориферы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div className="header-actions">
            {user ? (
              <>
                <Link to="/cart" className="header-action-btn">
                  <span className="icon">{ICONS.cart}</span>
                  Корзина
                  {cartCount > 0 && <span className="header-cart-count">{cartCount}</span>}
                </Link>
                <Link to="/dashboard" className="header-action-btn">
                  <span className="icon">{ICONS.user}</span>
                  {user.firstName}
                </Link>
                <button onClick={handleLogout} className="header-action-btn" style={{background:'none',border:'none',cursor:'pointer',color:'inherit',font:'inherit',display:'flex',alignItems:'center',gap:6}}>
                  <span className="icon">{ICONS.logout}</span>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" style={{borderColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px'}}>
                  Войти
                </Link>
                <Link to="/registration" className="btn btn-primary" style={{padding: '10px 20px'}}>
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/catalog" className={location.pathname === '/catalog' ? 'active' : ''}>
            Каталог
          </Link>
          <Link to="/catalog?categoryId=1">Вентиляторы</Link>
          <Link to="/catalog?categoryId=3">Калориферы</Link>
          <Link to="/catalog?categoryId=4">Клапаны</Link>
          <Link to="/catalog?categoryId=7">Завесы</Link>
          {user && (
            <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''}>
              Заказы
            </Link>
          )}
          {user?.isSystemAdmin && (
            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
              Админ-панель
            </Link>
          )}
        </nav>
      </div>
    </header>

    <Outlet context={{ user, setUser, cartCount, setCartCount, handleLogout }} />

    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-brand-name">ПРОМСТРОЙ</div>
            <p>
              B2B платформа для оптовой торговли вентиляционной техникой и промышленным оборудованием.
              Работаем с юридическими лицами и ИП на территории РФ.
            </p>
          </div>
          <div className="footer-col">
            <h4>Каталог</h4>
            <ul>
              <li><Link to="/catalog?categoryId=1">Вентиляторы</Link></li>
              <li><Link to="/catalog?categoryId=3">Калориферы</Link></li>
              <li><Link to="/catalog?categoryId=4">Клапаны</Link></li>
              <li><Link to="/catalog?categoryId=7">Завесы</Link></li>
              <li><Link to="/catalog?categoryId=9">Электродвигатели</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Компания</h4>
            <ul>
              <li><Link to="/">О компании</Link></li>
              <li><Link to="/catalog">Каталог</Link></li>
              <li><Link to="/registration">Стать клиентом</Link></li>
              <li><Link to="/login">Личный кабинет</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Контакты</h4>
            <div className="footer-contact-item">
              <span className="icon">{ICONS.pin}</span>
              <span>г. Новосибирск, ул. Промышленная, д. 1</span>
            </div>
            <div className="footer-contact-item">
              <span className="icon">{ICONS.phone}</span>
              <span>+7 (383) 000-00-01</span>
            </div>
            <div className="footer-contact-item">
              <span className="icon">{ICONS.email}</span>
              <span>info@promstroy.ru</span>
            </div>
            <div className="footer-contact-item">
              <span className="icon">{ICONS.clock}</span>
              <span>Пн-Пт: 8:00 — 18:00</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2025 ООО ТД «ПРОМСТРОЙ». Все права защищены.</span>
          <span>B2B платформа для юридических лиц и ИП</span>
        </div>
      </div>
    </footer>
  </>;
};

export default Layout;