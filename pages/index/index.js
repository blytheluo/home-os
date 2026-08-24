// index.js
Page({
  data: {
    loading: true,
    activeTab: "house", // house | budget
    budgetSummary: {
      totalBudget: 0,
      totalActual: 0,
      remaining: 0,
      totalBudgetText: "0.00",
      totalActualText: "0.00",
      remainingText: "0.00",
      overAmountText: "0.00",
      count: 0,
      overBudget: false,
      categoryStats: [],
      categoryBudgetSummary: "",
      houseDone: 0,
      houseTotal: 0,
    },
    houseItems: [],
    filteredHouseItems: [],
    activeHouseCategory: "全部",
    budgetItems: [],
    showForm: false,
    submitting: false,
    loadError: false,
    formMode: "add", // add | edit
    editId: "",
    form: {
      title: "",
      category: "",
      type: "",
      content: "",
      owner: "",
      budgetAmount: "",
      actualAmount: "",
      vendor: "",
      note: "",
    },
    // picker 选项
    houseCategories: ["厨房", "西厨", "客厅", "卧室", "书房", "阳台", "其他"],
    houseFilterCategories: ["全部", "厨房", "西厨", "客厅", "卧室", "书房", "阳台", "其他"],
    budgetCategories: ["宜家全屋", "家电", "家具软装", "杂项/施工", "未分配预留"],
    houseTypes: ["事项", "决策", "待办"],
    houseStatuses: ["待确认", "进行中", "已完成", "已确定", "已放弃"],
    budgetStatuses: ["待购买", "已购买"],
  },

  onLoad() {
    this.loadAll();
  },

  onPullDownRefresh() {
    this.loadAll().then(() => wx.stopPullDownRefresh());
  },

  // 统一调用 shared-data 云函数
  callSharedData(payload) {
    const doCall = () =>
      wx.cloud
        .callFunction({ name: "shared-data", data: payload })
        .then((res) => {
          const r = res.result || {};
          if (r.code !== 0) {
            throw new Error(r.message || "操作失败");
          }
          return r;
        });
    return doCall().catch((err) => {
      // 读操作偶发超时（云函数冷启动），自动重试一次；写操作不重试避免重复写入
      if (payload.action === "list" && this.isTransientError(err)) {
        return doCall();
      }
      throw err;
    });
  },

  // 是否为瞬时错误（冷启动/超时），可安全重试
  isTransientError(err) {
    const msg = (err && (err.errMsg || err.message)) || "";
    return msg.includes("timed out") || msg.includes("timeout") || msg.includes("-504003");
  },

  // 写操作完成后刷新数据（失败不阻断主流程）
  refreshData() {
    return this.loadAll();
  },

  dedupeHouseItems(items) {
    const seen = {};
    return (items || []).filter((item) => {
      const key = item.sourceKey || `${item.category || ""}:${item.title || ""}`;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  },

  async loadAll() {
    this.setData({ loading: true });
    // 三个集合独立加载：单个失败不影响其他的展示，也不让整个看板不刷新
    const settle = (p) =>
      p.then(
        (value) => ({ ok: true, value }),
        (error) => ({ ok: false, error })
      );
    const [house, budget, settings] = await Promise.all([
      settle(this.callSharedData({ collection: "house_items", action: "list" })),
      settle(this.callSharedData({ collection: "budget_items", action: "list" })),
      settle(this.callSharedData({ collection: "project_settings", action: "list" })),
    ]);
    const houseItems = house.ok ? this.dedupeHouseItems(house.value.data || []) : [];
    const rawBudgetItems = budget.ok ? budget.value.data || [] : [];
    const settingsData =
      settings.ok && settings.value.data && settings.value.data.length
        ? settings.value.data[0]
        : null;
    // 金额格式化在 JS 里完成（Skyline 渲染模式下 WXML 数据绑定不支持方法调用）
    const budgetItems = rawBudgetItems.map((it) => ({
      ...it,
      budgetAmountText: this.formatMoney(it.budgetAmount),
      actualAmountText: this.formatMoney(it.actualAmount),
      statusClass: this.statusClass(it.status),
    }));
    const houseItemsWithClass = houseItems.map((it) => ({
      ...it,
      statusClass: this.statusClass(it.status),
    }));
    // 分类下拉选项与项目预算配置的分类对齐
    const budgetCategories =
      settingsData && settingsData.categoryBudgets
        ? Object.keys(settingsData.categoryBudgets)
        : this.data.budgetCategories;
    this.setData({
      houseItems: houseItemsWithClass,
      filteredHouseItems: this.filterHouseItems(houseItemsWithClass, this.data.activeHouseCategory),
      budgetItems,
      budgetCategories,
      budgetSummary: this.computeSummary(rawBudgetItems, houseItems, settingsData),
      loading: false,
      loadError: !house.ok || !budget.ok || !settings.ok,
    });
    if (!house.ok || !budget.ok || !settings.ok) {
      const failed = [];
      if (!house.ok) failed.push("装修事项");
      if (!budget.ok) failed.push("预算明细");
      if (!settings.ok) failed.push("预算配置");
      console.error("加载数据失败", failed, house.error, budget.error, settings.error);
    }
  },

  computeSummary(budgetItems, houseItems, settings) {
    const money = (v) => (Number(v) || 0).toFixed(2);
    const list = budgetItems || [];

    // 总预算来自 project_settings，不随明细累加
    const totalBudget = Number((settings && settings.totalBudget) || 0);
    // 已花费 = 所有预算项实际花费总和
    const totalActual = list.reduce((s, it) => s + (Number(it.actualAmount) || 0), 0);
    const remaining = totalBudget - totalActual;

    // 分类统计：以 project_settings.categoryBudgets 为预算上限
    const catBudgetMap = (settings && settings.categoryBudgets) || {};
    const plannedByCat = {};
    const actualByCat = {};
    list.forEach((it) => {
      const cat = it.category || "其他";
      plannedByCat[cat] = (plannedByCat[cat] || 0) + (Number(it.budgetAmount) || 0);
      actualByCat[cat] = (actualByCat[cat] || 0) + (Number(it.actualAmount) || 0);
    });
    const categoryStats = Object.keys(catBudgetMap).map((category) => {
      const budget = Number(catBudgetMap[category]) || 0;
      const planned = plannedByCat[category] || 0;
      const actual = actualByCat[category] || 0;
      const plannedRemaining = budget - planned;
      const actualRemaining = budget - actual;
      return {
        category,
        budget,
        planned,
        actual,
        plannedRemaining,
        actualRemaining,
        budgetText: money(budget),
        plannedText: money(planned),
        actualText: money(actual),
        plannedRemainingText: money(plannedRemaining),
        actualRemainingText: money(actualRemaining),
        actualRemainingClass: actualRemaining < 0 ? "danger" : "ok",
      };
    });
    // 兜底：存在未归入预算上限分类的预算明细（不丢失账目）
    Object.keys(plannedByCat).forEach((cat) => {
      if (!catBudgetMap[cat]) {
        const planned = plannedByCat[cat] || 0;
        const actual = actualByCat[cat] || 0;
        categoryStats.push({
          category: `${cat}(未预算)`,
          budget: 0,
          planned,
          actual,
          plannedRemaining: -planned,
          actualRemaining: -actual,
          budgetText: "0.00",
          plannedText: money(planned),
          actualText: money(actual),
          plannedRemainingText: money(-planned),
          actualRemainingText: money(-actual),
          actualRemainingClass: "danger",
        });
      }
    });
    categoryStats.sort((a, b) => b.budget - a.budget);

    // 分类预算摘要（一行小字，展示各分类预算上限）
    const categoryBudgetSummary = Object.keys(catBudgetMap)
      .map((category) => `${category} ${this.formatMoney(catBudgetMap[category])}`)
      .join(" / ");

    const houseItemsList = houseItems || [];
    const houseDone = houseItemsList.filter((i) => i.status === "已完成").length;
    const houseTotal = houseItemsList.length;

    const progressPercent = houseTotal ? Math.round((houseDone / houseTotal) * 100) : 0;
    return {
      totalBudget,
      totalActual,
      remaining,
      totalBudgetText: money(totalBudget),
      totalActualText: money(totalActual),
      remainingText: money(remaining),
      overAmountText: money(totalActual - totalBudget),
      count: list.length,
      overBudget: totalActual > totalBudget,
      categoryStats,
      categoryBudgetSummary,
      houseDone,
      houseTotal,
      progressPercent,
      progressStyle: `width: ${progressPercent}%;`,
    };
  },

  formatMoney(value) {
    const n = Number(value) || 0;
    const fixed = n.toFixed(2);
    // 千分位：整数部分加逗号
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  },

  // 状态 -> 英文 class 名（避免 WXSS 中文选择器兼容问题）
  statusClass(status) {
    const map = {
      待确认: "pending",
      进行中: "doing",
      已完成: "done",
      已确定: "confirmed",
      已放弃: "dropped",
      待购买: "tobuy",
      已购买: "bought",
    };
    return map[status] || "pending";
  },

  filterHouseItems(items, category) {
    if (!category || category === "全部") {
      return items || [];
    }
    return (items || []).filter((item) => item.category === category);
  },

  switchHouseCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeHouseCategory: category,
      filteredHouseItems: this.filterHouseItems(this.data.houseItems, category),
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // ---- 表单：新增 / 编辑 ----
  openForm() {
    const isHouse = this.data.activeTab === "house";
    this.setData({
      showForm: true,
      formMode: "add",
      editId: "",
      form: {
        title: "",
        category: isHouse ? "厨房" : "家电",
        type: isHouse ? "事项" : "",
        content: "",
        owner: "",
        budgetAmount: "",
        actualAmount: "",
        vendor: "",
        note: "",
      },
    });
  },

  editItem(e) {
    const { id, type } = e.currentTarget.dataset;
    const isHouse = type === "house";
    const items = isHouse ? this.data.houseItems : this.data.budgetItems;
    const item = items.find((i) => i._id === id);
    if (!item) {
      return;
    }
    this.setData({
      showForm: true,
      formMode: "edit",
      editId: id,
      form: {
        title: item.title || "",
        category: item.category || "",
        type: item.type || "",
        content: item.content || "",
        owner: item.owner || "",
        budgetAmount: item.budgetAmount != null ? String(item.budgetAmount) : "",
        actualAmount: item.actualAmount != null ? String(item.actualAmount) : "",
        vendor: item.vendor || "",
        note: item.note || "",
        status: item.status || "",
      },
    });
  },

  closeForm() {
    if (this.data.submitting) {
      return;
    }
    this.setData({ showForm: false });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const idx = Number(e.detail.value);
    const isHouse = this.data.activeTab === "house";
    const optionsMap = {
      category: isHouse ? this.data.houseCategories : this.data.budgetCategories,
      type: this.data.houseTypes,
      status: isHouse ? this.data.houseStatuses : this.data.budgetStatuses,
    };
    const value = optionsMap[field] ? optionsMap[field][idx] : "";
    this.setData({ [`form.${field}`]: value });
  },

  async submitForm() {
    const { activeTab, form, submitting, formMode, editId } = this.data;
    if (submitting) {
      return;
    }
    if (!form.title.trim()) {
      wx.showToast({ title: "请填写标题", icon: "none" });
      return;
    }
    const isHouse = activeTab === "house";
    const collection = isHouse ? "house_items" : "budget_items";
    const isEdit = formMode === "edit";

    const payload = {
      title: form.title.trim(),
      category: form.category,
    };
    if (isHouse) {
      payload.type = form.type || "事项";
      payload.content = form.content;
      payload.owner = form.owner;
      if (!isEdit) {
        payload.sort = 0;
      }
    } else {
      // 预算金额：新增必填，编辑留空则保留原值
      const budgetRaw = (form.budgetAmount || "").trim();
      if (budgetRaw === "" && !isEdit) {
        wx.showToast({ title: "请填写预算金额", icon: "none" });
        return;
      }
      if (budgetRaw !== "") {
        const b = Number(budgetRaw);
        if (Number.isNaN(b) || b < 0) {
          wx.showToast({ title: "预算金额格式不正确", icon: "none" });
          return;
        }
        if (!isEdit && b <= 0) {
          wx.showToast({ title: "请填写预算金额", icon: "none" });
          return;
        }
        payload.budgetAmount = b;
      }
      // 实际花费：仅「已购买」状态下有意义；编辑留空则保留原值
      const finalStatus = form.status || "待购买";
      if (finalStatus === "已购买") {
        const actualRaw = (form.actualAmount || "").trim();
        if (actualRaw !== "") {
          const a = Number(actualRaw);
          if (Number.isNaN(a) || a < 0) {
            wx.showToast({ title: "实际花费格式不正确", icon: "none" });
            return;
          }
          payload.actualAmount = a;
        }
      } else {
        payload.actualAmount = 0;
      }
      payload.vendor = form.vendor;
      payload.note = form.note;
    }
    if (!isEdit) {
      payload.projectId = "home-os";
    }
    payload.status = form.status || (isHouse ? "待确认" : "待购买");

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        await this.callSharedData({ collection, action: "update", id: editId, data: payload });
      } else {
        await this.callSharedData({ collection, action: "add", data: payload });
      }
      this.setData({ showForm: false, submitting: false });
      wx.showToast({ title: isEdit ? "已保存" : "已添加", icon: "success" });
      this.refreshData();
    } catch (err) {
      console.error("保存失败", err);
      this.setData({ submitting: false });
      wx.showToast({ title: err.message || "保存失败", icon: "none" });
    }
  },

  // ---- 删除 ----
  removeItem(e) {
    const { id, type } = e.currentTarget.dataset;
    const collection = type === "house" ? "house_items" : "budget_items";
    const items = type === "house" ? this.data.houseItems : this.data.budgetItems;
    const item = items.find((i) => i._id === id);
    const itemTitle = item ? item.title : "";
    wx.showModal({
      title: "确认删除",
      content: `确定删除「${itemTitle}」吗？删除后不可恢复。`,
      confirmColor: "#fa5151",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        this.callSharedData({ collection, action: "remove", id })
          .then(() => {
            wx.showToast({ title: "已删除", icon: "success" });
          })
          .catch((err) => {
            console.error("删除失败", err);
            wx.showToast({ title: err.message || "删除失败", icon: "none" });
          })
          .then(() => this.refreshData());
      },
    });
  },

  // ---- 状态切换（点击状态标签） ----
  toggleStatus(e) {
    const { id, type } = e.currentTarget.dataset;
    const isHouse = type === "house";
    const collection = isHouse ? "house_items" : "budget_items";
    const items = isHouse ? this.data.houseItems : this.data.budgetItems;
    const item = items.find((i) => i._id === id);
    if (!item) {
      return;
    }
    const statuses = isHouse ? this.data.houseStatuses : this.data.budgetStatuses;
    const idx = statuses.indexOf(item.status);
    const nextStatus = idx >= 0 ? statuses[(idx + 1) % statuses.length] : statuses[0];

    // 预算项：待购买 -> 已购买 时登记实际花费
    if (!isHouse && item.status === "待购买" && nextStatus === "已购买") {
      this.promptActualAmount(item);
      return;
    }
    // 预算项：已购买 -> 待购买 时清空实际花费
    const updateData = { status: nextStatus };
    if (!isHouse && item.status === "已购买") {
      updateData.actualAmount = 0;
    }

    this.callSharedData({ collection, action: "update", id, data: updateData })
      .then(() => {
        wx.showToast({ title: `已切换为「${nextStatus}」`, icon: "none" });
      })
      .catch((err) => {
        console.error("更新状态失败", err);
        wx.showToast({ title: err.message || "更新失败", icon: "none" });
      })
      .then(() => this.refreshData());
  },

  // 预算项购买时登记实际花费
  promptActualAmount(item) {
    const defaultText = item.budgetAmount ? String(item.budgetAmount) : "";
    wx.showModal({
      title: "登记实际花费",
      editable: true,
      placeholderText: defaultText ? `预算 ¥${item.budgetAmount}` : "输入实际花费金额",
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const input = (res.content || "").trim();
        let amount = item.actualAmount || 0;
        if (input !== "") {
          amount = Number(input);
          if (Number.isNaN(amount) || amount < 0) {
            wx.showToast({ title: "金额格式不正确", icon: "none" });
            return;
          }
        }
        this.callSharedData({
          collection: "budget_items",
          action: "update",
          id: item._id,
          data: { status: "已购买", actualAmount: amount },
        })
          .then(() => {
            wx.showToast({ title: "已登记", icon: "success" });
          })
          .catch((err) => {
            console.error("登记实际花费失败", err);
            wx.showToast({ title: err.message || "登记失败", icon: "none" });
          })
          .then(() => this.refreshData());
      },
    });
  },
});
