export const BASE_URL = "http://localhost:3001";

const errorHandler = async (response: Response) => {
  if (response.status !== 200) {
    const responseData = await response.json();
    throw Error(responseData.error || responseData.message || "Ошибка сервера");
  }
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

export const API = {
  auth: {
    login: async (data: { login: string; password: string }) => {
      const response = await fetch(`${BASE_URL}/auth`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
    },
    logout: async () => {
      const response = await fetch(`${BASE_URL}/auth`, {
        method: "DELETE",
        credentials: "include",
      });
      await errorHandler(response);
    },
  },
  user: {
    register: async (data: any) => {
      const response = await fetch(`${BASE_URL}/user`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    getCurrentUser: async () => {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
        method: "GET",
      });
      await errorHandler(response);
      return await response.json();
    },
    getTeam: async () => {
      const response = await fetch(`${BASE_URL}/user/team`, {
        credentials: "include",
        method: "GET",
      });
      await errorHandler(response);
      return await response.json();
    },
  },
  categories: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/categories`);
      await errorHandler(response);
      return await response.json();
    },
    getById: async (id: string | number) => {
      const response = await fetch(`${BASE_URL}/categories/${id}`);
      await errorHandler(response);
      return await response.json();
    },
  },
  products: {
    getAll: async (params: any = {}) => {
      const query = new URLSearchParams();
      if (params.categoryId) query.set("categoryId", params.categoryId);
      if (params.brand) query.set("brand", params.brand);
      if (params.search) query.set("search", params.search);
      if (params.minPrice) query.set("minPrice", params.minPrice);
      if (params.maxPrice) query.set("maxPrice", params.maxPrice);
      if (params.limit) query.set("limit", params.limit);
      if (params.offset) query.set("offset", params.offset);
      const response = await fetch(`${BASE_URL}/products?${query.toString()}`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    getById: async (id: string | number) => {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    getBrands: async () => {
      const response = await fetch(`${BASE_URL}/products/brands`);
      await errorHandler(response);
      return await response.json();
    },
  },
  cart: {
    get: async () => {
      const response = await fetch(`${BASE_URL}/cart`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    add: async (productId: number, quantity: number = 1) => {
      const response = await fetch(`${BASE_URL}/cart`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify({ productId, quantity }),
      });
      await errorHandler(response);
    },
    update: async (id: number, quantity: number) => {
      const response = await fetch(`${BASE_URL}/cart/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify({ quantity }),
      });
      await errorHandler(response);
    },
    remove: async (id: number) => {
      const response = await fetch(`${BASE_URL}/cart/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await errorHandler(response);
    },
  },
  orders: {
    create: async (data: any = {}) => {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/orders`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    getById: async (id: string | number) => {
      const response = await fetch(`${BASE_URL}/orders/${id}`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    cancel: async (id: number) => {
      const response = await fetch(`${BASE_URL}/orders/${id}/cancel`, {
        method: "PUT",
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    edit: async (id: number, data: { items?: any[]; comment?: string }) => {
      const response = await fetch(`${BASE_URL}/orders/${id}/edit`, {
        method: "PUT",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
  },
  admin: {
    getCompanies: async () => {
      const response = await fetch(`${BASE_URL}/admin/companies`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    updateCompany: async (id: number, data: any) => {
      const response = await fetch(`${BASE_URL}/admin/companies/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    getOrders: async () => {
      const response = await fetch(`${BASE_URL}/admin/orders`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    updateOrderStatus: async (id: number, status: string) => {
      const response = await fetch(`${BASE_URL}/admin/orders/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify({ status }),
      });
      await errorHandler(response);
      return await response.json();
    },
    getProducts: async () => {
      const response = await fetch(`${BASE_URL}/admin/products`, {
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    createProduct: async (data: any) => {
      const response = await fetch(`${BASE_URL}/admin/products`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    updateProduct: async (id: number, data: any) => {
      const response = await fetch(`${BASE_URL}/admin/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    deleteProduct: async (id: number) => {
      const response = await fetch(`${BASE_URL}/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await errorHandler(response);
    },
    generateInvoice: async (orderId: number) => {
      const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/invoice`, {
        method: "POST",
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    getInvites: async () => {
      const response = await fetch(`${BASE_URL}/admin/invites`, { credentials: "include" });
      await errorHandler(response);
      return await response.json();
    },
    sendInvite: async (data: { email: string; role: string; companyId?: number }) => {
      const response = await fetch(`${BASE_URL}/admin/invites`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    getCompanyPrices: async (companyId: number) => {
      const response = await fetch(`${BASE_URL}/admin/company-prices/${companyId}`, { credentials: "include" });
      await errorHandler(response);
      return await response.json();
    },
    setCompanyPrice: async (data: { companyId: number; productId: number; price: number }) => {
      const response = await fetch(`${BASE_URL}/admin/company-prices`, {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders,
        body: JSON.stringify(data),
      });
      await errorHandler(response);
      return await response.json();
    },
    deleteCompanyPrice: async (id: number) => {
      const response = await fetch(`${BASE_URL}/admin/company-prices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await errorHandler(response);
    },
    getReportSales: async () => {
      const response = await fetch(`${BASE_URL}/admin/reports/sales`, { credentials: "include" });
      await errorHandler(response);
      return await response.json();
    },
    getReportCategories: async () => {
      const response = await fetch(`${BASE_URL}/admin/reports/categories`, { credentials: "include" });
      await errorHandler(response);
      return await response.json();
    },
    uploadProductImage: async (id: number, file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`${BASE_URL}/admin/products/${id}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      await errorHandler(response);
      return await response.json();
    },
  },
  aiRecommendations: async () => {
    const response = await fetch(`${BASE_URL}/products/ai-recommendations`, {
      credentials: "include",
    });
    await errorHandler(response);
    return await response.json();
  },
  aiSearch: async (query: string) => {
    const response = await fetch(`${BASE_URL}/products/ai-search`, {
      method: "POST",
      credentials: "include",
      headers: jsonHeaders,
      body: JSON.stringify({ query }),
    });
    await errorHandler(response);
    return await response.json();
  },
};
