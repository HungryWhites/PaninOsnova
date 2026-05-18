import React, { useEffect, useState, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { API, BASE_URL } from "../services/api";

const AdminView = () => {
  const context: any = useOutletContext();
  const user = context?.user;
  const [activeTab, setActiveTab] = useState('registrations');
  const [companies, setCompanies] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('buyer');
  const [inviteCompanyId, setInviteCompanyId] = useState('');
  const [companyPrices, setCompanyPrices] = useState<any[]>([]);
  const [priceCompanyId, setPriceCompanyId] = useState('');
  const [priceProductId, setPriceProductId] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [catReport, setCatReport] = useState<any>(null);

  const [productForm, setProductForm] = useState({
    name: '', slug: '', sku: '', description: '', specs: '',
    basePrice: '', wholesalePrice: '', vipPrice: '', unit: 'шт',
    minOrder: '1', stock: '0', brand: '', CategoryId: '', weight: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (activeTab === 'registrations' || activeTab === 'companies') {
          const data = await API.admin.getCompanies();
          setCompanies(Array.isArray(data) ? data : []);
        } else if (activeTab === 'orders') {
          const data = await API.admin.getOrders();
          setOrders(Array.isArray(data) ? data : []);
        } else if (activeTab === 'products' || activeTab === 'prices') {
          const data = await API.admin.getProducts();
          setProducts(data.rows || data.products || (Array.isArray(data) ? data : []));
          const cats = await API.categories.getAll();
          setCategories(Array.isArray(cats) ? cats : cats.value || []);
          if (activeTab === 'prices') {
            const comps = await API.admin.getCompanies();
            setCompanies(Array.isArray(comps) ? comps : []);
          }
        } else if (activeTab === 'employees') {
          const data = await API.admin.getInvites();
          setInvites(Array.isArray(data) ? data : []);
          const comps = await API.admin.getCompanies();
          setCompanies(Array.isArray(comps) ? comps : []);
        } else if (activeTab === 'reports') {
          const [s, c] = await Promise.all([API.admin.getReportSales(), API.admin.getReportCategories()]);
          setSalesReport(s);
          setCatReport(c);
        }
      } catch (e) {}
      setLoading(false);
    };
    if (user && user.isSystemAdmin) load();
    else setLoading(false);
  }, [activeTab, user]);

  const handleApproveCompany = async (id: number) => {
    try {
      await API.admin.updateCompany(id, { status: 'approved' });
      setCompanies(companies.map((c: any) => c.id === id ? { ...c, status: 'approved' } : c));
    } catch (e) {}
  };

  const handleRejectCompany = async (id: number) => {
    if (!window.confirm('Отклонить заявку на регистрацию?')) return;
    try {
      await API.admin.updateCompany(id, { status: 'rejected' });
      setCompanies(companies.map((c: any) => c.id === id ? { ...c, status: 'rejected' } : c));
    } catch (e) {}
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try {
      await API.admin.updateOrderStatus(id, status);
      setOrders(orders.map((o: any) => o.id === id ? { ...o, status } : o));
    } catch (e) {}
  };

  const handleProductSubmit = async () => {
    try {
      const data = {
        ...productForm,
        basePrice: parseFloat(productForm.basePrice) || 0,
        wholesalePrice: parseFloat(productForm.wholesalePrice) || null,
        vipPrice: parseFloat(productForm.vipPrice) || null,
        minOrder: parseInt(productForm.minOrder) || 1,
        stock: parseInt(productForm.stock) || 0,
        weight: parseFloat(productForm.weight) || null,
        CategoryId: parseInt(productForm.CategoryId) || null,
      };
      if (editProduct) {
        await API.admin.updateProduct(editProduct.id, data);
      } else {
        await API.admin.createProduct(data);
      }
      setShowProductForm(false);
      setEditProduct(null);
      // Reload
      const res = await API.admin.getProducts();
      setProducts(res.rows || res.products || []);
    } catch (e) {}
  };

  const handleEditProduct = (p: any) => {
    setEditProduct(p);
    setProductForm({
      name: p.name || '', slug: p.slug || '', sku: p.sku || '',
      description: p.description || '', specs: p.specs || '',
      basePrice: String(p.basePrice || ''), wholesalePrice: String(p.wholesalePrice || ''),
      vipPrice: String(p.vipPrice || ''), unit: p.unit || 'шт',
      minOrder: String(p.minOrder || 1), stock: String(p.stock || 0),
      brand: p.brand || '', CategoryId: String(p.CategoryId || ''), weight: String(p.weight || ''),
    });
    setShowProductForm(true);
  };

  const handleNewProduct = () => {
    setEditProduct(null);
    setProductForm({ name: '', slug: '', sku: '', description: '', specs: '', basePrice: '', wholesalePrice: '', vipPrice: '', unit: 'шт', minOrder: '1', stock: '0', brand: '', CategoryId: '', weight: '' });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await API.admin.deleteProduct(id);
      const res = await API.admin.getProducts();
      setProducts(res.rows || res.products || []);
    } catch (e) {}
  };

  const handleImageUpload = async (productId: number, file: File) => {
    setUploadingId(productId);
    try {
      await API.admin.uploadProductImage(productId, file);
      const res = await API.admin.getProducts();
      setProducts(res.rows || res.products || []);
    } catch (e) {}
    setUploadingId(null);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price);
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const statusLabels: any = {
    new: 'Новый', awaiting_contact: 'Ожидание связи', awaiting_invoice: 'Ожидает счёта',
    awaiting_payment: 'Ожидает оплаты', confirmed: 'Подтверждён',
    processing: 'В обработке', shipped: 'Отгружен', delivered: 'Доставлен', cancelled: 'Отменён',
  };
  const statusColors: any = {
    new: '#D4A853', awaiting_contact: '#FF9800', awaiting_invoice: '#E91E63',
    awaiting_payment: '#00BCD4', confirmed: '#2196F3',
    processing: '#673AB7', shipped: '#9C27B0', delivered: '#4CAF50', cancelled: '#F44336',
  };

  const handleGenerateInvoice = async (orderId: number) => {
    try {
      await API.admin.generateInvoice(orderId);
      setOrders(orders.map((o: any) => o.id === orderId ? { ...o, status: 'awaiting_payment' } : o));
      alert('Счёт сформирован и отправлен клиенту!');
    } catch (e: any) {
      alert(e.message || 'Ошибка формирования счёта');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) return alert('Укажите email');
    try {
      const result = await API.admin.sendInvite({
        email: inviteEmail,
        role: inviteRole,
        companyId: inviteCompanyId ? parseInt(inviteCompanyId) : undefined,
      });
      setInviteEmail('');
      alert(`Приглашение отправлено!\n${result.inviteLink || ''}`);
      const data = await API.admin.getInvites();
      setInvites(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e.message || 'Ошибка');
    }
  };

  const handleLoadCompanyPrices = async (companyId: string) => {
    setPriceCompanyId(companyId);
    if (!companyId) { setCompanyPrices([]); return; }
    try {
      const data = await API.admin.getCompanyPrices(parseInt(companyId));
      setCompanyPrices(Array.isArray(data) ? data : []);
    } catch (e) { setCompanyPrices([]); }
  };

  const handleAddCompanyPrice = async () => {
    if (!priceCompanyId || !priceProductId || !priceValue) return alert('Заполните все поля');
    try {
      await API.admin.setCompanyPrice({ companyId: parseInt(priceCompanyId), productId: parseInt(priceProductId), price: parseFloat(priceValue) });
      setPriceValue('');
      setPriceProductId('');
      handleLoadCompanyPrices(priceCompanyId);
    } catch (e: any) { alert(e.message || 'Ошибка'); }
  };

  const handleDeleteCompanyPrice = async (id: number) => {
    try {
      await API.admin.deleteCompanyPrice(id);
      handleLoadCompanyPrices(priceCompanyId);
    } catch (e) {}
  };

  if (!user || !user.isSystemAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="card auth-card" style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>&#128683;</div>
            <h2 style={{marginBottom: 12}}>Доступ запрещён</h2>
            <p className="text-muted" style={{marginBottom: 24}}>Эта страница доступна только администраторам</p>
            <Link to="/" className="btn btn-primary">На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="card">
            <h3 style={{fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 16, padding: '0 16px'}}>Администрирование</h3>
            <button className={`admin-nav-item ${activeTab === 'registrations' ? 'active' : ''}`} onClick={() => setActiveTab('registrations')}>{'\uD83D\uDCCB'} Регистрация</button>
            <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>{'\uD83D\uDCE6'} Заказы</button>
            <button className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>{'\uD83D\uDED2'} Товары</button>
            <button className={`admin-nav-item ${activeTab === 'companies' ? 'active' : ''}`} onClick={() => setActiveTab('companies')}>{'\uD83C\uDFE2'} Компании</button>
            <button className={`admin-nav-item ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>{'\uD83D\uDC65'} Сотрудники</button>
            <button className={`admin-nav-item ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>{'\uD83D\uDCB0'} Персон. цены</button>
            <button className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>{'\uD83D\uDCCA'} Отчёты</button>
          </div>
        </aside>

        <div className="admin-content">
          {/* ===== REGISTRATIONS TAB ===== */}
          {activeTab === 'registrations' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>Заявки на регистрацию</h2>
                <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>
                  {companies.filter((c: any) => c.status === 'pending').length} ожидают проверки
                </span>
              </div>
              {loading ? <div className="loading-spinner"></div> : (() => {
                const pending = companies.filter((c: any) => c.status === 'pending');
                const processed = companies.filter((c: any) => c.status !== 'pending');
                return pending.length === 0 && processed.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">{'\uD83D\uDCCB'}</div><h3>Нет заявок</h3><p>Новые заявки на регистрацию появятся здесь</p></div>
                ) : (
                  <div>
                    {pending.length > 0 && (
                      <div style={{marginBottom: 24}}>
                        <h3 style={{fontSize: 16, fontWeight: 600, color: '#FF9800', marginBottom: 12}}>{'\u23F3'} Ожидают проверки ({pending.length})</h3>
                        {pending.map((c: any) => (
                          <div key={c.id} className="card" style={{marginBottom: 12, border: '2px solid #FF9800', padding: 0, overflow: 'hidden'}}>
                            <div
                              style={{padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,152,0,0.05)'}}
                              onClick={() => setExpandedCompany(expandedCompany === c.id ? null : c.id)}
                            >
                              <div>
                                <div style={{fontWeight: 700, fontSize: 15}}>{c.companyName}</div>
                                <div style={{fontSize: 12, color: 'var(--text-secondary)', marginTop: 2}}>
                                  {c.companyType === 'ip' || c.companyType === 'IP' ? 'ИП' : 'ООО'} &bull; ИНН: {c.inn} &bull; {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <span className="badge badge-warning">На модерации</span>
                                <span style={{fontSize: 12, color: 'var(--text-secondary)'}}>{expandedCompany === c.id ? '\u25B2' : '\u25BC'}</span>
                              </div>
                            </div>
                            {expandedCompany === c.id && (
                              <div style={{padding: '0 20px 20px', borderTop: '1px solid var(--border)'}}>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16}}>
                                  <div>
                                    <h4 style={{fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10}}>{'\uD83C\uDFE2'} Реквизиты компании</h4>
                                    <div style={{fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)'}}>
                                      <div><strong>Название:</strong> {c.companyName}</div>
                                      <div><strong>Тип:</strong> {c.companyType === 'ip' || c.companyType === 'IP' ? 'ИП' : 'ООО'}</div>
                                      <div><strong>ИНН:</strong> <span style={{fontFamily: 'monospace', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: 4}}>{c.inn}</span></div>
                                      {c.kpp && <div><strong>КПП:</strong> <span style={{fontFamily: 'monospace', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: 4}}>{c.kpp}</span></div>}
                                      {c.ogrn && <div><strong>ОГРН:</strong> <span style={{fontFamily: 'monospace'}}>{c.ogrn}</span></div>}
                                      {c.legalAddress && <div><strong>Юр. адрес:</strong> {c.legalAddress}</div>}
                                      {c.actualAddress && <div><strong>Факт. адрес:</strong> {c.actualAddress}</div>}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 style={{fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10}}>{'\uD83C\uDFE6'} Банковские реквизиты</h4>
                                    <div style={{fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)'}}>
                                      {c.bankName ? <div><strong>Банк:</strong> {c.bankName}</div> : <div style={{color: '#999'}}>Банк не указан</div>}
                                      {c.bik && <div><strong>БИК:</strong> <span style={{fontFamily: 'monospace'}}>{c.bik}</span></div>}
                                      {c.corrAccount && <div><strong>Корр. счёт:</strong> <span style={{fontFamily: 'monospace', fontSize: 12}}>{c.corrAccount}</span></div>}
                                      {c.settlAccount && <div><strong>Расч. счёт:</strong> <span style={{fontFamily: 'monospace', fontSize: 12}}>{c.settlAccount}</span></div>}
                                    </div>
                                  </div>
                                </div>
                                {c.Users && c.Users.length > 0 && (
                                  <div style={{marginTop: 16}}>
                                    <h4 style={{fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10}}>{'\uD83D\uDC64'} Контактное лицо</h4>
                                    <div style={{fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)'}}>
                                      <div><strong>ФИО:</strong> {c.Users[0].lastName} {c.Users[0].firstName} {c.Users[0].patronymic || ''}</div>
                                      <div><strong>Email:</strong> {c.Users[0].email}</div>
                                      <div><strong>Телефон:</strong> {c.Users[0].phone}</div>
                                    </div>
                                  </div>
                                )}
                                <div style={{marginTop: 16, padding: '12px 16px', background: 'rgba(33,150,243,0.06)', borderRadius: 8}}>
                                  <h4 style={{fontSize: 13, fontWeight: 700, color: '#2196F3', marginBottom: 8}}>{'\uD83D\uDD0D'} Проверить компанию:</h4>
                                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                                    <a href={`https://www.rusprofile.ru/search?query=${c.inn}`} target="_blank" rel="noreferrer"
                                      style={{fontSize: 12, padding: '4px 12px', background: '#2196F3', color: 'white', borderRadius: 4, textDecoration: 'none'}}>
                                      Rusprofile
                                    </a>
                                    <a href={`https://egrul.nalog.ru/index.html?query=${c.inn}`} target="_blank" rel="noreferrer"
                                      style={{fontSize: 12, padding: '4px 12px', background: '#4CAF50', color: 'white', borderRadius: 4, textDecoration: 'none'}}>
                                      ФНС ЕГРЮЛ
                                    </a>
                                    <a href={`https://zachestnyibiznes.ru/company/ul/${c.inn}`} target="_blank" rel="noreferrer"
                                      style={{fontSize: 12, padding: '4px 12px', background: '#FF9800', color: 'white', borderRadius: 4, textDecoration: 'none'}}>
                                      За честный бизнес
                                    </a>
                                  </div>
                                </div>
                                <div style={{marginTop: 16, display: 'flex', gap: 12}}>
                                  <button className="btn btn-primary" style={{padding: '10px 28px'}} onClick={() => handleApproveCompany(c.id)}>
                                    {'\u2705'} Подтвердить регистрацию
                                  </button>
                                  <button className="btn btn-outline" style={{padding: '10px 28px', color: '#F44336', borderColor: '#F44336'}} onClick={() => handleRejectCompany(c.id)}>
                                    {'\u274C'} Отклонить
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {processed.length > 0 && (
                      <div>
                        <h3 style={{fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12}}>Обработанные заявки ({processed.length})</h3>
                        <table className="orders-table" style={{fontSize: 13}}>
                          <thead><tr><th>Компания</th><th>ИНН</th><th>Контакт</th><th>Статус</th><th>Дата</th></tr></thead>
                          <tbody>
                            {processed.map((c: any) => (
                              <tr key={c.id}>
                                <td style={{fontWeight: 600}}>{c.companyName}</td>
                                <td style={{fontFamily: 'monospace'}}>{c.inn}</td>
                                <td>{c.contactPerson}<br/><span style={{fontSize: 11, color: 'var(--text-secondary)'}}>{c.email}</span></td>
                                <td>
                                  <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                                    {c.status === 'approved' ? 'Подтверждена' : 'Отклонена'}
                                  </span>
                                </td>
                                <td>{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === 'orders' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>История заказов</h2>
                <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>{orders.length} заказов</span>
              </div>
              {loading ? <div className="loading-spinner"></div> : orders.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">&#128230;</div><h3>Нет заказов</h3><p>Заказы появятся здесь после оформления клиентами</p></div>
              ) : (
                <table className="orders-table">
                  <thead><tr><th>Номер</th><th>Клиент / Телефон</th><th>Компания</th><th>Сумма</th><th>Статус</th><th>Дата заказа</th><th>Действие</th></tr></thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o.id}>
                        <td style={{fontWeight: 700}}>&#8470;{o.orderNumber}</td>
                        <td>
                          <div style={{fontWeight: 600}}>{o.User ? `${o.User.lastName} ${o.User.firstName}` : '—'}</div>
                          <div style={{fontSize: 12, color: 'var(--text-secondary)'}}>{o.contactPhone || o.User?.phone || '—'}</div>
                        </td>
                        <td style={{fontSize: 13}}>{o.Company?.companyName || '—'}</td>
                        <td style={{fontWeight: 700}}>{formatPrice(o.totalAmount)} &#8381;</td>
                        <td>
                          <span className="badge" style={{background: statusColors[o.status] || '#666', color: '#fff', fontSize: 11}}>
                            {statusLabels[o.status] || o.status}
                          </span>
                        </td>
                        <td style={{fontSize: 13}}>{formatDate(o.createdAt)}</td>
                        <td>
                          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                            <select value={o.status} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              style={{padding: '5px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: 'white'}}>
                              <option value="new">Новый</option>
                              <option value="awaiting_contact">Ожидание связи</option>
                              <option value="awaiting_invoice">Ожидает счёта</option>
                              <option value="awaiting_payment">Ожидает оплаты</option>
                              <option value="confirmed">Подтверждён</option>
                              <option value="processing">В обработке</option>
                              <option value="shipped">Отгружен</option>
                              <option value="delivered">Доставлен</option>
                              <option value="cancelled">Отменён</option>
                            </select>
                            {(o.status === 'awaiting_invoice' || o.status === 'confirmed') && (
                              <button className="btn btn-primary" style={{fontSize: 11, padding: '4px 10px'}} onClick={() => handleGenerateInvoice(o.id)}>
                                {'\uD83D\uDCC4'} Сформировать счёт
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ===== PRODUCTS TAB ===== */}
          {activeTab === 'products' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>Товары</h2>
                <button className="btn btn-primary" onClick={handleNewProduct}>+ Добавить товар</button>
              </div>

              {showProductForm && (
                <div style={{background: 'var(--bg-main)', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid var(--border)'}}>
                  <h3 style={{fontSize: 16, fontWeight: 700, marginBottom: 16}}>{editProduct ? 'Редактировать товар' : 'Новый товар'}</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Название *</label><input className="form-control" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                    <div className="form-group"><label>Артикул (SKU) *</label><input className="form-control" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Slug (URL)</label><input className="form-control" value={productForm.slug} onChange={e => setProductForm({...productForm, slug: e.target.value})} /></div>
                    <div className="form-group"><label>Категория</label>
                      <select className="form-control" value={productForm.CategoryId} onChange={e => setProductForm({...productForm, CategoryId: e.target.value})}>
                        <option value="">— Выберите —</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>Описание</label><textarea className="form-control" rows={3} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Цена базовая *</label><input className="form-control" type="number" value={productForm.basePrice} onChange={e => setProductForm({...productForm, basePrice: e.target.value})} /></div>
                    <div className="form-group"><label>Цена оптовая</label><input className="form-control" type="number" value={productForm.wholesalePrice} onChange={e => setProductForm({...productForm, wholesalePrice: e.target.value})} /></div>
                    <div className="form-group"><label>Цена VIP</label><input className="form-control" type="number" value={productForm.vipPrice} onChange={e => setProductForm({...productForm, vipPrice: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Ед. изм.</label><input className="form-control" value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} /></div>
                    <div className="form-group"><label>Мин. заказ</label><input className="form-control" type="number" value={productForm.minOrder} onChange={e => setProductForm({...productForm, minOrder: e.target.value})} /></div>
                    <div className="form-group"><label>Остаток</label><input className="form-control" type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Бренд</label><input className="form-control" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} /></div>
                    <div className="form-group"><label>Вес (кг)</label><input className="form-control" type="number" value={productForm.weight} onChange={e => setProductForm({...productForm, weight: e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label>Характеристики (JSON)</label><textarea className="form-control" rows={2} value={productForm.specs} onChange={e => setProductForm({...productForm, specs: e.target.value})} placeholder='{"Ключ":"Значение"}' /></div>
                  <div style={{display: 'flex', gap: 12, marginTop: 16}}>
                    <button className="btn btn-primary" onClick={handleProductSubmit}>{editProduct ? 'Сохранить' : 'Создать'}</button>
                    <button className="btn btn-outline" onClick={() => { setShowProductForm(false); setEditProduct(null); }}>Отмена</button>
                  </div>
                </div>
              )}

              {loading ? <div className="loading-spinner"></div> : (
                <table className="orders-table" style={{fontSize: 13}}>
                  <thead><tr><th>Фото</th><th>Название</th><th>Артикул</th><th>Категория</th><th>Цена</th><th>Остаток</th><th>Действия</th></tr></thead>
                  <tbody>
                    {products.map((p: any) => (
                      <tr key={p.id} style={{opacity: p.isActive === false ? 0.5 : 1}}>
                        <td style={{width: 60}}>
                          {p.image ? (
                            <img src={`${BASE_URL}${p.image}`} alt="" style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 6}} />
                          ) : (
                            <div style={{width: 50, height: 50, background: 'var(--bg-main)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20}}>&#128247;</div>
                          )}
                        </td>
                        <td style={{fontWeight: 600, maxWidth: 200}}>{p.name}</td>
                        <td>{p.sku}</td>
                        <td>{p.Category?.name || '—'}</td>
                        <td style={{fontWeight: 600}}>{formatPrice(p.basePrice)} &#8381;</td>
                        <td>{p.stock}</td>
                        <td>
                          <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                            <button className="btn btn-outline" style={{fontSize: 11, padding: '4px 10px'}} onClick={() => handleEditProduct(p)}>&#9998;</button>
                            <button className="btn btn-outline" style={{fontSize: 11, padding: '4px 10px'}} onClick={() => {
                              setUploadingId(p.id);
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => { if (e.target.files[0]) handleImageUpload(p.id, e.target.files[0]); };
                              input.click();
                            }}>{uploadingId === p.id ? '...' : '&#128247;'}</button>
                            <button className="btn btn-outline" style={{fontSize: 11, padding: '4px 10px', color: '#F44336'}} onClick={() => handleDeleteProduct(p.id)}>&#128465;</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ===== COMPANIES TAB ===== */}
          {activeTab === 'companies' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>Компании</h2>
                <span style={{fontSize: 14, color: 'var(--text-secondary)'}}>{companies.length} компаний</span>
              </div>
              {loading ? <div className="loading-spinner"></div> : companies.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">&#127970;</div><h3>Нет компаний</h3></div>
              ) : (
                <table className="orders-table">
                  <thead><tr><th>Название</th><th>Тип</th><th>ИНН</th><th>Контакт</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
                  <tbody>
                    {companies.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{fontWeight: 600}}>{c.companyName}</td>
                        <td>{c.companyType === 'IP' ? 'ИП' : 'ООО'}</td>
                        <td>{c.inn}</td>
                        <td><div>{c.contactPerson}</div><div style={{fontSize: 12, color: 'var(--text-secondary)'}}>{c.phone}</div></td>
                        <td>
                          <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                            {c.status === 'approved' ? 'Подтверждена' : 'На модерации'}
                          </span>
                        </td>
                        <td>{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>
                          {c.status !== 'approved' && (
                            <button className="btn btn-primary" style={{fontSize: 12, padding: '6px 14px'}} onClick={() => handleApproveCompany(c.id)}>Подтвердить</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {/* ===== EMPLOYEES TAB ===== */}
          {activeTab === 'employees' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>{'\uD83D\uDC65'} Управление сотрудниками</h2>
              </div>

              <div style={{background: 'var(--bg-main)', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid var(--border)'}}>
                <h3 style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>Пригласить сотрудника</h3>
                <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end'}}>
                  <div className="form-group" style={{flex: 1, minWidth: 200, marginBottom: 0}}>
                    <label style={{fontSize: 12}}>Email</label>
                    <input className="form-control" type="email" placeholder="email@company.ru" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                  </div>
                  <div className="form-group" style={{minWidth: 180, marginBottom: 0}}>
                    <label style={{fontSize: 12}}>Роль</label>
                    <select className="form-control" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                      <option value="buyer">Менеджер закупок</option>
                      <option value="accountant">Бухгалтер</option>
                    </select>
                  </div>
                  <div className="form-group" style={{minWidth: 200, marginBottom: 0}}>
                    <label style={{fontSize: 12}}>Компания</label>
                    <select className="form-control" value={inviteCompanyId} onChange={(e) => setInviteCompanyId(e.target.value)}>
                      <option value="">— Выберите —</option>
                      {companies.filter((c: any) => c.status === 'approved').map((c: any) => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{padding: '10px 24px', whiteSpace: 'nowrap'}} onClick={handleSendInvite}>
                    {'\u2709\uFE0F'} Отправить приглашение
                  </button>
                </div>
              </div>

              {loading ? <div className="loading-spinner"></div> : invites.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">{'\uD83D\uDC65'}</div><h3>Нет приглашений</h3><p>Приглашения сотрудников появятся здесь</p></div>
              ) : (
                <table className="orders-table" style={{fontSize: 13}}>
                  <thead><tr><th>Email</th><th>Роль</th><th>Статус</th><th>Дата</th></tr></thead>
                  <tbody>
                    {invites.map((inv: any) => (
                      <tr key={inv.id}>
                        <td style={{fontWeight: 600}}>{inv.email}</td>
                        <td>{inv.role === 'accountant' ? 'Бухгалтер' : 'Менеджер закупок'}</td>
                        <td>
                          <span className={`badge ${inv.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.status === 'accepted' ? 'Принято' : 'Ожидает'}
                          </span>
                        </td>
                        <td>{new Date(inv.createdAt).toLocaleDateString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ===== PERSONALIZED PRICES TAB ===== */}
          {activeTab === 'prices' && (
            <div className="card" style={{padding: 28}}>
              <div className="admin-table-header">
                <h2 style={{fontSize: 20, fontWeight: 700}}>{'\uD83D\uDCB0'} Персональные цены</h2>
              </div>

              <div style={{marginBottom: 20}}>
                <label style={{fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6}}>Выберите компанию:</label>
                <select className="form-control" style={{maxWidth: 400}} value={priceCompanyId} onChange={(e) => handleLoadCompanyPrices(e.target.value)}>
                  <option value="">— Выберите компанию —</option>
                  {companies.filter((c: any) => c.status === 'approved').map((c: any) => (
                    <option key={c.id} value={c.id}>{c.companyName} (ИНН: {c.inn})</option>
                  ))}
                </select>
              </div>

              {priceCompanyId && (
                <>
                  <div style={{background: 'var(--bg-main)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid var(--border)'}}>
                    <h3 style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>Добавить спеццену</h3>
                    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end'}}>
                      <div className="form-group" style={{flex: 1, minWidth: 250, marginBottom: 0}}>
                        <label style={{fontSize: 12}}>Товар</label>
                        <select className="form-control" value={priceProductId} onChange={(e) => setPriceProductId(e.target.value)}>
                          <option value="">— Выберите товар —</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {formatPrice(p.basePrice)} {'\u20BD'}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{minWidth: 120, marginBottom: 0}}>
                        <label style={{fontSize: 12}}>Спеццена ({'\u20BD'})</label>
                        <input className="form-control" type="number" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} placeholder="0.00" />
                      </div>
                      <button className="btn btn-primary" style={{padding: '10px 20px'}} onClick={handleAddCompanyPrice}>
                        + Добавить
                      </button>
                    </div>
                  </div>

                  {companyPrices.length === 0 ? (
                    <p style={{color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 20}}>Спеццены для этой компании не заданы</p>
                  ) : (
                    <table className="orders-table" style={{fontSize: 13}}>
                      <thead><tr><th>Товар</th><th>Артикул</th><th>Базовая цена</th><th>Спеццена</th><th>Скидка</th><th></th></tr></thead>
                      <tbody>
                        {companyPrices.map((cp: any) => {
                          const basePrice = cp.Product?.basePrice || 0;
                          const discount = basePrice > 0 ? Math.round((1 - cp.price / basePrice) * 100) : 0;
                          return (
                            <tr key={cp.id}>
                              <td style={{fontWeight: 600}}>{cp.Product?.name || '—'}</td>
                              <td>{cp.Product?.sku || '—'}</td>
                              <td>{formatPrice(basePrice)} {'\u20BD'}</td>
                              <td style={{fontWeight: 700, color: '#4CAF50'}}>{formatPrice(cp.price)} {'\u20BD'}</td>
                              <td><span className="badge badge-success">-{discount}%</span></td>
                              <td><button className="btn btn-outline" style={{fontSize: 11, padding: '4px 10px', color: '#F44336'}} onClick={() => handleDeleteCompanyPrice(cp.id)}>{'\u2716'}</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== REPORTS TAB ===== */}
          {activeTab === 'reports' && (
            <div>
              {/* Sales summary */}
              <div className="card" style={{padding: 28, marginBottom: 20}}>
                <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 20}}>{'\uD83D\uDCCA'} Динамика продаж</h2>
                {loading ? <div className="loading-spinner"></div> : salesReport ? (
                  <>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24}}>
                      <div style={{background: 'rgba(33,150,243,0.08)', borderRadius: 12, padding: '20px 24px', textAlign: 'center'}}>
                        <div style={{fontSize: 28, fontWeight: 700, color: '#2196F3'}}>{salesReport.totalOrders}</div>
                        <div style={{fontSize: 13, color: 'var(--text-secondary)', marginTop: 4}}>Всего заказов</div>
                      </div>
                      <div style={{background: 'rgba(76,175,80,0.08)', borderRadius: 12, padding: '20px 24px', textAlign: 'center'}}>
                        <div style={{fontSize: 28, fontWeight: 700, color: '#4CAF50'}}>{formatPrice(salesReport.totalRevenue)} {'\u20BD'}</div>
                        <div style={{fontSize: 13, color: 'var(--text-secondary)', marginTop: 4}}>Общая выручка</div>
                      </div>
                      <div style={{background: 'rgba(212,168,83,0.08)', borderRadius: 12, padding: '20px 24px', textAlign: 'center'}}>
                        <div style={{fontSize: 28, fontWeight: 700, color: '#D4A853'}}>{formatPrice(Math.round(salesReport.avgOrder))} {'\u20BD'}</div>
                        <div style={{fontSize: 13, color: 'var(--text-secondary)', marginTop: 4}}>Средний чек</div>
                      </div>
                    </div>

                    {salesReport.sales && salesReport.sales.length > 0 && (
                      <>
                        <h3 style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>По месяцам</h3>
                        <table className="orders-table" style={{fontSize: 13}}>
                          <thead><tr><th>Месяц</th><th>Заказов</th><th>Выручка</th></tr></thead>
                          <tbody>
                            {salesReport.sales.map((s: any) => (
                              <tr key={s.month}>
                                <td style={{fontWeight: 600}}>{s.month}</td>
                                <td>{s.orderCount}</td>
                                <td style={{fontWeight: 700}}>{formatPrice(parseFloat(s.totalRevenue) || 0)} {'\u20BD'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                ) : <p style={{color: 'var(--text-secondary)'}}>Нет данных</p>}
              </div>

              {/* Categories and products */}
              <div className="card" style={{padding: 28}}>
                <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 20}}>{'\uD83C\uDFC6'} Популярные категории и товары</h2>
                {loading ? <div className="loading-spinner"></div> : catReport ? (
                  <>
                    {catReport.categories && catReport.categories.length > 0 && (
                      <div style={{marginBottom: 24}}>
                        <h3 style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>Топ категорий</h3>
                        <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                          {catReport.categories.map((c: any, idx: number) => (
                            <div key={idx} style={{background: 'var(--bg-main)', borderRadius: 10, padding: '14px 20px', minWidth: 160, flex: '1 1 160px'}}>
                              <div style={{fontWeight: 700, fontSize: 14}}>{c.name}</div>
                              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginTop: 4}}>{c.totalQty} шт. продано</div>
                              <div style={{fontSize: 13, fontWeight: 700, color: '#4CAF50', marginTop: 4}}>{formatPrice(Math.round(c.totalRevenue))} {'\u20BD'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {catReport.topProducts && catReport.topProducts.length > 0 && (
                      <>
                        <h3 style={{fontSize: 15, fontWeight: 700, marginBottom: 12}}>Топ-20 товаров</h3>
                        <table className="orders-table" style={{fontSize: 13}}>
                          <thead><tr><th>#</th><th>Товар</th><th>Артикул</th><th>Категория</th><th>Продано</th><th>Выручка</th></tr></thead>
                          <tbody>
                            {catReport.topProducts.map((p: any, idx: number) => (
                              <tr key={p.productId}>
                                <td style={{fontWeight: 700, color: 'var(--accent)'}}>{idx + 1}</td>
                                <td style={{fontWeight: 600}}>{p.name}</td>
                                <td>{p.sku}</td>
                                <td>{p.category || '—'}</td>
                                <td>{p.totalQty} шт.</td>
                                <td style={{fontWeight: 700}}>{formatPrice(Math.round(p.totalRevenue))} {'\u20BD'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                ) : <p style={{color: 'var(--text-secondary)'}}>Нет данных</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} />
    </div>
  );
};

export default AdminView;
