import React from 'react';
import {
  Route,
  Routes
} from 'react-router-dom';
import './App.css';
import Home from "./views/Home";
import Layout from "./views/Layout";
import LoginView from "./views/LoginView";
import RegistrationView from "./views/RegistrationView";
import CatalogView from "./views/CatalogView";
import ProductDetailView from "./views/ProductDetailView";
import CartView from "./views/CartView";
import DashboardView from "./views/DashboardView";
import OrdersView from "./views/OrdersView";
import AdminView from "./views/AdminView";

function App() {
  return <>
    <Routes>
      <Route path='/' element={<Layout/>}>
        <Route index element={<Home />} />
        <Route path='/login' element={<LoginView/>} />
        <Route path='/registration' element={<RegistrationView/>} />
        <Route path='/catalog' element={<CatalogView/>} />
        <Route path='/product/:id' element={<ProductDetailView/>} />
        <Route path='/cart' element={<CartView/>} />
        <Route path='/dashboard' element={<DashboardView/>} />
        <Route path='/orders' element={<OrdersView/>} />
        <Route path='/admin' element={<AdminView/>} />
      </Route>
    </Routes>
  </>;
}

export default App;
