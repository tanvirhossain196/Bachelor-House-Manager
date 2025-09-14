// API Service instance
const API = window.apiService;

class HouseApp {
  constructor() {
    this.currentUser = null;
    this.houseMembers = [];
    this.currentMonth = new Date().toLocaleString("default", { month: "long" });
    this.currentYear = new Date().getFullYear();
    this.months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupModals();
    this.setupNav();
    this.loadCurrentUser();
    this.hideLoading();
  }

  setupEventListeners() {
    // Auth switches
    document
      .getElementById("switchToRegister")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.switchForm("register");
      });
    document.getElementById("switchToLogin").addEventListener("click", (e) => {
      e.preventDefault();
      this.switchForm("login");
    });

    // Role change for register
    document.querySelectorAll('input[name="regRole"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        document.getElementById("houseCodeGroup").style.display =
          e.target.value === "member" ? "block" : "none";
      });
    });

    // Login and Register
    document
      .getElementById("loginBtn")
      .addEventListener("click", () => this.login());
    document
      .getElementById("registerBtn")
      .addEventListener("click", () => this.register());
    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.logout());

    // Month/Year change
    document.getElementById("monthSelector").addEventListener("change", (e) => {
      this.currentMonth = e.target.value;
      this.updateAll();
    });
    document.getElementById("yearSelector").addEventListener("change", (e) => {
      this.currentYear = parseInt(e.target.value);
      this.updateAll();
    });

    // Quick actions
    document
      .getElementById("quickAddMeal")
      .addEventListener("click", () => this.openModal("addMealModal"));
    document
      .getElementById("quickAddExpense")
      .addEventListener("click", () => this.openModal("addExpenseModal"));
    document
      .getElementById("quickManageMembers")
      .addEventListener("click", () => this.showSection("members"));
    document
      .getElementById("quickGenerateReport")
      .addEventListener("click", () => this.showSection("reports"));

    // Add entries
    document
      .getElementById("addMealEntryBtn")
      .addEventListener("click", () => this.addMealEntry());
    document
      .getElementById("addExpenseEntryBtn")
      .addEventListener("click", () => this.addExpenseEntry());

    // Members
    document
      .getElementById("addMemberBtn")
      .addEventListener("click", () => this.openModal("addMemberModal"));
    document
      .getElementById("addMemberEntryBtn")
      .addEventListener("click", () => this.addMember());

    // Profile
    document
      .getElementById("editNicknameBtn")
      .addEventListener("click", () => this.openEditNickname());
    document
      .getElementById("changePasswordBtn")
      .addEventListener("click", () => this.openModal("changePasswordModal"));
    document
      .getElementById("updateNicknameBtn")
      .addEventListener("click", () => this.updateNickname());
    document
      .getElementById("updatePassBtn")
      .addEventListener("click", () => this.changePassword());

    // Section buttons
    document
      .getElementById("addMealBtn")
      .addEventListener("click", () => this.openModal("addMealModal"));
    document
      .getElementById("addExpenseBtn")
      .addEventListener("click", () => this.openModal("addExpenseModal"));
    document
      .getElementById("exportPDFBtn")
      .addEventListener("click", () => this.exportPDF());

    // Manager Switch
    document
      .getElementById("confirmSwitchBtn")
      .addEventListener("click", () => this.confirmManagerSwitch());

    // Notifications
    document
      .getElementById("markAllReadBtn")
      .addEventListener("click", () => this.markAllNotificationsRead());
    document
      .getElementById("notificationBadge")
      .addEventListener("click", () => this.showSection("notifications"));
  }

  setupModals() {
    document.querySelectorAll(".modal .close").forEach((close) => {
      close.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        modal.style.display = "none";
      });
    });

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
      }
    });
  }

  setupNav() {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute("href").substring(1);
        this.showSection(sectionId);
      });
    });
  }

  async loadCurrentUser() {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      try {
        API.setToken(savedToken);
        const response = await API.getCurrentUser();

        if (response.success) {
          this.currentUser = response.user;
          await this.loadHouseData();

          document.querySelector(".auth-section").style.display = "none";
          document.querySelector(".main-app").style.display = "block";

          this.setupMonthYearSelectors();
          this.updateAll();
          this.showRoleSpecificElements();
          this.updateNotificationBadge();
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        this.logout();
      }
    }
  }

  async loadHouseData() {
    try {
      const response = await API.getHouseMembers();
      if (response.success) {
        this.houseMembers = response.members;
      }
    } catch (error) {
      console.error("Failed to load house data:", error);
    }
  }

  showRoleSpecificElements() {
    if (this.currentUser.role === "manager") {
      document.getElementById("addMemberBtn").style.display = "inline-flex";
      document.getElementById("quickManageMembers").style.display =
        "inline-flex";
      document.getElementById("houseCodeBadge").textContent =
        this.currentUser.houseCode;
      document.getElementById("houseCodeBadge").style.display = "inline-block";
    }
  }

  switchForm(form) {
    document
      .getElementById("loginForm")
      .classList.toggle("active", form === "login");
    document
      .getElementById("registerForm")
      .classList.toggle("active", form === "register");
  }

  async login() {
    const role = document.querySelector('input[name="role"]:checked').value;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await API.login({ email, password, role });

      if (response.success) {
        this.currentUser = response.user;
        await this.loadHouseData();

        document.querySelector(".auth-section").style.display = "none";
        document.querySelector(".main-app").style.display = "block";

        this.setupMonthYearSelectors();
        this.updateAll();
        this.showRoleSpecificElements();
        this.updateNotificationBadge();

        this.showToast("success", response.message);
      }
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async register() {
    const role = document.querySelector('input[name="regRole"]:checked').value;
    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;
    const houseCode = document.getElementById("regHouseCode").value.trim();

    try {
      const userData = { email, fullName, phone, password, role };
      if (role === "member" && houseCode) {
        userData.houseCode = houseCode;
      }

      const response = await API.register(userData);

      if (response.success) {
        this.showToast("success", response.message);
        this.switchForm("login");
      }
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  logout() {
    API.logout();
    this.currentUser = null;
    this.houseMembers = [];
    document.querySelector(".main-app").style.display = "none";
    document.querySelector(".auth-section").style.display = "flex";
    this.switchForm("login");
    this.showToast("success", "Logged out successfully!");
  }

  setupMonthYearSelectors() {
    const monthSelect = document.getElementById("monthSelector");
    monthSelect.innerHTML = this.months
      .map(
        (m) =>
          `<option ${m === this.currentMonth ? "selected" : ""}>${m}</option>`
      )
      .join("");
    const yearSelect = document.getElementById("yearSelector");
    yearSelect.innerHTML = `<option>${this.currentYear}</option><option>${
      this.currentYear + 1
    }</option>`;
    yearSelect.value = this.currentYear;
  }

  async updateAll() {
    await Promise.all([
      this.renderDashboard(),
      this.renderMembers(),
      this.renderMeals(),
      this.renderExpenses(),
      this.renderProfile(),
      this.renderReports(),
      this.renderNotifications(),
    ]);
    this.updateUserInfo();
    this.updateNotificationBadge();
  }

  updateUserInfo() {
    document.getElementById("userName").textContent = this.currentUser.fullName;
    document.getElementById("userRole").textContent = this.currentUser.role;
  }

  showSection(sectionId) {
    document
      .querySelectorAll(".section")
      .forEach((sec) => sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.remove("active"));
    document
      .querySelector(`.nav-link[href="#${sectionId}"]`)
      .classList.add("active");

    // Load data when switching sections
    if (sectionId === "dashboard") this.renderDashboard();
    if (sectionId === "members") this.renderMembers();
    if (sectionId === "meals") this.renderMeals();
    if (sectionId === "expenses") this.renderExpenses();
    if (sectionId === "reports") this.renderReports();
    if (sectionId === "profile") this.renderProfile();
    if (sectionId === "notifications") this.renderNotifications();
  }

  async renderDashboard() {
    try {
      const monthIndex = this.months.indexOf(this.currentMonth) + 1;

      // Get meal and expense stats
      const [mealStats, expenseStats] = await Promise.all([
        API.getMealStats(this.currentYear, monthIndex),
        API.getExpenseStats(this.currentYear, monthIndex),
      ]);

      // Update statistics
      const totalBazar = expenseStats.success
        ? expenseStats.stats.totalExpenses
        : 0;
      const totalMeals = mealStats.success ? mealStats.stats.totalMeals : 0;
      const mealRate =
        totalMeals > 0 ? (totalBazar / totalMeals).toFixed(2) : 0;
      const activeMembers = this.houseMembers.filter(
        (m) => m.role !== "manager"
      ).length;

      document.getElementById(
        "totalBazar"
      ).textContent = `৳${totalBazar.toLocaleString()}`;
      document.getElementById("totalMeals").textContent = totalMeals.toFixed(1);
      document.getElementById("mealRate").textContent = `৳${mealRate}`;
      document.getElementById("totalMembers").textContent = activeMembers;

      // Generate balance summary
      await this.generateSummary();
    } catch (error) {
      console.error("Error rendering dashboard:", error);
    }
  }

  async generateSummary() {
    try {
      const tbody = document.getElementById("balanceTableBody");
      tbody.innerHTML = "";

      const monthIndex = this.months.indexOf(this.currentMonth) + 1;
      const [mealStats, expenseStats] = await Promise.all([
        API.getMealStats(this.currentYear, monthIndex),
        API.getExpenseStats(this.currentYear, monthIndex),
      ]);

      const totalBazar = expenseStats.success
        ? expenseStats.stats.totalExpenses
        : 0;
      const totalMeals = mealStats.success ? mealStats.stats.totalMeals : 0;
      const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;

      // Create member stats map
      const memberMealStats = {};
      const memberExpenseStats = {};

      if (mealStats.success) {
        mealStats.stats.memberStats.forEach((stat) => {
          memberMealStats[stat.member._id] = stat.totalMeals;
        });
      }

      if (expenseStats.success) {
        expenseStats.stats.memberStats.forEach((stat) => {
          memberExpenseStats[stat.member._id] = stat.totalExpenses;
        });
      }

      this.houseMembers.forEach((member) => {
        const memberMeals = memberMealStats[member._id] || 0;
        const memberExpenses = memberExpenseStats[member._id] || 0;
        const mealCost = memberMeals * perMealCost;
        const balance = memberExpenses - mealCost;
        const status = balance > 0 ? "Give" : balance < 0 ? "Pay" : "Settled";

        const row = `
          <tr>
            <td><strong>${member.nickname || member.fullName}</strong></td>
            <td>${memberMeals.toFixed(1)}</td>
            <td>৳${memberExpenses.toLocaleString()}</td>
            <td>৳${mealCost.toFixed(2)}</td>
            <td class="${
              balance >= 0 ? "positive-balance" : "negative-balance"
            }">
              ${balance >= 0 ? "+" : ""}৳${balance.toFixed(2)}
            </td>
            <td><span class="status-${status.toLowerCase()}">${status}</span></td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", row);
      });
    } catch (error) {
      console.error("Error generating summary:", error);
    }
  }

  async renderMembers() {
    try {
      await this.loadHouseData(); // Refresh member data

      const grid = document.getElementById("membersGrid");
      grid.innerHTML = "";

      for (const member of this.houseMembers) {
        const card = document.createElement("div");
        card.className = `member-card ${
          member.role === "manager" ? "manager" : ""
        }`;
        card.onclick = () => this.showMemberDetails(member);

        // Get member stats
        const monthIndex = this.months.indexOf(this.currentMonth) + 1;
        const [mealStats, expenseStats] = await Promise.all([
          API.getMealStats(this.currentYear, monthIndex),
          API.getExpenseStats(this.currentYear, monthIndex),
        ]);

        let memberMeals = 0;
        let memberExpenses = 0;

        if (mealStats.success) {
          const memberStat = mealStats.stats.memberStats.find(
            (s) => s.member._id === member._id
          );
          memberMeals = memberStat ? memberStat.totalMeals : 0;
        }

        if (expenseStats.success) {
          const memberStat = expenseStats.stats.memberStats.find(
            (s) => s.member._id === member._id
          );
          memberExpenses = memberStat ? memberStat.totalExpenses : 0;
        }

        const totalBazar = expenseStats.success
          ? expenseStats.stats.totalExpenses
          : 0;
        const totalMeals = mealStats.success ? mealStats.stats.totalMeals : 0;
        const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;
        const mealCost = memberMeals * perMealCost;
        const balance = memberExpenses - mealCost;

        card.innerHTML = `
          ${
            member.role === "manager"
              ? '<div class="manager-badge">Manager</div>'
              : ""
          }
          <div class="member-header">
            <div class="member-avatar">${member.fullName.charAt(0)}</div>
            <div class="member-info">
              <h3>${member.nickname || member.fullName}</h3>
              ${
                member.nickname
                  ? `<div class="member-nickname">${member.fullName}</div>`
                  : ""
              }
              <span class="member-role">${member.role}</span>
            </div>
          </div>
          <p><strong>Balance:</strong> <span class="${
            balance >= 0 ? "positive-balance" : "negative-balance"
          }">৳${balance.toFixed(2)}</span></p>
          <p><strong>Meals:</strong> ${memberMeals.toFixed(1)}</p>
          <p><strong>Expenses:</strong> ৳${memberExpenses.toLocaleString()}</p>
          ${
            this.currentUser.role === "manager" && member.role !== "manager"
              ? `
            <div class="member-actions" onclick="event.stopPropagation();">
              <button class="btn-warning" onclick="houseApp.openManagerSwitch('${member.email}')">
                <i class="fas fa-crown"></i> Make Manager
              </button>
              <button class="btn-danger" onclick="houseApp.deleteMember('${member._id}')">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          `
              : ""
          }
        `;
        grid.appendChild(card);
      }
    } catch (error) {
      console.error("Error rendering members:", error);
    }
  }

  async renderMeals() {
    try {
      const monthYear = document.getElementById("mealMonthYear");
      monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;

      const monthIndex = this.months.indexOf(this.currentMonth) + 1;
      const response = await API.getMealEntries(this.currentYear, monthIndex);

      if (response.success) {
        this.renderMealTable(response.mealEntries);
      }
    } catch (error) {
      console.error("Error rendering meals:", error);
    }
  }

  renderMealTable(mealEntries) {
    const thead = document.getElementById("mealsTableHead");
    const tbody = document.getElementById("mealsTableBody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    let headerRow = "<tr><th>Date</th><th>Day</th><th>Bazar Person</th>";
    this.houseMembers.forEach(
      (m) => (headerRow += `<th>${m.nickname || m.fullName}</th>`)
    );
    headerRow += "<th>Actions</th></tr>";
    thead.innerHTML = headerRow;

    const sortedEntries = mealEntries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const dayName = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const bazarPersonName =
        entry.bazarPerson.nickname || entry.bazarPerson.fullName;

      let row = `
        <tr>
          <td>${this.formatDate(entry.date)}</td>
          <td><span class="day-cell day-${dayName}">${date.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      )}</span></td>
          <td><span class="bazar-person">${bazarPersonName}</span></td>
      `;

      this.houseMembers.forEach((member) => {
        const memberMeal = entry.meals.find(
          (meal) => meal.member._id === member._id
        );
        const mealCount = memberMeal ? memberMeal.count : 0;
        row += `<td><span class="meal-count ${
          mealCount === 0 ? "zero" : ""
        }">${mealCount}</span></td>`;
      });

      row += `
        <td>
          <button class="btn-danger" onclick="houseApp.deleteMealEntry('${entry._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  }

  async deleteMealEntry(id) {
    if (confirm("Are you sure?")) {
      try {
        await API.deleteMealEntry(id);
        this.showToast("success", "Meal entry deleted successfully!");
        this.renderMeals();
        this.updateAll();
      } catch (error) {
        this.showToast("error", "Failed to delete meal entry");
      }
    }
  }

  async renderExpenses() {
    try {
      const monthYear = document.getElementById("expenseMonthYear");
      monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;

      const monthIndex = this.months.indexOf(this.currentMonth) + 1;
      const [entriesResponse, statsResponse] = await Promise.all([
        API.getExpenseEntries(this.currentYear, monthIndex),
        API.getExpenseStats(this.currentYear, monthIndex),
      ]);

      if (entriesResponse.success) {
        this.renderExpenseTable(entriesResponse.expenseEntries);
      }

      if (statsResponse.success) {
        this.updateExpenseStats(statsResponse.stats);
      }
    } catch (error) {
      console.error("Error rendering expenses:", error);
    }
  }

  renderExpenseTable(expenseEntries) {
    const thead = document.getElementById("expensesTableHead");
    const tbody = document.getElementById("expensesTableBody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    let headerRow = "<tr><th>Date</th><th>Description</th>";
    this.houseMembers.forEach(
      (m) => (headerRow += `<th>${m.nickname || m.fullName}</th>`)
    );
    headerRow += "<th>Total</th><th>Actions</th></tr>";
    thead.innerHTML = headerRow;

    const sortedEntries = expenseEntries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedEntries.forEach((entry) => {
      let row = `
        <tr>
          <td>${this.formatDate(entry.date)}</td>
          <td><span class="expense-desc">${entry.description}</span></td>
      `;

      this.houseMembers.forEach((member) => {
        const memberExpense = entry.expenses.find(
          (exp) => exp.member._id === member._id
        );
        const expense = memberExpense ? memberExpense.amount : 0;
        row += `<td>৳${expense.toLocaleString()}</td>`;
      });

      row += `
        <td><strong>৳${entry.totalAmount.toLocaleString()}</strong></td>
        <td>
          <button class="btn-danger" onclick="houseApp.deleteExpenseEntry('${
            entry._id
          }')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  }

  updateExpenseStats(stats) {
    document.getElementById(
      "todayExpenses"
    ).textContent = `৳${stats.todayExpenses.toLocaleString()}`;
    document.getElementById(
      "weekExpenses"
    ).textContent = `৳${stats.weekExpenses.toLocaleString()}`;
    document.getElementById(
      "monthExpenses"
    ).textContent = `৳${stats.totalExpenses.toLocaleString()}`;
  }

  async deleteExpenseEntry(id) {
    if (confirm("Are you sure?")) {
      try {
        await API.deleteExpenseEntry(id);
        this.showToast("success", "Expense entry deleted successfully!");
        this.renderExpenses();
        this.updateAll();
      } catch (error) {
        this.showToast("error", "Failed to delete expense entry");
      }
    }
  }

  async renderNotifications() {
    try {
      const response = await API.getNotifications();

      if (response.success) {
        this.displayNotifications(response.notifications);
      }
    } catch (error) {
      console.error("Error rendering notifications:", error);
    }
  }

  displayNotifications(notifications) {
    const container = document.getElementById("notificationsContainer");

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="member-details">
          <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-bell-slash" style="font-size: 3rem; color: var(--text-color); opacity: 0.5; margin-bottom: 1rem;"></i>
            <h3>No Notifications</h3>
            <p>You don't have any notifications yet.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications
      .map((notification) => {
        const sender = notification.from;
        const senderName = sender
          ? sender.nickname || sender.fullName
          : "Unknown";

        return `
        <div class="notification-item ${!notification.read ? "unread" : ""} ${
          notification.type === "manager_request" ? "manager-request" : ""
        }">
          <div class="notification-header">
            <span class="notification-title">${notification.title}</span>
            <span class="notification-time">${this.formatDate(
              notification.createdAt
            )}</span>
          </div>
          <div class="notification-message">
            ${notification.message}
            ${notification.from ? `<br><small>From: ${senderName}</small>` : ""}
          </div>
          ${
            notification.type === "manager_request"
              ? `
            <div class="notification-actions">
              <button class="btn-primary" onclick="houseApp.approveManagerSwitch('${notification._id}')">
                <i class="fas fa-check"></i> Accept
              </button>
              <button class="btn-danger" onclick="houseApp.rejectManagerSwitch('${notification._id}')">
                <i class="fas fa-times"></i> Reject
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");
  }

  async approveManagerSwitch(notificationId) {
    try {
      await API.handleManagerSwitchResponse(notificationId, "approve");
      this.showToast("success", "You are now a Manager!");
      await this.loadCurrentUser(); // Refresh user data
      this.renderNotifications();
      this.updateAll();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async rejectManagerSwitch(notificationId) {
    try {
      await API.handleManagerSwitchResponse(notificationId, "reject");
      this.showToast("success", "Manager switch request rejected.");
      this.renderNotifications();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async markAllNotificationsRead() {
    try {
      await API.markAllAsRead();
      this.showToast("success", "All notifications marked as read.");
      this.renderNotifications();
      this.updateNotificationBadge();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async updateNotificationBadge() {
    try {
      const response = await API.getUnreadCount();
      if (response.success) {
        const unreadCount = response.unreadCount;
        const badge = document.getElementById("notificationBadge");
        const navCount = document.getElementById("navNotificationCount");
        const notificationCount = document.getElementById("notificationCount");

        if (unreadCount > 0) {
          badge.style.display = "block";
          document.getElementById("notificationLink").style.display = "flex";
          notificationCount.textContent = unreadCount;
          navCount.textContent = unreadCount;
        } else {
          badge.style.display = "none";
          navCount.textContent = "0";
        }
      }
    } catch (error) {
      console.error("Error updating notification badge:", error);
    }
  }

  async renderProfile() {
    if (this.currentUser) {
      document.getElementById("profileName").textContent =
        this.currentUser.fullName;
      document.getElementById("profileNickname").textContent =
        this.currentUser.nickname || "Not set";
      document.getElementById("profileEmail").textContent =
        this.currentUser.email;
      document.getElementById("profilePhone").textContent =
        this.currentUser.phone;
      document.getElementById("profileRole").textContent =
        this.currentUser.role.toUpperCase();
      document.getElementById("profileJoined").textContent = this.formatDate(
        this.currentUser.createdAt
      );
    }
  }

  async renderReports() {
    try {
      const monthYear = document.getElementById("reportMonthYear");
      monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;

      const monthIndex = this.months.indexOf(this.currentMonth) + 1;
      const [mealStats, expenseStats] = await Promise.all([
        API.getMealStats(this.currentYear, monthIndex),
        API.getExpenseStats(this.currentYear, monthIndex),
      ]);

      this.generateReport(mealStats, expenseStats);
    } catch (error) {
      console.error("Error rendering reports:", error);
    }
  }

  generateReport(mealStats, expenseStats) {
    const content = document.getElementById("reportContent");
    const allMembers = this.houseMembers;
    const membersOnly = allMembers.filter(
      (member) => member.role !== "manager"
    );
    const totalBazar = expenseStats.success
      ? expenseStats.stats.totalExpenses
      : 0;
    const totalMeals = mealStats.success ? mealStats.stats.totalMeals : 0;
    const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;

    let reportHtml = `
      <div class="member-details">
        <h4>Monthly Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Total Members</label>
            <span>${membersOnly.length}</span>
          </div>
          <div class="detail-item">
            <label>Total Meals</label>
            <span>${totalMeals.toFixed(1)}</span>
          </div>
          <div class="detail-item">
            <label>Total Bazar</label>
            <span>৳${totalBazar.toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Meal Rate</label>
            <span>৳${perMealCost.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div class="table-container">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Meals</th>
              <th>Meal Bill</th>
              <th>Given</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    allMembers.forEach((member) => {
      const memberMealStat = mealStats.success
        ? mealStats.stats.memberStats.find((s) => s.member._id === member._id)
        : null;
      const memberExpenseStat = expenseStats.success
        ? expenseStats.stats.memberStats.find(
            (s) => s.member._id === member._id
          )
        : null;

      const memberMeals = memberMealStat ? memberMealStat.totalMeals : 0;
      const memberExpenses = memberExpenseStat
        ? memberExpenseStat.totalExpenses
        : 0;
      const mealBill = memberMeals * perMealCost;
      const balance = memberExpenses - mealBill;
      const status = balance > 0 ? "Give" : balance < 0 ? "Pay" : "Settled";

      reportHtml += `
        <tr>
          <td><strong>${member.nickname || member.fullName}</strong>
            ${
              member.role === "manager"
                ? ' <span class="manager-badge">Manager</span>'
                : ""
            }
          </td>
          <td>${memberMeals.toFixed(1)}</td>
          <td>৳${mealBill.toFixed(2)}</td>
          <td>৳${memberExpenses.toLocaleString()}</td>
          <td class="${
            balance >= 0 ? "positive-balance" : "negative-balance"
          }">৳${Math.abs(balance).toFixed(2)}</td>
          <td><span class="status-${status.toLowerCase()}">${status}</span></td>
        </tr>
      `;
    });

    reportHtml += `
          </tbody>
        </table>
      </div>
    `;

    content.innerHTML = reportHtml;
  }

  // Manager Switch Functions
  openManagerSwitch(memberEmail) {
    const member = this.houseMembers.find((m) => m.email === memberEmail);
    if (!member) return;

    document.getElementById("currentManagerEmail").value =
      this.currentUser.email;
    document.getElementById("newManagerName").value =
      member.nickname || member.fullName;
    document.getElementById("currentManagerPassword").value = "";
    this.targetMemberEmail = memberEmail;

    this.openModal("managerSwitchModal");
  }

  async confirmManagerSwitch() {
    const currentPassword = document.getElementById(
      "currentManagerPassword"
    ).value;

    if (!currentPassword) {
      this.showToast("error", "Please enter your password!");
      return;
    }

    try {
      await API.sendManagerSwitchRequest(
        this.targetMemberEmail,
        currentPassword
      );
      this.closeModal("managerSwitchModal");
      this.showToast("success", "Manager switch request sent!");
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async deleteMember(memberId) {
    if (confirm("Are you sure you want to delete this member?")) {
      try {
        await API.deleteMember(memberId);
        this.showToast("success", "Member deleted successfully.");
        await this.loadHouseData();
        this.renderMembers();
        this.updateAll();
      } catch (error) {
        this.showToast("error", error.message);
      }
    }
  }

  showMemberDetails(member) {
    const modal = document.getElementById("memberDetailModal");
    const title = document.getElementById("memberDetailTitle");
    const content = document.getElementById("memberDetailContent");

    title.textContent = member.nickname || member.fullName;

    // This would need API calls to get member-specific stats
    // For now, showing basic info
    content.innerHTML = `
      <div class="member-details">
        <h4>Personal Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Full Name</label>
            <span>${member.fullName}</span>
          </div>
          <div class="detail-item">
            <label>Nickname</label>
            <span>${member.nickname || "Not set"}</span>
          </div>
          <div class="detail-item">
            <label>Role</label>
            <span>${member.role}</span>
          </div>
          <div class="detail-item">
            <label>Member Since</label>
            <span>${this.formatDate(member.createdAt)}</span>
          </div>
          ${
            this.currentUser.email === member.email ||
            this.currentUser.role === "manager"
              ? `
            <div class="detail-item">
              <label>Email</label>
              <span>${member.email}</span>
            </div>
            <div class="detail-item">
              <label>Phone</label>
              <span>${member.phone}</span>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    modal.style.display = "block";
  }

  openEditNickname() {
    document.getElementById("editNickname").value =
      this.currentUser.nickname || "";
    this.openModal("editNicknameModal");
  }

  async updateNickname() {
    try {
      const nickname = document.getElementById("editNickname").value.trim();
      await API.updateNickname(nickname);

      this.currentUser.nickname = nickname;
      this.showToast("success", "Nickname updated!");
      this.closeModal("editNicknameModal");
      this.renderProfile();
      this.updateAll();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async changePassword() {
    try {
      const currentPassword = document.getElementById("currentPass").value;
      const newPassword = document.getElementById("newPass").value;
      const confirmPassword = document.getElementById("confirmPass").value;

      if (newPassword !== confirmPassword) {
        this.showToast("error", "Passwords do not match.");
        return;
      }

      await API.changePassword(currentPassword, newPassword);
      this.closeModal("changePasswordModal");
      this.showToast("success", "Password changed!");

      // Clear form
      document.getElementById("currentPass").value = "";
      document.getElementById("newPass").value = "";
      document.getElementById("confirmPass").value = "";
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  openModal(id) {
    if (id === "addMealModal" || id === "addExpenseModal") {
      this.renderFormInputs(id);
    }
    if (id === "addMemberModal") {
      document.getElementById("addTempPass").value = Math.random()
        .toString(36)
        .substring(2, 10);
    }
    document.getElementById(id).style.display = "block";
  }

  closeModal(id) {
    document.getElementById(id).style.display = "none";
  }

  renderFormInputs(modalId) {
    const bazarSelect = document.getElementById("bazarPerson");
    bazarSelect.innerHTML =
      '<option value="">Select Member</option>' +
      this.houseMembers
        .map(
          (m) => `<option value="${m._id}">${m.nickname || m.fullName}</option>`
        )
        .join("");

    if (modalId === "addMealModal") {
      const container = document.getElementById("mealMembers");
      container.innerHTML = this.houseMembers
        .map(
          (m) => `
        <div class="input-group">
          <label for="meal_${m._id}">${m.nickname || m.fullName}</label>
          <input type="number" id="meal_${m._id}" step="0.5" min="0" value="0">
        </div>
      `
        )
        .join("");
    } else if (modalId === "addExpenseModal") {
      const container = document.getElementById("expenseMembers");
      container.innerHTML = this.houseMembers
        .map(
          (m) => `
        <div class="input-group">
          <label for="exp_${m._id}">${m.nickname || m.fullName}</label>
          <input type="number" id="exp_${m._id}" min="0" value="0">
        </div>
      `
        )
        .join("");
    }

    const today = new Date().toISOString().split("T")[0];
    if (document.getElementById("entryDate"))
      document.getElementById("entryDate").value = today;
    if (document.getElementById("expenseDate"))
      document.getElementById("expenseDate").value = today;
  }

  async addMealEntry() {
    try {
      const date = document.getElementById("entryDate").value;
      const bazarPerson = document.getElementById("bazarPerson").value;

      if (!date || !bazarPerson) {
        this.showToast("error", "Please fill date and bazar person.");
        return;
      }

      const meals = this.houseMembers.map((member) => ({
        memberId: member._id,
        count:
          parseFloat(document.getElementById(`meal_${member._id}`).value) || 0,
      }));

      await API.addMealEntry({ date, bazarPerson, meals });

      this.closeModal("addMealModal");
      this.showToast("success", "Meal entry added!");
      this.updateAll();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async addExpenseEntry() {
    try {
      const date = document.getElementById("expenseDate").value;
      const description = document
        .getElementById("expenseDescription")
        .value.trim();

      if (!date || !description) {
        this.showToast("error", "Please fill date and description.");
        return;
      }

      const expenses = this.houseMembers.map((member) => ({
        memberId: member._id,
        amount:
          parseFloat(document.getElementById(`exp_${member._id}`).value) || 0,
      }));

      await API.addExpenseEntry({ date, description, expenses });

      this.closeModal("addExpenseModal");
      this.showToast("success", "Expense added!");
      this.updateAll();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  async addMember() {
    try {
      const fullName = document.getElementById("addFullName").value.trim();
      const email = document.getElementById("addEmail").value.trim();
      const phone = document.getElementById("addPhone").value.trim();
      const tempPassword = document.getElementById("addTempPass").value;

      if (!fullName || !email || !phone || !tempPassword) {
        this.showToast("error", "Please fill all fields.");
        return;
      }

      await API.addMember({ fullName, email, phone, tempPassword });

      this.closeModal("addMemberModal");
      this.showToast("success", `Member added! Temp password: ${tempPassword}`);
      await this.loadHouseData();
      this.renderMembers();
      this.updateAll();
    } catch (error) {
      this.showToast("error", error.message);
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  showToast(type, message) {
    const toast = document.createElement("div");
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "times-circle"
            : "exclamation-triangle"
        }"></i>
        ${message}
      </div>
    `;
    document.getElementById("toastContainer").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  exportPDF() {
    // PDF export functionality - you can implement this later
    this.showToast("info", "PDF export feature coming soon!");
  }

  hideLoading() {
    setTimeout(() => {
      document.querySelector(".loading-screen").style.opacity = "0";
      setTimeout(() => {
        document.querySelector(".loading-screen").style.display = "none";
      }, 500);
    }, 1000);
  }

  exportPDF() {
    if (typeof window.jspdf === "undefined") {
      this.showToast(
        "error",
        "PDF library not loaded. Please refresh and try again."
      );
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Colors and styling
    const primaryColor = [0, 31, 63];
    const accentColor = [0, 123, 255];
    const textColor = [44, 62, 80];
    const lightGray = [248, 249, 250];
    const borderGray = [220, 220, 220];
    const white = [255, 255, 255];

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Professional Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(...white);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BACHELOR HOUSE MANAGER", margin, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Monthly Financial Report & Statement", margin, 30);

    // Header right side info - Show manager info
    const manager = this.houseMembers.find((u) => u.role === "manager");
    doc.setFontSize(9);
    const currentDate = new Date().toLocaleDateString("en-GB");
    doc.text(`Report Date: ${currentDate}`, pageWidth - 65, 18);
    doc.text(`House Code: ${this.currentUser.houseCode}`, pageWidth - 65, 26);
    doc.text(
      `Manager: ${manager ? manager.nickname || manager.fullName : "N/A"}`,
      pageWidth - 65,
      34
    );

    yPosition = 60;

    // Report Period Header
    doc.setTextColor(...textColor);
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPosition, contentWidth, 18, "F");
    doc.setDrawColor(...borderGray);
    doc.rect(margin, yPosition, contentWidth, 18, "S");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `FINANCIAL REPORT - ${this.currentMonth.toUpperCase()} ${
        this.currentYear
      }`,
      margin + 5,
      yPosition + 11
    );

    yPosition += 30;

    // Get current data for calculations
    const monthIndex = this.months.indexOf(this.currentMonth) + 1;

    // We'll need to make these calls to get the data
    Promise.all([
      API.getMealStats(this.currentYear, monthIndex),
      API.getExpenseStats(this.currentYear, monthIndex),
    ])
      .then(([mealStats, expenseStats]) => {
        const totalBazar = expenseStats.success
          ? expenseStats.stats.totalExpenses
          : 0;
        const totalMeals = mealStats.success ? mealStats.stats.totalMeals : 0;
        const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;
        const allMembers = this.houseMembers;
        const membersOnly = allMembers.filter(
          (member) => member.role !== "manager"
        );

        // Executive Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("EXECUTIVE SUMMARY", margin, yPosition);
        yPosition += 18;

        // Summary cards with better spacing
        const summaryData = [
          { label: "House Members", value: membersOnly.length.toString() },
          { label: "Total Meals", value: totalMeals.toFixed(1) },
          { label: "Total Expenses", value: `৳${totalBazar.toLocaleString()}` },
          { label: "Cost Per Meal", value: `৳${perMealCost.toFixed(2)}` },
        ];

        const cardWidth = (contentWidth - 20) / 4;
        const cardHeight = 30;

        summaryData.forEach((item, index) => {
          const xPos = margin + index * (cardWidth + 6.67);

          // Card background and border
          doc.setFillColor(...white);
          doc.rect(xPos, yPosition, cardWidth, cardHeight, "F");
          doc.setDrawColor(...borderGray);
          doc.setLineWidth(0.3);
          doc.rect(xPos, yPosition, cardWidth, cardHeight, "S");

          // Card content
          doc.setTextColor(...textColor);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(item.label, xPos + 3, yPosition + 10);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...accentColor);
          doc.text(item.value, xPos + 3, yPosition + 22);
        });

        yPosition += 50;

        // Check page break
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        // Manager Information Section
        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("HOUSE MANAGER", margin, yPosition);
        yPosition += 15;

        if (manager) {
          const managerMealStat = mealStats.success
            ? mealStats.stats.memberStats.find(
                (s) => s.member._id === manager._id
              )
            : null;
          const managerExpenseStat = expenseStats.success
            ? expenseStats.stats.memberStats.find(
                (s) => s.member._id === manager._id
              )
            : null;

          const managerMeals = managerMealStat ? managerMealStat.totalMeals : 0;
          const managerExpenses = managerExpenseStat
            ? managerExpenseStat.totalExpenses
            : 0;
          const managerMealBill = managerMeals * perMealCost;
          const managerBalance = managerExpenses - managerMealBill;

          // Manager info box
          doc.setFillColor(...lightGray);
          doc.rect(margin, yPosition, contentWidth, 25, "F");
          doc.setDrawColor(...borderGray);
          doc.rect(margin, yPosition, contentWidth, 25, "S");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...textColor);
          doc.text(
            `Name: ${manager.nickname || manager.fullName}`,
            margin + 5,
            yPosition + 8
          );
          doc.text(
            `Meals: ${managerMeals.toFixed(1)}`,
            margin + 5,
            yPosition + 16
          );
          doc.text(
            `Expenses: ৳${managerExpenses.toLocaleString()}`,
            margin + 80,
            yPosition + 8
          );
          doc.text(
            `Balance: ৳${managerBalance.toFixed(2)}`,
            margin + 80,
            yPosition + 16
          );
          doc.text(
            `House Code: ${manager.houseCode}`,
            margin + 140,
            yPosition + 8
          );
          doc.text(
            `Member Since: ${new Date(manager.createdAt).toLocaleDateString()}`,
            margin + 140,
            yPosition + 16
          );
        }

        yPosition += 40;

        // Member Financial Breakdown (Excluding Manager)
        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("MEMBER FINANCIAL BREAKDOWN", margin, yPosition);
        yPosition += 20;

        // Table setup with proper column widths
        const tableHeaders = [
          "Member Name",
          "Meals",
          "Meal Cost",
          "Amount Paid",
          "Balance",
          "Status",
        ];
        const colWidths = [50, 20, 25, 30, 25, 20];
        const rowHeight = 12;

        // Table header
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition, contentWidth, rowHeight, "F");

        doc.setTextColor(...white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);

        let xPos = margin;
        tableHeaders.forEach((header, index) => {
          doc.text(header, xPos + 2, yPosition + 8);
          xPos += colWidths[index];
        });

        yPosition += rowHeight;

        // Table rows with better formatting (Only for members, not manager)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        membersOnly.forEach((member, index) => {
          // Check for page break
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;

            // Repeat header on new page
            doc.setFillColor(...primaryColor);
            doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
            doc.setTextColor(...white);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);

            xPos = margin;
            tableHeaders.forEach((header, index) => {
              doc.text(header, xPos + 2, yPosition + 8);
              xPos += colWidths[index];
            });
            yPosition += rowHeight;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
          }

          const memberMealStat = mealStats.success
            ? mealStats.stats.memberStats.find(
                (s) => s.member._id === member._id
              )
            : null;
          const memberExpenseStat = expenseStats.success
            ? expenseStats.stats.memberStats.find(
                (s) => s.member._id === member._id
              )
            : null;

          const memberMeals = memberMealStat ? memberMealStat.totalMeals : 0;
          const memberExpenses = memberExpenseStat
            ? memberExpenseStat.totalExpenses
            : 0;
          const mealBill = memberMeals * perMealCost;
          const balance = memberExpenses - mealBill;
          const status =
            balance > 0 ? "Credit" : balance < 0 ? "Due" : "Settled";

          // Alternating row background
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
          }

          // Row border
          doc.setDrawColor(...borderGray);
          doc.setLineWidth(0.1);
          doc.rect(margin, yPosition, contentWidth, rowHeight, "S");

          // Row data with proper alignment
          const rowData = [
            { text: member.nickname || member.fullName, color: textColor },
            { text: memberMeals.toFixed(1), color: textColor },
            { text: `৳${mealBill.toFixed(0)}`, color: textColor },
            { text: `৳${memberExpenses.toLocaleString()}`, color: textColor },
            {
              text: `৳${Math.abs(balance).toFixed(0)}`,
              color: balance >= 0 ? [22, 160, 133] : [231, 76, 60],
            },
            {
              text: status,
              color:
                balance >= 0
                  ? [22, 160, 133]
                  : balance < 0
                  ? [231, 76, 60]
                  : accentColor,
            },
          ];

          xPos = margin;
          rowData.forEach((cell, colIndex) => {
            doc.setTextColor(...cell.color);

            // Truncate text if too long
            let displayText = cell.text;
            if (colIndex === 0 && displayText.length > 15) {
              displayText = displayText.substring(0, 12) + "...";
            }

            doc.text(displayText, xPos + 2, yPosition + 8);
            xPos += colWidths[colIndex];
          });

          yPosition += rowHeight;
        });

        yPosition += 15;

        // Financial Summary Section (Calculate for members only)
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("FINANCIAL SUMMARY", margin, yPosition);
        yPosition += 20;

        // Calculate summary totals for members only
        let totalDue = 0;
        let totalCredit = 0;
        let membersWithDue = 0;
        let membersWithCredit = 0;

        membersOnly.forEach((member) => {
          const memberMealStat = mealStats.success
            ? mealStats.stats.memberStats.find(
                (s) => s.member._id === member._id
              )
            : null;
          const memberExpenseStat = expenseStats.success
            ? expenseStats.stats.memberStats.find(
                (s) => s.member._id === member._id
              )
            : null;

          const memberMeals = memberMealStat ? memberMealStat.totalMeals : 0;
          const memberExpenses = memberExpenseStat
            ? memberExpenseStat.totalExpenses
            : 0;
          const balance = memberExpenses - memberMeals * perMealCost;

          if (balance < 0) {
            totalDue += Math.abs(balance);
            membersWithDue++;
          } else if (balance > 0) {
            totalCredit += balance;
            membersWithCredit++;
          }
        });

        // Summary table
        const summaryTableData = [
          [
            "Total Outstanding Due:",
            `৳${totalDue.toFixed(2)}`,
            `(${membersWithDue} members)`,
          ],
          [
            "Total Credit Balance:",
            `৳${totalCredit.toFixed(2)}`,
            `(${membersWithCredit} members)`,
          ],
          [
            "Net House Balance:",
            `৳${(totalCredit - totalDue).toFixed(2)}`,
            totalCredit >= totalDue ? "(Surplus)" : "(Deficit)",
          ],
          [
            "Average Member Expense:",
            `৳${
              membersOnly.length > 0
                ? (totalBazar / membersOnly.length).toFixed(2)
                : "0"
            }`,
            "per member",
          ],
          [
            "House Participation Rate:",
            `${
              membersOnly.length > 0
                ? ((totalMeals / (membersOnly.length * 30)) * 100).toFixed(1)
                : "0"
            }%`,
            "meal participation",
          ],
        ];

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        summaryTableData.forEach((row, index) => {
          const bgColor = index === 2 ? lightGray : white;
          doc.setFillColor(...bgColor);
          doc.rect(margin, yPosition, contentWidth, 12, "F");
          doc.setDrawColor(...borderGray);
          doc.rect(margin, yPosition, contentWidth, 12, "S");

          doc.setTextColor(...textColor);
          doc.text(row[0], margin + 3, yPosition + 8);

          doc.setFont("helvetica", "bold");
          doc.text(row[1], margin + 80, yPosition + 8);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(row[2], margin + 130, yPosition + 8);

          doc.setFontSize(9);
          yPosition += 12;
        });

        // Professional Footer
        const footerY = pageHeight - 15;
        doc.setFillColor(...primaryColor);
        doc.rect(0, footerY - 8, pageWidth, 15, "F");

        doc.setTextColor(...white);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(
          "Bachelor House Manager System - Confidential Financial Report",
          margin,
          footerY
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth - 70,
          footerY
        );

        // Save with professional filename
        const fileName = `Financial_Report_${this.currentUser.houseCode}_${this.currentMonth}_${this.currentYear}.pdf`;
        doc.save(fileName);
        this.showToast(
          "success",
          "Professional financial report generated successfully!"
        );
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        this.showToast("error", "Failed to generate PDF report");
      });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.houseApp = new HouseApp();
});
