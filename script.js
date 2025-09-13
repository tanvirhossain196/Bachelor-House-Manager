// Bachelor House Manager JavaScript
class HouseApp {
  constructor() {
    this.users = this.loadData("users") || [];
    this.houses = this.loadData("houses") || {};
    this.currentUser = null;
    this.currentHouse = null;
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
  }

  setupModals() {
    document.querySelectorAll(".modal .close").forEach((close) => {
      close.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        modal.style.display = "none";
      });
    });

    // Close modal when clicking outside
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

  loadCurrentUser() {
    const savedEmail = localStorage.getItem("currentEmail");
    if (savedEmail) {
      const user = this.users.find((u) => u.email === savedEmail);
      if (user) {
        this.currentUser = user;
        this.currentHouse = this.houses[user.houseCode];
        document.querySelector(".auth-section").style.display = "none";
        document.querySelector(".main-app").style.display = "block";
        this.setupMonthYearSelectors();
        this.updateAll();
        this.showRoleSpecificElements();
      }
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

  login() {
    const role = document.querySelector('input[name="role"]:checked').value;
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const user = this.users.find(
      (u) => u.email === email && u.password === password && u.role === role
    );
    if (user) {
      this.currentUser = user;
      this.currentHouse = this.houses[user.houseCode];
      localStorage.setItem("currentEmail", email);
      document.querySelector(".auth-section").style.display = "none";
      document.querySelector(".main-app").style.display = "block";
      this.setupMonthYearSelectors();
      this.updateAll();
      this.showRoleSpecificElements();
      this.showToast("success", "Logged in successfully!");
    } else {
      this.showToast("error", "Invalid credentials or role.");
    }
  }

  register() {
    const role = document.querySelector('input[name="regRole"]:checked').value;
    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;

    if (this.users.find((u) => u.email === email)) {
      this.showToast("error", "Email already exists.");
      return;
    }

    let houseCode;
    if (role === "manager") {
      houseCode = this.generateHouseCode();
      this.houses[houseCode] = {
        mealEntries: {},
        expenseEntries: {},
        memberEmails: [email],
      };
    } else {
      houseCode = document.getElementById("regHouseCode").value.trim();
      if (!this.houses[houseCode]) {
        this.showToast("error", "Invalid house code.");
        return;
      }
      this.houses[houseCode].memberEmails.push(email);
    }

    const newUser = {
      email,
      fullName,
      nickname: "",
      phone,
      password,
      role,
      houseCode,
      joined: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.saveData();
    this.showToast(
      "success",
      role === "manager"
        ? `Registered successfully! Your house code is ${houseCode}`
        : "Registered successfully!"
    );
    this.switchForm("login");
  }

  generateHouseCode() {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
    } while (Object.keys(this.houses).includes(code));
    return code;
  }

  logout() {
    localStorage.removeItem("currentEmail");
    this.currentUser = null;
    this.currentHouse = null;
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

  updateAll() {
    this.renderDashboard();
    this.renderMembers();
    this.renderMeals();
    this.renderExpenses();
    this.renderProfile();
    this.renderReports();
    this.updateUserInfo();
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

    if (sectionId === "dashboard") this.renderDashboard();
    if (sectionId === "members") this.renderMembers();
    if (sectionId === "meals") this.renderMeals();
    if (sectionId === "expenses") this.renderExpenses();
    if (sectionId === "reports") this.renderReports();
    if (sectionId === "profile") this.renderProfile();
  }

  getMembers() {
    return this.currentHouse.memberEmails.map((email) =>
      this.users.find((u) => u.email === email)
    );
  }

  getMonthKey() {
    return `${this.currentYear}-${String(
      this.months.indexOf(this.currentMonth) + 1
    ).padStart(2, "0")}`;
  }

  getFilteredEntries(entries) {
    const monthKey = this.getMonthKey();
    return entries[monthKey] || [];
  }

  calculateTotalBazar() {
    const monthKey = this.getMonthKey();
    const entries = this.currentHouse.expenseEntries[monthKey] || [];
    return entries.reduce(
      (total, entry) =>
        total +
        Object.values(entry.expenses).reduce((sum, amt) => sum + amt, 0),
      0
    );
  }

  calculateTotalMeals() {
    const monthKey = this.getMonthKey();
    const entries = this.currentHouse.mealEntries[monthKey] || [];
    return entries.reduce(
      (total, entry) =>
        total +
        Object.values(entry.meals).reduce((sum, count) => sum + count, 0),
      0
    );
  }

  renderDashboard() {
    this.updateStats();
    this.generateSummary();
  }

  updateStats() {
    const totalBazar = this.calculateTotalBazar();
    const totalMeals = this.calculateTotalMeals();
    const mealRate = totalMeals > 0 ? (totalBazar / totalMeals).toFixed(2) : 0;
    const activeMembers = this.getMembers().length;

    document.getElementById(
      "totalBazar"
    ).textContent = `৳${totalBazar.toLocaleString()}`;
    document.getElementById("totalMeals").textContent = totalMeals.toFixed(1);
    document.getElementById("mealRate").textContent = `৳${mealRate}`;
    document.getElementById("totalMembers").textContent = activeMembers;
  }

  generateSummary() {
    const tbody = document.getElementById("balanceTableBody");
    tbody.innerHTML = "";
    const members = this.getMembers();
    const totalBazar = this.calculateTotalBazar();
    const totalMeals = this.calculateTotalMeals();
    const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;

    members.forEach((member) => {
      const monthKey = this.getMonthKey();

      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const memberMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[member.email] || 0),
        0
      );

      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const memberExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[member.email] || 0),
        0
      );

      const mealCost = memberMeals * perMealCost;
      const balance = memberExpenses - mealCost;
      const status = balance > 0 ? "Give" : balance < 0 ? "Pay" : "Settled";

      const row = `
                <tr>
                    <td><strong>${
                      member.nickname || member.fullName
                    }</strong></td>
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
  }

  renderMembers() {
    const grid = document.getElementById("membersGrid");
    grid.innerHTML = "";
    const members = this.getMembers();

    members.forEach((member) => {
      const card = document.createElement("div");
      card.className = "member-card";
      card.onclick = () => this.showMemberDetails(member);

      const monthKey = this.getMonthKey();
      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const memberMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[member.email] || 0),
        0
      );

      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const memberExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[member.email] || 0),
        0
      );

      const totalBazar = this.calculateTotalBazar();
      const totalMeals = this.calculateTotalMeals();
      const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;
      const mealCost = memberMeals * perMealCost;
      const balance = memberExpenses - mealCost;

      card.innerHTML = `
                <div class="member-header">
                    <div class="member-avatar">${member.fullName.charAt(
                      0
                    )}</div>
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
                  this.currentUser.role === "manager" &&
                  member.role !== "manager"
                    ? `
                    <div class="member-actions" onclick="event.stopPropagation();">
                        <button class="btn-danger" onclick="houseApp.deleteMember('${member.email}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `
                    : ""
                }
            `;
      grid.appendChild(card);
    });
  }

  showMemberDetails(member) {
    const modal = document.getElementById("memberDetailModal");
    const title = document.getElementById("memberDetailTitle");
    const content = document.getElementById("memberDetailContent");

    title.textContent = member.nickname || member.fullName;

    const monthKey = this.getMonthKey();
    const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
    const memberMeals = mealEntries.reduce(
      (total, entry) => total + (entry.meals[member.email] || 0),
      0
    );

    const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
    const memberExpenses = expenseEntries.reduce(
      (total, entry) => total + (entry.expenses[member.email] || 0),
      0
    );

    const totalBazar = this.calculateTotalBazar();
    const totalMeals = this.calculateTotalMeals();
    const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;
    const mealCost = memberMeals * perMealCost;
    const balance = memberExpenses - mealCost;

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
                        <span>${this.formatDate(member.joined)}</span>
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
            <div class="member-details">
                <h4>Monthly Statistics (${this.currentMonth} ${
      this.currentYear
    })</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Meals</label>
                        <span>${memberMeals.toFixed(1)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Expenses</label>
                        <span>৳${memberExpenses.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Meal Bill</label>
                        <span>৳${mealCost.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Balance</label>
                        <span class="${
                          balance >= 0 ? "positive-balance" : "negative-balance"
                        }">৳${balance.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

    modal.style.display = "block";
  }

  deleteMember(email) {
    if (confirm("Are you sure you want to delete this member?")) {
      this.users = this.users.filter((u) => u.email !== email);
      this.currentHouse.memberEmails = this.currentHouse.memberEmails.filter(
        (em) => em !== email
      );

      // Remove from all entries
      Object.keys(this.currentHouse.mealEntries).forEach((monthKey) => {
        this.currentHouse.mealEntries[monthKey].forEach(
          (entry) => delete entry.meals[email]
        );
      });
      Object.keys(this.currentHouse.expenseEntries).forEach((monthKey) => {
        this.currentHouse.expenseEntries[monthKey].forEach(
          (entry) => delete entry.expenses[email]
        );
      });

      this.saveData();
      this.renderMembers();
      this.updateAll();
      this.showToast("success", "Member deleted successfully.");
    }
  }

  renderMeals() {
    const monthYear = document.getElementById("mealMonthYear");
    monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;
    this.renderMealTable();
  }

  renderMealTable() {
    const thead = document.getElementById("mealsTableHead");
    const tbody = document.getElementById("mealsTableBody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const members = this.getMembers();
    let headerRow = "<tr><th>Date</th><th>Day</th><th>Bazar Person</th>";
    members.forEach(
      (m) => (headerRow += `<th>${m.nickname || m.fullName}</th>`)
    );
    headerRow += "<th>Actions</th></tr>";
    thead.innerHTML = headerRow;

    const monthKey = this.getMonthKey();
    const entries = this.currentHouse.mealEntries[monthKey] || [];
    const sortedEntries = entries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const dayName = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const bazarPersonName =
        this.users.find((u) => u.email === entry.bazarPerson)?.nickname ||
        this.users.find((u) => u.email === entry.bazarPerson)?.fullName ||
        entry.bazarPerson;

      let row = `
                <tr>
                    <td>${this.formatDate(entry.date)}</td>
                    <td><span class="day-cell day-${dayName}">${date.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      )}</span></td>
                    <td><span class="bazar-person bazar-${bazarPersonName
                      .toLowerCase()
                      .replace(/\s+/g, "-")}">${bazarPersonName}</span></td>
            `;

      members.forEach((m) => {
        const mealCount = entry.meals[m.email] || 0;
        row += `<td><span class="meal-count ${
          mealCount === 0 ? "zero" : ""
        }">${mealCount}</span></td>`;
      });

      row += `
                    <td>
                        <button class="btn-danger" onclick="houseApp.deleteMealEntry('${entry.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  }

  deleteMealEntry(id) {
    if (confirm("Are you sure?")) {
      const monthKey = this.getMonthKey();
      this.currentHouse.mealEntries[monthKey] = this.currentHouse.mealEntries[
        monthKey
      ].filter((e) => e.id !== id);
      this.saveData();
      this.updateAll();
    }
  }

  renderExpenses() {
    const monthYear = document.getElementById("expenseMonthYear");
    monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;
    this.renderExpenseTable();
    this.updateExpenseStats();
  }

  renderExpenseTable() {
    const thead = document.getElementById("expensesTableHead");
    const tbody = document.getElementById("expensesTableBody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const members = this.getMembers();
    let headerRow = "<tr><th>Date</th><th>Description</th>";
    members.forEach(
      (m) => (headerRow += `<th>${m.nickname || m.fullName}</th>`)
    );
    headerRow += "<th>Total</th><th>Actions</th></tr>";
    thead.innerHTML = headerRow;

    const monthKey = this.getMonthKey();
    const entries = this.currentHouse.expenseEntries[monthKey] || [];
    const sortedEntries = entries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedEntries.forEach((entry) => {
      const total = Object.values(entry.expenses).reduce(
        (sum, amt) => sum + amt,
        0
      );
      let row = `
                <tr>
                    <td>${this.formatDate(entry.date)}</td>
                    <td><span class="expense-desc">${
                      entry.description
                    }</span></td>
            `;

      members.forEach((m) => {
        const expense = entry.expenses[m.email] || 0;
        row += `<td>৳${expense.toLocaleString()}</td>`;
      });

      row += `
                    <td><strong>৳${total.toLocaleString()}</strong></td>
                    <td>
                        <button class="btn-danger" onclick="houseApp.deleteExpenseEntry('${
                          entry.id
                        }')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
      tbody.insertAdjacentHTML("beforeend", row);
    });
  }

  deleteExpenseEntry(id) {
    if (confirm("Are you sure?")) {
      const monthKey = this.getMonthKey();
      this.currentHouse.expenseEntries[monthKey] =
        this.currentHouse.expenseEntries[monthKey].filter((e) => e.id !== id);
      this.saveData();
      this.updateAll();
    }
  }

  updateExpenseStats() {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const monthKey = this.getMonthKey();
    const entries = this.currentHouse.expenseEntries[monthKey] || [];

    const todayExpenses = entries
      .filter((e) => e.date === today)
      .reduce(
        (total, e) =>
          total + Object.values(e.expenses).reduce((s, a) => s + a, 0),
        0
      );

    const weekExpenses = entries
      .filter((e) => e.date >= weekStartStr)
      .reduce(
        (total, e) =>
          total + Object.values(e.expenses).reduce((s, a) => s + a, 0),
        0
      );

    const monthExpenses = this.calculateTotalBazar();

    document.getElementById(
      "todayExpenses"
    ).textContent = `৳${todayExpenses.toLocaleString()}`;
    document.getElementById(
      "weekExpenses"
    ).textContent = `৳${weekExpenses.toLocaleString()}`;
    document.getElementById(
      "monthExpenses"
    ).textContent = `৳${monthExpenses.toLocaleString()}`;
  }

  renderReports() {
    const monthYear = document.getElementById("reportMonthYear");
    monthYear.textContent = `${this.currentMonth} ${this.currentYear}`;
    this.generateReport();
  }

  generateReport() {
    const content = document.getElementById("reportContent");
    const members = this.getMembers();
    const totalBazar = this.calculateTotalBazar();
    const totalMeals = this.calculateTotalMeals();
    const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;

    let reportHtml = `
            <div class="member-details">
                <h4>Monthly Summary</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Total Members</label>
                        <span>${members.length}</span>
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

    members.forEach((member) => {
      const monthKey = this.getMonthKey();
      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const memberMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[member.email] || 0),
        0
      );

      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const memberExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[member.email] || 0),
        0
      );

      const mealBill = memberMeals * perMealCost;
      const balance = memberExpenses - mealBill;
      const status = balance > 0 ? "Give" : balance < 0 ? "Pay" : "Settled";

      reportHtml += `
                <tr>
                    <td><strong>${
                      member.nickname || member.fullName
                    }</strong></td>
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

  renderProfile() {
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
      this.currentUser.joined
    );
  }

  openEditNickname() {
    document.getElementById("editNickname").value =
      this.currentUser.nickname || "";
    this.openModal("editNicknameModal");
  }

  updateNickname() {
    const nickname = document.getElementById("editNickname").value.trim();
    this.currentUser.nickname = nickname;
    this.saveData();
    this.renderProfile();
    this.closeModal("editNicknameModal");
    this.showToast("success", "Nickname updated!");
    this.updateAll();
  }

  changePassword() {
    const current = document.getElementById("currentPass").value;
    const newPass = document.getElementById("newPass").value;
    const confirm = document.getElementById("confirmPass").value;

    if (current !== this.currentUser.password) {
      this.showToast("error", "Current password incorrect.");
      return;
    }
    if (newPass !== confirm) {
      this.showToast("error", "Passwords do not match.");
      return;
    }
    this.currentUser.password = newPass;
    this.saveData();
    this.closeModal("changePasswordModal");
    this.showToast("success", "Password changed!");
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
    const members = this.getMembers();
    const bazarSelect = document.getElementById("bazarPerson");
    bazarSelect.innerHTML =
      '<option value="">Select Member</option>' +
      members
        .map(
          (m) =>
            `<option value="${m.email}">${m.nickname || m.fullName}</option>`
        )
        .join("");

    if (modalId === "addMealModal") {
      const container = document.getElementById("mealMembers");
      container.innerHTML = members
        .map(
          (m) => `
                    <div class="input-group">
                        <label for="meal_${m.email}">${
            m.nickname || m.fullName
          }</label>
                        <input type="number" id="meal_${
                          m.email
                        }" step="0.5" min="0" value="0">
                    </div>
                `
        )
        .join("");
    } else if (modalId === "addExpenseModal") {
      const container = document.getElementById("expenseMembers");
      container.innerHTML = members
        .map(
          (m) => `
                    <div class="input-group">
                        <label for="exp_${m.email}">${
            m.nickname || m.fullName
          }</label>
                        <input type="number" id="exp_${
                          m.email
                        }" min="0" value="0">
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

  addMealEntry() {
    const date = document.getElementById("entryDate").value;
    const bazarPerson = document.getElementById("bazarPerson").value;

    if (!date || !bazarPerson) {
      this.showToast("error", "Please fill date and bazar person.");
      return;
    }

    const meals = {};
    this.getMembers().forEach((m) => {
      meals[m.email] =
        parseFloat(document.getElementById(`meal_${m.email}`).value) || 0;
    });

    const newEntry = {
      id: Date.now().toString(),
      date,
      bazarPerson,
      meals,
    };

    const monthKey = this.getMonthKey();
    if (!this.currentHouse.mealEntries[monthKey]) {
      this.currentHouse.mealEntries[monthKey] = [];
    }
    this.currentHouse.mealEntries[monthKey].push(newEntry);
    this.saveData();
    this.closeModal("addMealModal");
    this.updateAll();
    this.showToast("success", "Meal entry added!");
  }

  addExpenseEntry() {
    const date = document.getElementById("expenseDate").value;
    const description = document
      .getElementById("expenseDescription")
      .value.trim();

    if (!date || !description) {
      this.showToast("error", "Please fill date and description.");
      return;
    }

    const expenses = {};
    this.getMembers().forEach((m) => {
      expenses[m.email] =
        parseFloat(document.getElementById(`exp_${m.email}`).value) || 0;
    });

    const newEntry = {
      id: Date.now().toString(),
      date,
      description,
      expenses,
    };

    const monthKey = this.getMonthKey();
    if (!this.currentHouse.expenseEntries[monthKey]) {
      this.currentHouse.expenseEntries[monthKey] = [];
    }
    this.currentHouse.expenseEntries[monthKey].push(newEntry);
    this.saveData();
    this.closeModal("addExpenseModal");
    this.updateAll();
    this.showToast("success", "Expense added!");
  }

  addMember() {
    const fullName = document.getElementById("addFullName").value.trim();
    const email = document.getElementById("addEmail").value.trim();
    const phone = document.getElementById("addPhone").value.trim();
    const password = document.getElementById("addTempPass").value;

    if (this.users.find((u) => u.email === email)) {
      this.showToast("error", "Email exists.");
      return;
    }

    const newUser = {
      email,
      fullName,
      nickname: "",
      phone,
      password,
      role: "member",
      houseCode: this.currentUser.houseCode,
      joined: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.currentHouse.memberEmails.push(email);
    this.saveData();
    this.closeModal("addMemberModal");
    this.renderMembers();
    this.updateAll();
    this.showToast("success", `Member added! Temp password: ${password}`);
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
    const manager = this.users.find(
      (u) => u.houseCode === this.currentUser.houseCode && u.role === "manager"
    );
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

    // Executive Summary
    const totalBazar = this.calculateTotalBazar();
    const totalMeals = this.calculateTotalMeals();
    const perMealCost = totalMeals > 0 ? totalBazar / totalMeals : 0;
    const allMembers = this.getMembers();
    const membersOnly = allMembers.filter(
      (member) => member.role !== "manager"
    ); // Exclude manager from members list

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
      const monthKey = this.getMonthKey();
      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const managerMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[manager.email] || 0),
        0
      );
      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const managerExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[manager.email] || 0),
        0
      );
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
      doc.text(`Meals: ${managerMeals.toFixed(1)}`, margin + 5, yPosition + 16);
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
      doc.text(`House Code: ${manager.houseCode}`, margin + 140, yPosition + 8);
      doc.text(
        `Member Since: ${new Date(manager.joined).toLocaleDateString()}`,
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

      const monthKey = this.getMonthKey();
      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const memberMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[member.email] || 0),
        0
      );

      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const memberExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[member.email] || 0),
        0
      );

      const mealBill = memberMeals * perMealCost;
      const balance = memberExpenses - mealBill;
      const status = balance > 0 ? "Credit" : balance < 0 ? "Due" : "Settled";

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
      const monthKey = this.getMonthKey();
      const mealEntries = this.currentHouse.mealEntries[monthKey] || [];
      const memberMeals = mealEntries.reduce(
        (total, entry) => total + (entry.meals[member.email] || 0),
        0
      );
      const expenseEntries = this.currentHouse.expenseEntries[monthKey] || [];
      const memberExpenses = expenseEntries.reduce(
        (total, entry) => total + (entry.expenses[member.email] || 0),
        0
      );
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
  }
  
  saveData() {
    localStorage.setItem("users", JSON.stringify(this.users));
    localStorage.setItem("houses", JSON.stringify(this.houses));
  }

  loadData(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  hideLoading() {
    setTimeout(() => {
      document.querySelector(".loading-screen").style.opacity = "0";
      setTimeout(() => {
        document.querySelector(".loading-screen").style.display = "none";
      }, 500);
    }, 1000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.houseApp = new HouseApp();
});