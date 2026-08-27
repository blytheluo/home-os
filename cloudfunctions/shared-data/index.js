// 云函数：shared-data
// 用途：共享数据读写（house_items / budget_items / ledger_items 的增删改查）
// 说明：集合权限为"仅管理端可读写"，客户端通过本云函数访问数据
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 允许操作的集合白名单
const ALLOWED_COLLECTIONS = ["house_items", "budget_items", "ledger_items", "handover_items", "project_settings"];

// 只读集合（不允许前端增删改）
const READONLY_COLLECTIONS = ["project_settings"];

// 允许的操作（只保留稳定的增删改查，移除临时种子/清理操作）
const ALLOWED_ACTIONS = ["list", "add", "bulkAdd", "bulkRemove", "syncRenovation", "syncHandover", "update", "remove"];

// 各集合允许写入的字段白名单
const ALLOWED_FIELDS = {
  house_items: ["title", "category", "type", "status", "content", "owner", "sort", "projectId", "sourceKey", "source"],
  budget_items: ["title", "category", "budgetAmount", "actualAmount", "status", "vendor", "note", "projectId", "sourceKey", "source"],
  ledger_items: ["date", "month", "title", "amount", "kind", "important", "note", "projectId", "sourceKey", "source"],
  handover_items: ["phase", "timeline", "title", "content", "status", "sort", "projectId", "sourceKey", "source"],
};

// 允许的枚举值
const HOUSE_CATEGORIES = ["厨房", "西厨", "客厅", "卧室", "书房", "阳台", "其他"];
const HOUSE_TYPES = ["事项", "决策", "待办"];
const HOUSE_STATUSES = ["待确认", "进行中", "已完成", "已确定", "已放弃"];
const BUDGET_STATUSES = ["待购买", "已购买"];
const LEDGER_KINDS = ["支出", "收入"];
const HANDOVER_STATUSES = ["未开始", "进行中", "已完成"];

// 禁止客户端写入的字段
const FORBIDDEN_FIELDS = ["_id", "_openid", "createdAt", "updatedAt"];

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  // 身份校验：小程序调用云函数必然有 openid
  if (!OPENID) {
    return { code: -1, message: "无法获取调用者身份" };
  }

  const { collection, action } = event;

  // 参数校验
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return { code: -1, message: `不允许的集合: ${collection}` };
  }
  if (!ALLOWED_ACTIONS.includes(action)) {
    return { code: -1, message: `不支持的操作: ${action}` };
  }
  if (READONLY_COLLECTIONS.includes(collection) && action !== "list") {
    return { code: -1, message: `${collection} 仅支持读取，不支持 ${action}` };
  }

  try {
    switch (action) {
      case "list":
        return await listItems(event);
      case "add":
        return await addItem(event);
      case "bulkAdd":
        return await bulkAddItems(event);
      case "bulkRemove":
        return await bulkRemoveItems(event);
      case "syncRenovation":
        return await syncRenovationItems(event);
      case "syncHandover":
        return await syncHandoverItems(event);
      case "update":
        return await updateItem(event);
      case "remove":
        return await removeItem(event);
      default:
        return { code: -1, message: "未知操作" };
    }
  } catch (err) {
    console.error("[shared-data] 操作失败", err);
    return { code: -1, message: err.message || "操作失败" };
  }
};

// 是否为有效的非负有限数字
function isValidNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// 校验并清洗写入数据：返回 { ok, data } 或 { ok: false, message }
function sanitizeData(collection, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "数据格式不正确" };
  }

  const allowed = ALLOWED_FIELDS[collection] || [];
  const clean = {};

  for (const key of Object.keys(data)) {
    if (FORBIDDEN_FIELDS.includes(key)) {
      return { ok: false, message: `不允许写入字段: ${key}` };
    }
    if (!allowed.includes(key)) {
      return { ok: false, message: `集合 ${collection} 不支持字段: ${key}` };
    }
    clean[key] = data[key];
  }

  // 分类校验（可选字段，若提供则必须在允许值内）
  if (clean.category != null && clean.category !== "") {
    if (collection === "house_items") {
      if (!HOUSE_CATEGORIES.includes(clean.category)) {
        return { ok: false, message: `不允许的事项分类: ${clean.category}` };
      }
    } else if (collection === "budget_items") {
      // 预算分类允许自定义（与 project_settings.categoryBudgets 对齐），不硬编码
    }
  }

  if (collection === "house_items") {
    if (clean.type != null && clean.type !== "" && !HOUSE_TYPES.includes(clean.type)) {
      return { ok: false, message: `不允许的事项类型: ${clean.type}` };
    }
    if (clean.status != null && clean.status !== "" && !HOUSE_STATUSES.includes(clean.status)) {
      return { ok: false, message: `不允许的事项状态: ${clean.status}` };
    }
  }

  if (collection === "budget_items") {
    if (clean.budgetAmount != null && !isValidNonNegativeNumber(clean.budgetAmount)) {
      return { ok: false, message: "budgetAmount 必须是大于等于 0 的有限数字" };
    }
    if (clean.actualAmount != null && !isValidNonNegativeNumber(clean.actualAmount)) {
      return { ok: false, message: "actualAmount 必须是大于等于 0 的有限数字" };
    }
    if (clean.status != null && clean.status !== "" && !BUDGET_STATUSES.includes(clean.status)) {
      return { ok: false, message: `不允许的预算状态: ${clean.status}` };
    }
  }

  if (collection === "ledger_items") {
    if (clean.amount != null && (typeof clean.amount !== "number" || !Number.isFinite(clean.amount) || clean.amount < 0)) {
      return { ok: false, message: "amount 必须是大于等于 0 的有限数字" };
    }
    if (clean.kind != null && clean.kind !== "" && !LEDGER_KINDS.includes(clean.kind)) {
      return { ok: false, message: `不允许的记账类型: ${clean.kind}` };
    }
    if (clean.important != null && typeof clean.important !== "boolean") {
      return { ok: false, message: "important 必须是布尔值" };
    }
  }

  if (collection === "handover_items") {
    if (clean.status != null && clean.status !== "" && !HANDOVER_STATUSES.includes(clean.status)) {
      return { ok: false, message: `不允许的交房清单状态: ${clean.status}` };
    }
    if (clean.sort != null && (!Number.isInteger(clean.sort) || clean.sort < 0)) {
      return { ok: false, message: "sort 必须是非负整数" };
    }
  }

  return { ok: true, data: clean };
}

// 查询列表
async function listItems(event) {
  const { collection } = event;
  const where = event.where || {};
  const orderBy = event.orderBy;
  const limit = Math.min(Number(event.limit) || 50, 200);
  const skip = Number(event.skip) || 0;

  let query = db.collection(collection).where(where);
  if (orderBy && orderBy.field) {
    query = query.orderBy(orderBy.field, orderBy.direction === "desc" ? "desc" : "asc");
  }
  const res = await query.skip(skip).limit(limit).get();
  return { code: 0, data: res.data };
}

// 新增
async function addItem(event) {
  const { collection, data } = event;
  const cleaned = sanitizeData(collection, data);
  if (!cleaned.ok) {
    return { code: -1, message: cleaned.message };
  }

  const now = db.serverDate();
  const record = {
    ...cleaned.data,
    createdAt: now,
    updatedAt: now,
  };

  const res = await db.collection(collection).add({ data: record });
  return { code: 0, id: res._id };
}

// 批量新增（用于粘贴导入，限制数量避免误操作）
// 仅允许 ledger_items 使用批量导入
async function bulkAddItems(event) {
  const { collection, dataList } = event;
  if (collection !== "ledger_items") {
    return { code: -1, message: "bulkAdd 仅支持 ledger_items 集合" };
  }
  if (!Array.isArray(dataList) || !dataList.length || dataList.length > 200) {
    return { code: -1, message: "一次只能导入 1-200 条记录" };
  }

  let inserted = 0;
  let skipped = 0;

  for (const data of dataList) {
    const cleaned = sanitizeData(collection, data);
    if (!cleaned.ok) return { code: -1, message: cleaned.message };

    // 依据 sourceKey 去重：已存在则跳过，不删除已有记录
    const sourceKey = cleaned.data.sourceKey;
    if (sourceKey) {
      const exist = await db
        .collection(collection)
        .where({ sourceKey })
        .count();
      if (exist.total > 0) {
        skipped += 1;
        continue;
      }
    }

    const now = db.serverDate();
    await db.collection(collection).add({
      data: { ...cleaned.data, createdAt: now, updatedAt: now },
    });
    inserted += 1;
  }

  return { code: 0, inserted, skipped };
}

// 批量删除：仅允许删除 ledger_items，避免误操作其他集合
async function bulkRemoveItems(event) {
  const { collection, ids } = event;
  if (collection !== "ledger_items") {
    return { code: -1, message: "bulkRemove 仅支持 ledger_items 集合" };
  }
  if (!Array.isArray(ids) || !ids.length || ids.length > 200 || ids.some((id) => typeof id !== "string" || !id)) {
    return { code: -1, message: "一次只能删除 1-200 条有效记录" };
  }
  const uniqueIds = [...new Set(ids)];
  await Promise.all(uniqueIds.map((id) => db.collection(collection).doc(id).remove()));
  return { code: 0, deleted: uniqueIds.length };
}

// 同步装修文档的新版本：按 sourceKey 更新内容，不覆盖用户已经修改的状态。
// 仅供当前项目的装修事项使用，避免重复导入产生副本。
async function syncRenovationItems(event) {
  const { collection, dataList } = event;
  if (collection !== "house_items") {
    return { code: -1, message: "syncRenovation 仅支持 house_items 集合" };
  }
  if (!Array.isArray(dataList) || !dataList.length || dataList.length > 50) {
    return { code: -1, message: "装修事项同步数量不正确" };
  }

  let inserted = 0;
  let updated = 0;
  for (const data of dataList) {
    const cleaned = sanitizeData(collection, data);
    if (!cleaned.ok || !cleaned.data.sourceKey) {
      return { code: -1, message: cleaned.ok ? "装修事项缺少 sourceKey" : cleaned.message };
    }
    const existing = await db.collection(collection).where({ sourceKey: cleaned.data.sourceKey }).limit(1).get();
    const nextData = { ...cleaned.data };
    delete nextData.status;
    if (existing.data && existing.data.length) {
      await db.collection(collection).doc(existing.data[0]._id).update({
        data: { ...nextData, updatedAt: db.serverDate() },
      });
      updated += 1;
    } else {
      await db.collection(collection).add({
        data: { ...cleaned.data, status: data.status || "待确认", createdAt: db.serverDate(), updatedAt: db.serverDate() },
      });
      inserted += 1;
    }
  }
  return { code: 0, inserted, updated };
}

// 按 sourceKey 初始化/更新交房后30天清单，保留用户已经修改的完成状态。
async function syncHandoverItems(event) {
  const { collection, dataList } = event;
  if (collection !== "handover_items") {
    return { code: -1, message: "syncHandover 仅支持 handover_items 集合" };
  }
  if (!Array.isArray(dataList) || !dataList.length || dataList.length > 100) {
    return { code: -1, message: "交房清单同步数量不正确" };
  }
  let inserted = 0;
  let updated = 0;
  for (const data of dataList) {
    const cleaned = sanitizeData(collection, data);
    if (!cleaned.ok || !cleaned.data.sourceKey) {
      return { code: -1, message: cleaned.ok ? "交房清单缺少 sourceKey" : cleaned.message };
    }
    const existing = await db.collection(collection).where({ sourceKey: cleaned.data.sourceKey }).limit(1).get();
    const nextData = { ...cleaned.data };
    delete nextData.status;
    if (existing.data && existing.data.length) {
      await db.collection(collection).doc(existing.data[0]._id).update({
        data: { ...nextData, updatedAt: db.serverDate() },
      });
      updated += 1;
    } else {
      await db.collection(collection).add({
        data: { ...cleaned.data, status: data.status || "未开始", createdAt: db.serverDate(), updatedAt: db.serverDate() },
      });
      inserted += 1;
    }
  }
  return { code: 0, inserted, updated };
}

// 更新
async function updateItem(event) {
  const { collection, id, data } = event;
  if (!id || typeof id !== "string") {
    return { code: -1, message: "缺少记录 id" };
  }
  const cleaned = sanitizeData(collection, data);
  if (!cleaned.ok) {
    return { code: -1, message: cleaned.message };
  }

  const record = {
    ...cleaned.data,
    updatedAt: db.serverDate(),
  };

  const res = await db.collection(collection).doc(id).update({ data: record });
  return { code: 0, updated: res.stats.updated };
}

// 删除
async function removeItem(event) {
  const { collection, id } = event;
  if (!id || typeof id !== "string") {
    return { code: -1, message: "缺少记录 id" };
  }
  await db.collection(collection).doc(id).remove();
  return { code: 0 };
}
