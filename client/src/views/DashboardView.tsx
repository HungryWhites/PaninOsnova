import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API } from "../services/api";

const DashboardView = () => {
  const context: any = useOutletContext();
  const user = context?.user;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await API.orders.getAll();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (e) {}
      setLoading(false);
    };
    if (user) load();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="card auth-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>&#128274;</div>
            <h2 style={{marginBottom: 12}}>Войдите в систему</h2>
            <p className="text-muted" style={{marginBottom: 24}}>Для доступа к личному кабинету необходима авторизация</p>
            <Link to="/login" className="btn btn-primary">Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  const statusLabels: any = {
    new: 'Новый', confirmed: 'Подтверждён', processing: 'В обработке',
    shipped: 'Отгружен', delivered: 'Доставлен', cancelled: 'Отменён',
  };

  const statusColors: any = {
    new: '#D4A853', confirmed: '#2196F3', processing: '#FF9800',
    shipped: '#9C27B0', delivered: '#4CAF50', cancelled: '#F44336',
  };

  const recentOrders = orders.slice(0, 5);
  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);

  return (
    <div className="container">
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title" style={{marginBottom: 8}}>Личный кабинет</h1>
            <p style={{color: 'var(--text-secondary)'}}>Добро пожаловать, {user.firstName} {user.lastName}</p>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="card dashboard-stat-card">
            <div className="stat-icon">&#128230;</div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Всего заказов</div>
          </div>
          <div className="card dashboard-stat-card">
            <div className="stat-icon">&#9201;</div>
            <div className="stat-value">{orders.filter((o: any) => ['new', 'confirmed', 'processing'].includes(o.status)).length}</div>
            <div className="stat-label">Активных</div>
          </div>
          <div className="card dashboard-stat-card">
            <div className="stat-icon">&#9989;</div>
            <div className="stat-value">{orders.filter((o: any) => o.status === 'delivered').length}</div>
            <div className="stat-label">Выполнено</div>
          </div>
          <div className="card dashboard-stat-card">
            <div className="stat-icon">&#128176;</div>
            <div className="stat-value">{formatPrice(orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0))} &#8381;</div>
            <div className="stat-label">Общая сумма</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card" style={{padding: 24}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h3 style={{fontSize: 18, fontWeight: 700, color: 'var(--primary-dark)'}}>Последние заказы</h3>
              <Link to="/orders" className="btn btn-outline" style={{fontSize: 13}}>Все заказы</Link>
            </div>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : recentOrders.length === 0 ? (
              <div className="empty-state" style={{padding: '32px 0'}}>
                <div className="empty-state-icon">&#128196;</div>
                <h3>Нет заказов</h3>
                <p>Оформите первый заказ в каталоге</p>
                <Link to="/catalog" className="btn btn-primary">Перейти в каталог</Link>
              </div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td><Link to={`/orders`}>&#8470;{order.orderNumber}</Link></td>
                      <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td style={{fontWeight: 600}}>{formatPrice(order.totalAmount)} &#8381;</td>
                      <td>
                        <span className="badge" style={{background: statusColors[order.status] || '#666', color: '#fff'}}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <div className="card" style={{padding: 24, marginBottom: 20}}>
              <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary-dark)'}}>&#128100; Профиль</h3>
              <div className="profile-info-row"><span className="profile-label">ФИО</span><span>{user.lastName} {user.firstName} {user.patronymic || ''}</span></div>
              <div className="profile-info-row"><span className="profile-label">Email</span><span>{user.email}</span></div>
              <div className="profile-info-row"><span className="profile-label">Телефон</span><span>{user.phone || '—'}</span></div>
              <div className="profile-info-row"><span className="profile-label">Роль</span><span>{user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Сотрудник'}</span></div>
            </div>

            {user.Company && (
              <div className="card" style={{padding: 24}}>
                <h3 style={{fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--primary-dark)'}}>&#127970; Компания</h3>
                <div className="profile-info-row"><span className="profile-label">Название</span><span>{user.Company.name}</span></div>
                <div className="profile-info-row"><span className="profile-label">ИНН</span><span>{user.Company.inn}</span></div>
                <div className="profile-info-row">
                  <span className="profile-label">Статус</span>
                  <span className={`badge ${user.Company.isApproved ? 'badge-success' : 'badge-warning'}`}>
                    {user.Company.isApproved ? 'Подтверждена' : 'На модерации'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
