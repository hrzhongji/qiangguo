const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const QRCode = require("qrcode");
const store = require("./store");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan("tiny"));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

store.load();

const sseClients = new Set();

function originOf(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  return `${proto}://${req.get("host")}`;
}

function broadcast(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

/* ----------------------------- 访客端 ----------------------------- */

app.get("/api/bootstrap", (req, res) => {
  const origin = originOf(req);
  const hour = store.hourZh();
  res.send({
    code: 0,
    data: {
      card: store.publicCard(origin),
      persona: {
        name: store.db.persona.name,
        greeting: store.db.persona.greeting,
        voiceCloned: store.db.persona.voiceCloned,
        voiceSimilarity: store.db.persona.voiceSimilarity,
        skills: store.db.persona.skills,
        knowledgeCount: store.db.persona.knowledge.length,
        knowledge: store.db.persona.knowledge,
      },
      slots: store.slots(),
      server: {
        now: Date.now(),
        hour,
        offHours: hour < 9 || hour >= 20,
        timezone: "Asia/Shanghai",
      },
      stats: store.db.stats,
      shareUrl: origin + "/",
      origin,
    },
  });
});

app.post("/api/track", (req, res) => {
  try {
    const result = store.track(req.body || {});
    if (result.alert) {
      broadcast("alert", result.alert);
      broadcast("visitor", result.visitor);
    } else if (result.isNew || Math.random() < 0.35) {
      broadcast("visitor", result.visitor);
    }
    res.send({ code: 0, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).send({ code: 500, msg: "track failed" });
  }
});

app.post("/api/ai/chat", (req, res) => {
  const { visitorId, lang = "zh", messages = [] } = req.body || {};
  const data = store.aiReply({ visitorId, lang, messages });
  if (data.alert) {
    broadcast("alert", data.alert);
    broadcast("visitor", store.db.visitors.find((v) => v.id === visitorId));
  }
  res.send({ code: 0, data });
});

app.post("/api/leads", (req, res) => {
  const { visitorId = "v_guest", name, company, phone, need, lang = "zh" } = req.body || {};
  if (!name || !phone) {
    return res.status(400).send({ code: 400, msg: "请填写姓名与联系方式" });
  }
  const lead = {
    id: "l_" + Date.now(),
    visitorId,
    name,
    company: company || "未填写公司",
    phone,
    need: need || "",
    createdAt: Date.now(),
    status: "new",
    score: 0,
    lang,
  };
  const tr = store.track({ visitorId, type: "lead", module: "lead", label: "留下联系方式", name, company });
  lead.score = tr.visitor.score;
  const v = store.db.visitors.find((x) => x.id === visitorId);
  if (v) {
    v.name = name;
    v.company = company || v.company;
    v.note = need || v.note;
  }
  store.db.leads.unshift(lead);
  store.save();
  broadcast("lead", lead);
  broadcast("alert", tr.alert || { id: "al_" + Date.now(), visitorId, text: `${name} 留下了联系方式`, ts: Date.now(), level: tr.visitor.level });
  res.send({ code: 0, data: { lead, score: tr.visitor.score, level: tr.visitor.level } });
});

app.get("/api/slots", (req, res) => {
  res.send({ code: 0, data: store.slots() });
});

app.post("/api/appointments", (req, res) => {
  const { visitorId = "v_guest", name, phone, company, date, slot, mode = "线上" } = req.body || {};
  if (!name || !phone || !date || !slot) {
    return res.status(400).send({ code: 400, msg: "请补全预约信息" });
  }
  const taken = store.db.appointments.some((a) => a.date === date && a.slot === slot && a.status !== "cancelled");
  if (taken) {
    return res.status(409).send({ code: 409, msg: "该时段刚被约走，请换一个时间" });
  }
  const appt = {
    id: "a_" + Date.now(),
    visitorId,
    name,
    phone,
    company: company || "",
    date,
    slot,
    mode,
    createdAt: Date.now(),
    status: "confirmed",
  };
  store.db.appointments.unshift(appt);
  store.track({ visitorId, type: "book", module: "booking", label: "预约产线诊断", name, company });
  store.db.stats.conversion = 4.5;
  store.flush();
  broadcast("appointment", appt);
  res.send({ code: 0, data: appt });
});

app.post("/api/orders", (req, res) => {
  const { visitorId = "v_guest", name = "访客", company = "", productId, channel = "微信支付" } = req.body || {};
  const product = store.db.card.content.products.find((p) => p.id === productId);
  if (!product) return res.status(404).send({ code: 404, msg: "商品不存在" });
  const amount = Number(String(product.price).replace(/[^\d.]/g, "")) || 0;
  const order = {
    id: "o_" + Date.now(),
    visitorId,
    name,
    company,
    productId,
    productName: product.name,
    amount: amount ? amount * 10000 : 6800,
    currency: channel === "跨境支付" ? "USD" : "CNY",
    createdAt: Date.now(),
    status: "paid",
    channel,
  };
  store.db.orders.unshift(order);
  store.track({ visitorId, type: "order", module: "shop", label: "在线支付 · " + product.name, name, company });
  store.flush();
  broadcast("order", order);
  res.send({ code: 0, data: order });
});

app.get("/api/qr", async (req, res) => {
  const text = String(req.query.text || originOf(req) + "/");
  try {
    const buf = await QRCode.toBuffer(text, {
      margin: 1,
      width: 560,
      color: { dark: "#171310", light: "#F8F4EC" },
      errorCorrectionLevel: "H",
    });
    res.type("png").send(buf);
  } catch (err) {
    res.status(500).send("qr error");
  }
});

/* ----------------------------- 实时推送 ----------------------------- */

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: "hello", data: { ok: true }, ts: Date.now() })}\n\n`);
  sseClients.add(res);
  const timer = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch (e) {
      clearInterval(timer);
    }
  }, 25000);
  req.on("close", () => {
    clearInterval(timer);
    sseClients.delete(res);
  });
});

/* ----------------------------- 企业后台 ----------------------------- */

app.get("/api/admin/overview", (req, res) => {
  res.send({ code: 0, data: store.overview() });
});

app.get("/api/admin/card", (req, res) => {
  res.send({ code: 0, data: store.publicCard(originOf(req)) });
});

app.put("/api/admin/card", (req, res) => {
  const { bio, menu, owner, tags } = req.body || {};
  const card = store.db.card;
  if (bio) card.bio = { ...card.bio, ...bio };
  if (Array.isArray(menu)) card.menu = menu;
  if (Array.isArray(tags)) card.tags = tags;
  if (owner) card.owner = { ...card.owner, ...owner };
  store.flush();
  broadcast("card", { updated: true });
  res.send({ code: 0, data: store.publicCard(originOf(req)) });
});

app.post("/api/admin/kb", (req, res) => {
  const { title, titleEn, content, contentEn, category = "自定义", keywords = [] } = req.body || {};
  if (!title || !content) return res.status(400).send({ code: 400, msg: "缺少标题或内容" });
  const item = {
    id: "kb_" + Date.now(),
    title,
    titleEn: titleEn || title,
    category,
    content,
    contentEn: contentEn || content,
    keywords: keywords.length ? keywords : [title, ...String(content).slice(0, 24).split(/[，。；\s]+/)].filter(Boolean),
    custom: true,
    createdAt: Date.now(),
  };
  store.db.persona.knowledge.unshift(item);
  store.flush();
  broadcast("kb", { id: item.id });
  res.send({ code: 0, data: item });
});

app.delete("/api/admin/kb/:id", (req, res) => {
  const list = store.db.persona.knowledge;
  const idx = list.findIndex((k) => k.id === req.params.id);
  if (idx === -1) return res.status(404).send({ code: 404 });
  const [removed] = list.splice(idx, 1);
  store.flush();
  res.send({ code: 0, data: removed });
});

app.post("/api/admin/persona", (req, res) => {
  const { greeting, tone, voiceCloned, voiceSimilarity } = req.body || {};
  const p = store.db.persona;
  if (greeting) p.greeting = { ...p.greeting, ...greeting };
  if (tone) p.tone = tone;
  if (typeof voiceCloned === "boolean") p.voiceCloned = voiceCloned;
  if (voiceSimilarity) p.voiceSimilarity = voiceSimilarity;
  store.flush();
  res.send({ code: 0, data: p });
});

app.get("/api/admin/team", (req, res) => {
  res.send({ code: 0, data: store.db.team });
});

app.post("/api/admin/inherit", (req, res) => {
  const { toId } = req.body || {};
  const to = store.db.team.find((t) => t.id === toId);
  if (!to) return res.status(404).send({ code: 404, msg: "未找到继任者" });
  const card = store.db.card;
  const fromName = card.owner.name;
  card.formerOwner = {
    name: fromName,
    title: card.owner.title,
    leftAt: Date.now(),
    inheritedTo: to.name,
  };
  card.owner = {
    ...card.owner,
    name: to.name,
    nameEn: to.name,
    title: to.title,
    titleEn: to.title,
    avatarText: to.name.slice(0, 1),
    city: to.city,
    cityEn: to.city,
    email: `${to.id.replace("t_", "")}@chengming.tech`,
  };
  card.inheritedAt = Date.now();
  store.db.team.forEach((t) => {
    if (t.id === "t_shen") t.status = "left";
    t.owner = t.id === toId;
    if (t.id === toId) t.status = "active";
  });
  store.db.persona.greeting = {
    zh: `你好，我是${to.name}的 AI 数字分身。${fromName} 的项目资料与历史沟通记录已完整交接，关于产线降本、能耗优化和出海交付，都可以直接问我。`,
    en: `Hi, I am the AI digital twin of ${to.name}. ${fromName}'s project files and conversation history have been fully handed over. Ask me anything about cost, energy or global delivery.`,
  };
  const alert = {
    id: "al_" + Date.now(),
    visitorId: "system",
    text: `${fromName} 的名片已由 ${to.name} 继承，${to.clients || 0} 位历史客户同步更新联系人`,
    ts: Date.now(),
    level: "A",
  };
  store.db.alerts.unshift(alert);
  store.flush();
  broadcast("inherit", { from: fromName, to: to.name, card });
  broadcast("alert", alert);
  res.send({ code: 0, data: { card: store.publicCard(originOf(req)), team: store.db.team } });
});

app.post("/api/admin/reset", (req, res) => {
  store.reset();
  res.send({ code: 0, data: { ok: true } });
});

app.post("/api/admin/demo/visit", (req, res) => {
  const pool = [
    { name: "陆承宇", company: "昆山德盛精密", role: "运营副总", profile: "manufacturing", module: "case", label: "苏州降本案例" },
    { name: "何静", company: "苏州联塑科技", role: "设备总监", profile: "manufacturing", module: "energy", label: "能耗优化方案" },
    { name: "Kevin Wu", company: "SinoParts 泰国", role: "Operations Lead", profile: "overseas", module: "overseas", label: "出海交付案例" },
    { name: "许文", company: "常州华工", role: "IT 经理", profile: "manufacturing", module: "pricing", label: "产品与报价" },
  ];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const visitorId = "v_demo_" + Date.now();
  const seq = [
    { type: "view", module: "home", label: "打开名片" },
    { type: "dwell", module: "intro", label: "阅读个人简介", duration: 42 },
    { type: "module", module: pick.module, label: pick.label },
    { type: "dwell", module: pick.module, label: pick.label, duration: 96 },
    { type: "chat", module: "ai", label: "向 AI 分身提问" },
    { type: "module", module: "booking", label: "查看预约时段" },
  ];
  let last;
  seq.forEach((payload, i) => {
    last = store.track({
      visitorId,
      ...payload,
      name: pick.name,
      company: pick.company,
      profile: pick.profile,
    });
  });
  const v = store.db.visitors.find((x) => x.id === visitorId);
  v.role = pick.role;
  v.note = `刚刚重点查看「${pick.label}」，并主动咨询 AI 分身。`;
  v.lastSeen = Date.now();
  store.flush();
  const alert = {
    id: "al_" + Date.now(),
    visitorId,
    text: `${pick.name}（${pick.company}）正在查看「${pick.label}」，意向分 ${v.score}`,
    ts: Date.now(),
    level: v.level,
  };
  store.db.alerts.unshift(alert);
  broadcast("visitor", v);
  broadcast("alert", alert);
  res.send({ code: 0, data: { visitor: v, alert } });
});

// 小程序 / 独立站兜底
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("晒名片 running on " + port);
});
