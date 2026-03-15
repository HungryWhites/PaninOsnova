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
        } else if (activeTab === 'products') {
          const data = await API.admin.getProducts();
          setProducts(data.rows || data.products || (Array.isArray(data) ? data : []));
          const cats = await API.categories.getAll();
          setCategories(Array.isArray(cats) ? cats : cats.value || []);
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
    new: 'Новый', awaiting_contact: 'Ожидание связи', confirmed: 'Подтверждён',
    processing: 'В обработке', shipped: 'Отгружен', delivered: 'Доставлен', cancelled: 'Отменён',
  };
  const statusColors: any = {
    new: '#D4A853', awaiting_contact: '#FF9800', confirmed: '#2196F3',
    processing: '#673AB7', shipped: '#9C27B0', delivered: '#4CAF50', cancelled: '#F44336',
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
                          <select value={o.status} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            style={{padding: '5px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: 'white'}}>
                            <option value="new">Новый</option>
                            <option value="awaiting_contact">Ожидание связи</option>
                            <option value="confirmed">Подтверждён</option>
                            <option value="processing">В обработке</option>
                            <option value="shipped">Отгружен</option>
                            <option value="delivered">Доставлен</option>
                            <option value="cancelled">Отменён</option>
                          </select>
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
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} />
    </div>
  );
};

export default AdminView;
