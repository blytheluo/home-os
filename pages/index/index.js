// index.js
const RENOVATION_CONTEXT_VERSION = "V1.5";
const RENOVATION_ITEMS_V15 = [
  { sourceKey: "md:厨房-洗碗机布局", title: "厨房洗碗机布局", category: "厨房", type: "事项", content: "方太 JBCD6E-04-G6 17套洗碗机，优先布局为灶具上方、洗碗机位于灶具下方，中间增加隔板；上方薄抽屉是否保留，需确认散热、承重和水电条件。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 1 },
  { sourceKey: "md:厨房-冰箱与功能型电器柜", title: "厨房冰箱与功能型电器柜", category: "厨房", type: "事项", content: "左侧适配海信606L白色十字门冰箱与功能型电器柜，电器柜放置微波炉、空气炸锅及日常功能电器；与客餐厅西厨设备分工，不重复。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 2 },
  { sourceKey: "md:厨房-水槽区备菜台面", title: "水槽区连续备菜台面", category: "厨房", type: "事项", content: "右侧水槽区尽量保留连续、较长的备菜台面；移除台式洗碗机后，规划 MUJI 双层沥水架、刀具收纳和砧板位置，优先使用抽屉。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 3 },
  { sourceKey: "md:厨房-台面与保留项评估", title: "厨房柜体与台面方案", category: "厨房", type: "决策", content: "METOD米多柜体 + VÅRSTA沃托普柜门 + 白色有纹理人造石台面 + 不锈钢把手，厨房预算约2万元。保留精装燃气灶、油烟机、水槽、厨下净水器和状态良好的固定吊柜；垃圾处理器暂不安装，仅预留条件。最终以现场复尺和安装条件为准。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 4 },
  { sourceKey: "md:西厨-收纳", title: "西厨设备与收纳", category: "西厨", type: "事项", content: "西厨负责咖啡、烘焙和生活展示，放置咖啡机、烤箱、厨师机、养生壶等设备；不与厨房功能型电器柜重复。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 5 },
  { sourceKey: "md:西厨-餐边柜", title: "西厨 TONSTAD 餐边区", category: "西厨", type: "待办", content: "当前优先 TONSTAD 120/121cm餐边柜 + 约80/82cm四斗抽屉柜，总长约202cm、深47cm、高约91cm。咖啡机约20kg，需向宜家确认顶板长期承重；承重、尺寸和安装条件确认前不锁定。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 6 },
  { sourceKey: "md:西厨-墙面收纳", title: "西厨特色柜与搁板", category: "西厨", type: "待办", content: "TONSTAD旁倾向约80cm IKEA PS松木/竹质特色柜，替代原125cm STOCKHOLM藤编柜。餐边柜上方暂保留两个错落的FJÄLLBO/耶伯长条搁板，木色板面+黑色细金属线条。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 7 },
  { sourceKey: "md:客厅-沙发餐桌", title: "客厅与餐厅家具", category: "客厅", type: "决策", content: "客厅配置海信 E5Q Ultra 75寸 Mini LED电视，电视墙挂，搭配210cm胡桃木纹EKET悬空电视柜，暂不配回音壁。餐厅使用源氏木语黑胡桃榫卯餐桌1600×800mm、两把木椅和1400mm长凳，保持留白。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 8 },
  { sourceKey: "md:主卧-床与床垫", title: "主卧床、床垫与收纳", category: "卧室", type: "事项", content: "库嘉顿米白色箱体床180×200cm，床尾留白；衣柜集中侧墙。床垫备选IKEA VATNESTRÖM 180×200cm，偏好支撑性更强、偏硬的睡感，需与床体匹配确认；床尾配置STRANDMON红褐色脚凳。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 9 },
  { sourceKey: "md:次卧-衣柜", title: "次卧箱体床与衣柜", category: "卧室", type: "事项", content: "配置1.5m箱体床，父母偶尔居住并兼顾未来儿童房；增加宜达奈121×211cm风琴门衣柜和诺德里四斗抽屉柜，预留床体、开门及通行空间。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 10 },
  { sourceKey: "md:书房-收纳与布局", title: "书房桌、床与收纳", category: "书房", type: "事项", content: "房间约5.64㎡。左侧配置MITTZON橡木贴面+白色电动腿升降桌120×60cm；40cm窄BILLY靠飘窗左墙，开放面朝门；右侧预留SLÄKT约90×200cm床位。桌上方暂不做搁板，预留行李箱和露营装备位置。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 11 },
  { sourceKey: "md:阳台-家务区", title: "阳台家政与清洗区", category: "阳台", type: "待办", content: "阳台采用METOD柜体，门板可与厨房统一VOXTORP亮白，台面倾向SÄLJAN浅木纹。配置水池，用于清洗咖啡机配件及日常杂物；保持空间通透。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 12 },
  { sourceKey: "md:阳台-柜体与防水", title: "阳台水槽与防水节点", category: "阳台", type: "待办", content: "安装前确认水池尺寸、开孔位置、下水、龙头、检修空间及洗烘设备关系；施工重点做好水槽开孔、台面接缝、靠墙收口和防水。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 13 },
  { sourceKey: "md:全屋-窗帘方向", title: "全屋窗帘与软装配色", category: "其他", type: "决策", content: "全屋采用白纱帘 + 浅色遮光材质；不使用绿色窗帘，主卧仅以绿色作为小面积软装点缀。飘窗暂不统一做软垫，入住后按实际使用决定。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 14 },
  { sourceKey: "md:全屋-照明优化", title: "全屋照明方案", category: "其他", type: "事项", content: "客厅简洁圆形吸顶灯，餐厅IKEA巴诗通吊灯；主卧STOCKHOLM吊灯+ÅRSTID壁灯×2；次卧KRANBALK吸顶灯+单侧KORVSNÖRE壁灯；书房简洁吸顶灯，不选风扇灯。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 15 },
  { sourceKey: "md:全屋-飘窗护栏", title: "飘窗护栏确认", category: "其他", type: "待办", content: "飘窗内侧护栏待物业确认后，再评估是否拆除；飘窗石材台面保留。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 16 },
  { sourceKey: "md:全屋-软装与可移动物品", title: "软装与可移动物品", category: "其他", type: "事项", content: "走廊大毛毡生活档案板保留并搬入新家，具体悬挂位置入住后确定；旧木质阅读架保留为可移动家具；绿色Midjourney动画画优先放入书房。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 17 },
  { sourceKey: "md:二楼-排水返水风险", title: "二楼排水与返水风险", category: "其他", type: "待办", content: "4-201为二楼东边套，当前确认不是独立排水，卫生间为同层排水，厨房已有开发商止逆阀。交房后向物业索取给排水平面图、系统图和同层排水节点图，并现场核对公共立管、架空层转横管、检查口及本户接管关系。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 18 },
  { sourceKey: "md:二楼-止逆阀处理", title: "止逆阀暂不采购", category: "其他", type: "待办", content: "不按二楼直接推导全屋装阀，也不提前购买止逆阀。图纸和现场确认后，再由专业师傅评估厨房、主卫、公卫和阳台的关键保护点；安装后做通水、反向止水和可检修性验收。", projectId: "home-os", source: "4-201_Renovation_Context_V1.md V1.5", sort: 19 },
];

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
    this.syncLatestRenovation().finally(() => this.loadAll());
  },

  async syncLatestRenovation() {
    const syncKey = "renovation-context-version";
    if (wx.getStorageSync(syncKey) === RENOVATION_CONTEXT_VERSION) return;
    try {
      await this.callSharedData({ collection: "house_items", action: "syncRenovation", dataList: RENOVATION_ITEMS_V15 });
      wx.setStorageSync(syncKey, RENOVATION_CONTEXT_VERSION);
    } catch (err) {
      console.error("装修文档同步失败", err);
    }
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
