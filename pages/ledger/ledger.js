Page({
  data: {
    loading: true,
    loadError: false,
    loadErrorMessage: "",
    month: "",
    monthLabel: "",
    items: [],
    showForm: false,
    showImport: false,
    submitting: false,
    importing: false,
    selectionMode: false,
    selectedIds: [],
    selectedCount: 0,
    form: { date: "", title: "", amount: "", kind: "支出", important: false, note: "" },
    importText: "",
    summary: { expenseText: "0.00", incomeText: "0.00", balanceText: "0.00", count: 0 },
    kinds: ["支出", "收入"],
  },

  onLoad() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    this.setMonth(month);
  },

  onPullDownRefresh() {
    this.loadItems().then(() => wx.stopPullDownRefresh());
  },

  setMonth(month) {
    const [year, number] = month.split("-");
    this.setData({ month, monthLabel: `${year}年${Number(number)}月` }, () => this.loadItems());
  },

  changeMonth(e) {
    this.setMonth(e.detail.value);
  },

  callSharedData(payload) {
    return wx.cloud.callFunction({ name: "shared-data", data: payload }).then((res) => {
      const result = res.result || {};
      if (result.code !== 0) throw new Error(result.message || "操作失败");
      return result;
    });
  },

  async loadItems() {
    this.setData({ loading: true, loadError: false, loadErrorMessage: "" });
    try {
      const res = await this.callSharedData({
        collection: "ledger_items", action: "list", limit: 200,
        where: { month: this.data.month }, orderBy: { field: "date", direction: "desc" },
      });
      const items = (res.data || []).map((item) => ({
        ...item,
        selected: false,
        displayDate: item.date ? item.date.slice(5) : "",
        amountText: this.formatMoney(item.amount),
        amountPrefix: item.kind === "收入" ? "+" : "−",
        kindClass: item.kind === "收入" ? "income" : "expense",
      }));
      const expense = items.filter((i) => i.kind !== "收入").reduce((s, i) => s + Number(i.amount || 0), 0);
      const income = items.filter((i) => i.kind === "收入").reduce((s, i) => s + Number(i.amount || 0), 0);
      this.setData({ items, loading: false, selectedIds: [], selectedCount: 0, selectionMode: false, summary: {
        expenseText: this.formatMoney(expense), incomeText: this.formatMoney(income),
        balanceText: this.formatMoney(income - expense), count: items.length,
      }});
    } catch (err) {
      console.error("账本加载失败", err);
      this.setData({
        loading: false,
        loadError: true,
        loadErrorMessage: err.message || "账本加载失败",
      });
    }
  },

  formatMoney(value) { return (Number(value) || 0).toFixed(2); },

  openForm() {
    this.setData({ showForm: true, form: { date: `${this.data.month}-01`, title: "", amount: "", kind: "支出", important: false, note: "" }});
  },

  closeForm() { if (!this.data.submitting) this.setData({ showForm: false }); },

  onInput(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }); },

  changeKind(e) { this.setData({ "form.kind": this.data.kinds[Number(e.detail.value)] }); },

  toggleImportant() { this.setData({ "form.important": !this.data.form.important }); },

  async submitForm() {
    const form = this.data.form;
    const amount = Number(form.amount);
    if (!form.title.trim()) return wx.showToast({ title: "请填写项目", icon: "none" });
    if (!form.date) return wx.showToast({ title: "请选择日期", icon: "none" });
    if (!Number.isFinite(amount) || amount < 0) return wx.showToast({ title: "金额格式不正确", icon: "none" });
    this.setData({ submitting: true });
    try {
      await this.callSharedData({ collection: "ledger_items", action: "add", data: {
        date: form.date, month: this.data.month, title: form.title.trim(), amount,
        kind: form.kind, important: form.important, note: form.note.trim(), projectId: "home-os",
      }});
      this.setData({ showForm: false, submitting: false });
      await this.loadItems();
      wx.showToast({ title: "已记录", icon: "success" });
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({ title: err.message || "保存失败", icon: "none" });
    }
  },

  openImport() { this.setData({ showImport: true, importText: "" }); },
  closeImport() { if (!this.data.importing) this.setData({ showImport: false }); },
  closeOverlay() { if (!this.data.submitting && !this.data.importing) this.setData({ showForm: false, showImport: false }); },
  onImportInput(e) { this.setData({ importText: e.detail.value }); },

  // 月份英文缩写 -> 数字
  monthAbbrMap: {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  },

  monthNameMap: {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  },

  // 识别形如 "B2026-Aug" 的月份标题，返回 "2026-08"；无法识别返回 null
  parseMonthHeader(line) {
    const value = line.trim();
    const numeric = value.match(/^[A-Za-z]?(\d{4})[-/年\s]?(\d{1,2})月?$/);
    if (numeric) {
      return `${numeric[1]}-${String(Number(numeric[2])).padStart(2, "0")}`;
    }
    const named = value.match(/^[A-Za-z]?(\d{4})[-\s]?([A-Za-z]{3,9})$/i);
    if (!named) return null;
    const year = named[1];
    const normalized = named[2].charAt(0).toUpperCase() + named[2].slice(1).toLowerCase();
    const shortName = normalized.slice(0, 3);
    const monthNumber = this.monthNameMap[normalized] || this.monthAbbrMap[shortName];
    if (!monthNumber) return null;
    return `${year}-${String(monthNumber).padStart(2, "0")}`;
  },

  // 将 "8.1" / "8.20" 解析为完整日期（基于给定月份）
  parseDayDate(dayStr, month) {
    const day = String(dayStr).trim();
    if (!/^\d{1,2}$/.test(day)) return null;
    const [year, monthNumber] = month.split("-");
    return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
  },

  parseImport(text) {
    // 默认使用当前选中月份
    let currentMonth = this.data.month;
    const lines = (text || "").split(/\n/);

    // 记录同一基础 key 的出现次数，用于生成稳定的 sourceKey
    const occurrenceMap = {};

    const records = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue; // 跳过空行

      // 1) 月份标题行，如 "B2026-Aug"、"B2026-July"、"2026年7月"
      // 直接调用解析器，不再用只允许三位缩写的外层正则拦截。
      const headerMonth = this.parseMonthHeader(line);
      if (headerMonth) {
        currentMonth = headerMonth;
        continue; // 标题行不当作账单记录
      }

      // 2) 普通账单行，如 "8.1 拖地干巾 22.32"
      //    日期(月.日) + 标题 + 金额，分隔符支持 Tab / 多个空格
      const match = line.match(/^(\d{1,2})[.．](\d{1,2})\s+(.+?)\s+([+−\-]?\d+(?:\.\d+)?)$/);
      if (!match) continue; // 无法识别的行直接跳过

      const day = match[2];
      const date = this.parseDayDate(day, currentMonth);
      if (!date) continue;

      const rawTitle = match[3].trim();
      const important = rawTitle.includes("❗") || rawTitle.includes("!");
      const title = rawTitle.replace(/[❗!️]/g, "").trim();
      if (!title) continue;

      const rawAmount = match[4].replace(/[−\-]/g, (c) => (c === "−" ? "-" : c));
      const amount = Math.abs(Number(rawAmount));
      if (!Number.isFinite(amount)) continue;
      const kind = match[4].trim().startsWith("+") ? "收入" : "支出";

      // 生成稳定 sourceKey：ledger:月份:日期:项目:金额:类型:出现次数
      const baseKey = `ledger:${currentMonth}:${date}:${title}:${amount}:${kind}`;
      const occurrence = (occurrenceMap[baseKey] || 0) + 1;
      occurrenceMap[baseKey] = occurrence;
      const sourceKey = `${baseKey}:${occurrence}`;

      records.push({
        date,
        month: currentMonth,
        title,
        amount,
        kind,
        important,
        note: "备忘录导入",
        projectId: "home-os",
        source: "iPhone备忘录",
        sourceKey,
      });
    }
    return records;
  },

  async submitImport() {
    const records = this.parseImport(this.data.importText);
    if (!records.length) {
      wx.showToast({ title: "没有识别到有效记录", icon: "none" });
      return;
    }
    // 导入前确认识别到的记录数量
    wx.showModal({
      title: "确认导入",
      content: `识别到 ${records.length} 笔记录，确认导入吗？`,
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ importing: true });
        try {
          const result = await this.callSharedData({ collection: "ledger_items", action: "bulkAdd", dataList: records });
          const inserted = result.inserted || 0;
          const skipped = result.skipped || 0;
          const importedMonth = records[0].month;
          const [importYear, importNumber] = importedMonth.split("-");
          this.setData({
            importing: false,
            showImport: false,
            month: importedMonth,
            monthLabel: `${importYear}年${Number(importNumber)}月`,
          });
          await this.loadItems();
          const tip = skipped > 0
            ? `新增 ${inserted} 笔，跳过 ${skipped} 笔重复记录`
            : `已导入 ${inserted} 笔`;
          wx.showToast({ title: tip, icon: "none" });
        } catch (err) {
          this.setData({ importing: false });
          wx.showToast({ title: err.message || "导入失败", icon: "none" });
        }
      },
    });
  },

  toggleSelectionMode() {
    const enabled = !this.data.selectionMode;
    this.setData({ selectionMode: enabled, selectedIds: [], selectedCount: 0 });
  },

  handleItemTap(e) {
    if (!this.data.selectionMode) return;
    this.toggleSelection(e.currentTarget.dataset.id);
  },

  toggleSelection(id) {
    const selected = this.data.selectedIds.slice();
    const index = selected.indexOf(id);
    if (index >= 0) selected.splice(index, 1);
    else selected.push(id);
    const items = this.data.items.map((item) => ({ ...item, selected: selected.includes(item._id) }));
    this.setData({ items, selectedIds: selected, selectedCount: selected.length });
  },

  toggleSelectAll() {
    const allIds = this.data.items.map((item) => item._id);
    const isAll = allIds.length && allIds.every((id) => this.data.selectedIds.includes(id));
    const selectedIds = isAll ? [] : allIds;
    const items = this.data.items.map((item) => ({ ...item, selected: selectedIds.includes(item._id) }));
    this.setData({ items, selectedIds, selectedCount: selectedIds.length });
  },

  async deleteSelected() {
    const ids = this.data.selectedIds || [];
    if (!ids.length) {
      wx.showToast({ title: "请先选择记录", icon: "none" });
      return;
    }
    const confirmed = await new Promise((resolve) => wx.showModal({
      title: "批量删除",
      content: `确定删除选中的 ${ids.length} 笔记录吗？`,
      success: (res) => resolve(res.confirm),
    }));
    if (!confirmed) return;
    try {
      await this.callSharedData({ collection: "ledger_items", action: "bulkRemove", ids });
      this.setData({ selectionMode: false, selectedIds: [], selectedCount: 0 });
      await this.loadItems();
      wx.showToast({ title: "删除完成", icon: "success" });
    } catch (err) {
      wx.showToast({ title: err.message || "删除失败", icon: "none" });
    }
  },

  async removeItem(e) {
    const id = e.currentTarget.dataset.id;
    const confirmed = await new Promise((resolve) => wx.showModal({ title: "删除记录", content: "确定删除这笔记录吗？", success: (res) => resolve(res.confirm) }));
    if (!confirmed) return;
    try { await this.callSharedData({ collection: "ledger_items", action: "remove", id }); await this.loadItems(); } catch (err) { wx.showToast({ title: err.message || "删除失败", icon: "none" }); }
  },
});
