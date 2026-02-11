import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API, BASE_URL } from "../services/api";

function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await API.categories.getAll();
        setCategories(cats);
        const prods = await API.products.getAll({ limit: 8 });
        setProducts(prods.products || []);
      } catch (e) {}
    };
    load();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiQuery.trim().length < 2) return;
    setAiLoading(true);
    try {
      const data = await API.aiSearch(aiQuery.trim());
      setAiResults(data.products || []);
    } catch (err) {
      setAiResults([]);
    }
    setAiLoading(false);
  };

  return <>
    {/* HERO */}
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div>
            <div className="hero-badge">&#9889; Официальный представитель ВКТехнология</div>
            <h1>
              Оптовые поставки<br />
              <span>вентиляционной техники</span><br />
              и оборудования
            </h1>
            <p className="hero-description">
              ООО ТД «ПРОМСТРОЙ» — комплексные поставки вентиляционного и противопожарного оборудования.
              Работаем с юридическими лицами и ИП. Склад в Новосибирске, сроки от 2 дней.
            </p>
            <div className="hero-buttons">
              <Link to="/catalog" className="btn btn-primary btn-lg">
                Перейти в каталог
              </Link>
              <Link to="/registration" className="btn btn-secondary btn-lg">
                Стать клиентом
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">1 000+</div>
                <div className="hero-stat-label">Наименований</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">500+</div>
                <div className="hero-stat-label">Клиентов</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">12</div>
                <div className="hero-stat-label">Лет на рынке</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-cards">
              <div className="hero-card">
                <div className="hero-card-icon">&#128230;</div>
                <h3>Быстрая доставка</h3>
                <p>Собственный автопарк, доставка по Новосибирску за 24 часа</p>
              </div>
              <div className="hero-card">
                <div className="hero-card-icon">&#128176;</div>
                <h3>Гибкие цены</h3>
                <p>Индивидуальные условия для каждого клиента</p>
              </div>
              <div className="hero-card">
                <div className="hero-card-icon">&#128200;</div>
                <h3>Личный менеджер</h3>
                <p>Персональное сопровождение каждого заказа</p>
              </div>
              <div className="hero-card">
                <div className="hero-card-icon">&#128274;</div>
                <h3>Надёжность</h3>
                <p>Работаем только с проверенными поставщиками</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* AI SEARCH */}
    <section className="section" style={{background: 'linear-gradient(135deg, rgba(212,168,83,0.06), rgba(26,58,92,0.04))'}}>
      <div className="container">
        <div className="section-header" style={{textAlign: 'center', display: 'block'}}>
          <h2>&#129302; Умный подбор оборудования</h2>
          <p style={{maxWidth: 600, margin: '0 auto'}}>Опишите, какое оборудование вам нужно, и система подберёт подходящие товары из каталога</p>
        </div>
        <form onSubmit={handleAiSearch} style={{maxWidth: 700, margin: '0 auto 24px', display: 'flex', gap: 12}}>
          <input
            className="form-control"
            style={{flex: 1, fontSize: 15, padding: '14px 20px'}}
            placeholder="Например: вентилятор для дымоудаления 600 градусов..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={aiLoading} style={{whiteSpace: 'nowrap', padding: '14px 28px'}}>
            {aiLoading ? 'Поиск...' : '&#128269; Найти'}
          </button>
        </form>

        {aiResults !== null && (
          <div style={{maxWidth: 700, margin: '0 auto'}}>
            {aiResults.length === 0 ? (
              <div style={{textAlign: 'center', padding: 24, color: 'var(--text-secondary)'}}>
                Ничего не найдено. Попробуйте другое описание.
              </div>
            ) : (
              <div>
                <div style={{fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16}}>
                  Найдено: <strong>{aiResults.length}</strong> товаров
                </div>
                {aiResults.slice(0, 6).map((p: any) => (
                  <Link to={`/product/${p.id}`} key={p.id} style={{textDecoration: 'none'}}>
                    <div className="card" style={{padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16, transition: 'var(--transition)'}}>
                      <div style={{width: 50, height: 50, background: 'var(--bg-main)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20}}>
                        {p.image ? <img src={`${BASE_URL}${p.image}`} alt="" style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 8}} /> : '\uD83D\uDCE6'}
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{fontWeight: 700, fontSize: 14, color: 'var(--primary-dark)'}}>{p.name}</div>
                        <div style={{fontSize: 12, color: 'var(--text-secondary)', marginTop: 2}}>{p.Category?.name} &bull; Арт: {p.sku}</div>
                      </div>
                      <div style={{fontWeight: 700, fontSize: 16, color: 'var(--primary-dark)', whiteSpace: 'nowrap'}}>
                        от {formatPrice(p.basePrice)} &#8381;
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>

    {/* B2B BANNER */}
    <section className="section" style={{paddingTop: 0}}>
      <div className="container">
        <div className="b2b-banner">
          <div className="b2b-banner-icon">&#128188;</div>
          <div>
            <h4>Платформа работает исключительно с юридическими лицами и ИП</h4>
            <p>Для просмотра персональных цен и оформления заказов необходима регистрация компании и прохождение модерации.</p>
          </div>
        </div>
      </div>
    </section>

    {/* CATEGORIES */}
    <section className="section" style={{paddingTop: 0}}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2>Категории товаров</h2>
            <p>Вентиляционное, противопожарное и энергетическое оборудование</p>
          </div>
          <Link to="/catalog" className="btn btn-outline">Все категории</Link>
        </div>
        <div className="grid-4">
          {categories.map((cat: any) => (
            <Link to={`/catalog?categoryId=${cat.id}`} key={cat.id}>
              <div className="card category-card">
                <div className="category-card-icon">{cat.image}</div>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* POPULAR PRODUCTS */}
    <section className="section" style={{background: 'white'}}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2>Популярные товары</h2>
            <p>Самые востребованные позиции нашего каталога</p>
          </div>
          <Link to="/catalog" className="btn btn-outline">Весь каталог</Link>
        </div>
        <div className="grid-4">
          {products.slice(0, 8).map((product: any) => (
            <Link to={`/product/${product.id}`} key={product.id}>
              <div className="card product-card">
                <div className="product-card-image">
                  {product.stock > 0 ? (
                    <span className="product-card-badge badge badge-success">В наличии</span>
                  ) : (
                    <span className="product-card-badge badge badge-danger">Под заказ</span>
                  )}
                  {product.image ? (
                    <img src={`${BASE_URL}${product.image}`} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  ) : (
                    <span style={{fontSize:48,opacity:0.3}}>{product.Category?.image || '\uD83D\uDCE6'}</span>
                  )}
                </div>
                <div className="product-card-body">
                  {product.Category && (
                    <div className="product-card-category">{product.Category.name}</div>
                  )}
                  <div className="product-card-title">{product.name}</div>
                  <div className="product-card-sku">Арт: {product.sku}</div>
                  <div className="product-card-footer">
                    <div className="product-card-price">
                      {product.displayPrice ? (
                        <><span className="product-card-price-from">от </span>{formatPrice(product.displayPrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                      ) : (
                        <><span className="product-card-price-from">от </span>{formatPrice(product.priceFrom || product.basePrice)} &#8381; <span className="unit">/ {product.unit}</span></>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* ADVANTAGES */}
    <section className="section advantages">
      <div className="container">
        <div className="section-header">
          <div>
            <h2>Почему выбирают нас</h2>
            <p>Преимущества работы с ТД ПРОМСТРОЙ</p>
          </div>
        </div>
        <div className="grid-4">
          <div className="advantage-card">
            <div className="advantage-icon">&#128176;</div>
            <h3>Оптовые цены</h3>
            <p>Дифференцированное ценообразование. Чем больше объём, тем выгоднее условия.</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">&#128666;</div>
            <h3>Доставка по РФ</h3>
            <p>Собственная логистика и партнёрская сеть транспортных компаний.</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">&#128101;</div>
            <h3>Сертификация</h3>
            <p>Вся продукция сертифицирована в установленном порядке РФ. Сертификаты качества и соответствия.</p>
          </div>
          <div className="advantage-card">
            <div className="advantage-icon">&#128222;</div>
            <h3>Персональный менеджер</h3>
            <p>Индивидуальный подход, гибкая система скидок, согласование деталей по телефону.</p>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="cta-section">
      <div className="container">
        <h2>Начните работу с ПРОМСТРОЙ</h2>
        <p>Зарегистрируйте свою компанию и получите доступ к оптовым ценам уже сегодня</p>
        <Link to="/registration" className="btn btn-primary btn-lg">
          Зарегистрировать компанию
        </Link>
      </div>
    </section>
  </>;
}

export default Home;