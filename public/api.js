const API_BASE_URL = "/api";

class APIService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("authToken", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const data = await this.makeRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (data.success && data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async login(credentials) {
    const data = await this.makeRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.success && data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return await this.makeRequest("/auth/me");
  }

  async updateNickname(nickname) {
    return await this.makeRequest("/auth/nickname", {
      method: "PUT",
      body: JSON.stringify({ nickname }),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return await this.makeRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // House methods
  async getHouseMembers() {
    return await this.makeRequest("/houses/members");
  }

  async addMember(memberData) {
    return await this.makeRequest("/houses/members", {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  }

  async deleteMember(memberId) {
    return await this.makeRequest(`/houses/members/${memberId}`, {
      method: "DELETE",
    });
  }

  // Meal methods
  async getMealEntries(year, month) {
    return await this.makeRequest(`/meals?year=${year}&month=${month}`);
  }

  async getMealStats(year, month) {
    return await this.makeRequest(`/meals/stats?year=${year}&month=${month}`);
  }

  async addMealEntry(mealData) {
    return await this.makeRequest("/meals", {
      method: "POST",
      body: JSON.stringify(mealData),
    });
  }

  async deleteMealEntry(entryId) {
    return await this.makeRequest(`/meals/${entryId}`, {
      method: "DELETE",
    });
  }

  // Expense methods
  async getExpenseEntries(year, month) {
    return await this.makeRequest(`/expenses?year=${year}&month=${month}`);
  }

  async getExpenseStats(year, month) {
    return await this.makeRequest(
      `/expenses/stats?year=${year}&month=${month}`
    );
  }

  async addExpenseEntry(expenseData) {
    return await this.makeRequest("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpenseEntry(entryId) {
    return await this.makeRequest(`/expenses/${entryId}`, {
      method: "DELETE",
    });
  }

  // Notification methods
  async getNotifications() {
    return await this.makeRequest("/notifications");
  }

  async getUnreadCount() {
    return await this.makeRequest("/notifications/unread-count");
  }

  async markAsRead(notificationId) {
    return await this.makeRequest(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllAsRead() {
    return await this.makeRequest("/notifications/mark-all-read", {
      method: "PUT",
    });
  }

  async sendManagerSwitchRequest(targetEmail, currentPassword) {
    return await this.makeRequest("/notifications/manager-switch-request", {
      method: "POST",
      body: JSON.stringify({
        targetMemberEmail: targetEmail,
        currentPassword,
      }),
    });
  }

  async handleManagerSwitchResponse(notificationId, action) {
    return await this.makeRequest("/notifications/manager-switch-response", {
      method: "POST",
      body: JSON.stringify({ notificationId, action }),
    });
  }

  logout() {
    this.clearToken();
  }
}

// Global instance
window.apiService = new APIService();
