Page({
  data: {
    loading: true,
    loadError: false,
    totalBudgetText: "0.00",
    totalActualText: "0.00",
    remainingText: "0.00",
    houseDone: 0,
    houseTotal: 0,
    pendingCount: 0,
    recentItems: [],
  },

  onShow() {
    this.loadOverview();
  },

  callList(collection, options = {}) {
    return wx.cloud.callFunction({
      name: "shared-data",
      data: {
        collection,
        action: "list",
        limit: options.limit || 50,
        orderBy: options.orderBy,
      },
    }).then((res) => {
      const result = res.result || {};
      if (result.code !== 0) {
        throw new Error(result.message || `${collection} 加载失败`);
      }
      return result.data || [];
    });
  },

  async loadOverview() {
    this.setData({ loading: true, loadError: false });
    try {
      const [houseItems, budgetItems, settings] = await Promise.all([
        this.callList("house_items", { limit: 50, orderBy: { field: "updatedAt", direction: "desc" } }),
        this.callList("budget_items", { limit: 50, orderBy: { field: "updatedAt", direction: "desc" } }),
        this.callList("project_settings", { limit: 1 }),
      ]);
      const setting = settings[0] || {};
      const totalBudget = Number(setting.totalBudget) || 0;
      const totalActual = budgetItems.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0);
      const houseDone = houseItems.filter((item) => item.status === "已完成").length;
      const pendingCount = houseItems.filter((item) => item.status === "待确认").length;
      const recentItems = houseItems.slice(0, 3).map((item) => ({
        ...item,
        statusClass: this.statusClass(item.status),
      }));
      this.setData({
        totalBudgetText: this.formatMoney(totalBudget),
        totalActualText: this.formatMoney(totalActual),
        remainingText: this.formatMoney(totalBudget - totalActual),
        houseDone,
        houseTotal: houseItems.length,
        pendingCount,
        recentItems,
        loading: false,
      });
    } catch (err) {
      console.error("首页概览加载失败", err);
      this.setData({ loading: false, loadError: true });
    }
  },

  statusClass(status) {
    const map = {
      待确认: "pending",
      进行中: "doing",
      已完成: "done",
      已确定: "confirmed",
      已放弃: "dropped",
    };
    return map[status] || "pending";
  },

  formatMoney(value) {
    const parts = (Number(value) || 0).toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  },
});
