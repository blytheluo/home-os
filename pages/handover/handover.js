const HANDOVER_VERSION = "30天清单-V1";
const HANDOVER_ITEMS = [
  ["交房前准备", "交房前 1-2 周", "预约交房并准备资料", "确认宜家厨房拆旧/安装边界，家电送装周期，物业工程部、护栏拆除、水电师傅和窗帘商家。"],
  ["交房前准备", "交房前 1-2 周", "整理交房资料", "准备交房资料、户型图、最终设计、家电尺寸、联系人和预约记录。"],
  ["交房前准备", "交房前 1-2 周", "确认首批进场顺序", "先安排验房、测量和保护，再安排拆除、水电和柜体复尺。"],
  ["验房与复尺", "D0 当天", "全屋拍照与录像", "重点拍摄墙面、地板、门套、电梯、地漏、插座、灯、厨卫、阳台和窗边，记录问题位置和时间。"],
  ["验房与复尺", "D0 当天", "记录开发商问题", "发现问题时记录位置、时间、照片和报修单号，不自行拆改。"],
  ["验房与复尺", "D0-D3", "索取排水与立管图", "向物业工程部索取给排水平面图、排水系统/立管图和同层排水节点图。"],
  ["验房与复尺", "D0-D3", "核对架空层管线", "到架空层查看立管转横管、检查口和接管走向，并与图纸对应。"],
  ["验房与复尺", "D0-D3", "完成全屋最终复尺", "复核厨房、阳台、PAX、玄关柜、电视柜、TONSTAD、西厨和书房尺寸。"],
  ["保护与基础施工", "D2-D5", "完成全屋成品保护", "地板、门套、电梯、地漏和已完成墙面做好保护，拆除和搬运后检查。"],
  ["保护与基础施工", "D2-D10", "确认排水防返水方案", "结合图纸和现场评估厨房、主卫、公卫、阳台的关键保护点，不提前购买止逆阀。"],
  ["保护与基础施工", "D2-D10", "确认厨房现有止逆阀", "确认型号、位置、保护范围、可检修性和是否覆盖关键支管。"],
  ["保护与基础施工", "D2-D10", "确认拆除边界", "物业允许后再拆护栏；按家具现场条件确认油烟机、灶具、水池和原柜体责任边界。"],
  ["保护与基础施工", "D3-D7", "完成水电调整", "按最终家具和家电图核对插座、水电、灯具、冰箱、洗碗机和阳台用水点。"],
  ["保护与基础施工", "D3-D7", "完成墙面修补", "开槽、拆护栏和拆柜后的墙面/窗台/孔洞及时修补，并记录墙漆色号。"],
  ["柜体与灯具", "D8-D18", "安装厨房 METOD", "确认柜体、VOXTORP/VÅRSTA柜门、台面、洗碗机、灶具下隔板和连续备菜区。"],
  ["柜体与灯具", "D8-D15", "安装阳台 METOD", "确认洗烘设备、水槽、SÄLJAN台面、下水和靠墙收口防水。"],
  ["柜体与灯具", "D10-D18", "安装 PAX 与玄关柜", "复核柜体垂直、门缝、开门方向和通行距离，避免遮挡窗帘或过道。"],
  ["柜体与灯具", "D10-D18", "完成灯具安装", "确认灯具位置、开关和通电；餐厅、主卧、次卧和书房按最终方案安装。"],
  ["柜体与灯具", "D10-D20", "完成窗帘复尺", "确认窗洞、轨道长度、高度、窗帘开合和与柜体/门的关系。"],
  ["家具与家电", "D15-D25", "首批家具进场", "先安排床、PAX、沙发、餐桌等基础家具，进场后继续保护地板和墙面。"],
  ["家具与家电", "D18-D24", "确认家具摆位", "按最终布局确认沙发、餐桌、EKET、TONSTAD、IKEA PS、书桌和书柜位置。"],
  ["家具与家电", "D18-D25", "家电进场安装", "确认电视、冰箱、洗烘机、洗碗机和咖啡区设备的插座、水、排水、散热和检修。"],
  ["家具与家电", "D20-D26", "书房布局确认", "确认 MITTZON、BILLY、床位和露营收纳关系；书桌上方暂不增加搁板。"],
  ["收尾与入住", "D23-D28", "安装电视与窗帘", "电视最后定位，确认墙挂、线路、路由器/光猫和窗帘不与柜门打架。"],
  ["收尾与入住", "D26-D30", "完成精保洁", "柜内、抽屉、家电后方、地板、窗台和墙面完成精细清洁。"],
  ["收尾与入住", "D26-D30", "全屋通水通电测试", "测试插座、灯具、冰箱、洗碗机、洗烘机、阳台水槽、地漏和下水。"],
  ["收尾与入住", "入住前最后10分钟", "完成入住前检查", "确认门窗、地板、沙发、电视、资料箱、说明书、备用五金和保修凭证归位。"],
  ["收尾与入住", "D28+", "搬家并保留记录", "按顺序搬家，保留包装、说明书、订单和验收照片，入住后再处理软装细节。"],
].map((item, index) => ({
  phase: item[0], timeline: item[1], title: item[2], content: item[3],
  status: "未开始", sort: index + 1, projectId: "home-os",
  sourceKey: `handover30:${index + 1}`, source: "4-201_交房后30天执行清单.pdf",
}));

Page({
  data: {
    loading: true, loadError: false, items: [], phases: [], total: 0, done: 0,
    progressText: "0/0", progressPercent: 0, progressStyle: "width: 0%;", version: HANDOVER_VERSION,
  },

  onLoad() { this.syncAndLoad(); },
  onPullDownRefresh() { this.loadItems().then(() => wx.stopPullDownRefresh()); },

  callSharedData(payload) {
    return wx.cloud.callFunction({ name: "shared-data", data: payload }).then((res) => {
      const result = res.result || {};
      if (result.code !== 0) throw new Error(result.message || "操作失败");
      return result;
    });
  },

  async syncAndLoad() {
    if (wx.getStorageSync("handover-context-version") !== HANDOVER_VERSION) {
      try {
        await this.callSharedData({ collection: "handover_items", action: "syncHandover", dataList: HANDOVER_ITEMS });
        wx.setStorageSync("handover-context-version", HANDOVER_VERSION);
      } catch (err) { console.error("交房清单初始化失败", err); }
    }
    this.loadItems();
  },

  async loadItems() {
    this.setData({ loading: true, loadError: false });
    try {
      const res = await this.callSharedData({ collection: "handover_items", action: "list", limit: 100, orderBy: { field: "sort", direction: "asc" } });
      const items = res.data || [];
      const done = items.filter((item) => item.status === "已完成").length;
      const phases = [];
      items.forEach((item) => {
        let group = phases.find((phase) => phase.name === item.phase);
        if (!group) { group = { name: item.phase, items: [], done: 0, total: 0, open: true }; phases.push(group); }
        group.items.push(item);
        group.total += 1;
        if (item.status === "已完成") group.done += 1;
      });
      const percent = items.length ? Math.round((done / items.length) * 100) : 0;
      this.setData({ items, phases, done, total: items.length, progressText: `${done}/${items.length}`, progressPercent: percent, progressStyle: `width: ${percent}%;`, loading: false });
    } catch (err) {
      console.error("交房清单加载失败", err);
      this.setData({ loading: false, loadError: true });
    }
  },

  togglePhase(e) {
    const index = Number(e.currentTarget.dataset.index);
    const phases = this.data.phases.slice();
    phases[index].open = !phases[index].open;
    this.setData({ phases });
  },

  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.items.find((entry) => entry._id === id);
    if (!item) return;
    const nextStatus = item.status === "已完成" ? "未开始" : "已完成";
    this.callSharedData({ collection: "handover_items", action: "update", id, data: { status: nextStatus } })
      .then(() => this.loadItems())
      .catch((err) => wx.showToast({ title: err.message || "更新失败", icon: "none" }));
  },
});
