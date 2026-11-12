/**
 * 晒名片 · 数据层
 * 轻量 JSON 持久化，便于在云托管 / 本地直接运行演示。
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "storage");
const DB_FILE = path.join(DATA_DIR, "db.json");

const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function dateKeyZh(ts = Date.now()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

function hourZh(ts = Date.now()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      hour: "numeric",
      hour12: false,
    }).format(new Date(ts))
  );
}

function seedTrend() {
  const views = [86, 112, 97, 143, 168, 201, 236];
  const leads = [3, 5, 4, 8, 9, 12, 14];
  return views.map((v, i) => {
    const ts = now - (6 - i) * DAY;
    return {
      date: dateKeyZh(ts),
      views: v,
      visitors: Math.round(v * 0.62),
      leads: leads[i],
      chats: Math.round(leads[i] * 2.4),
    };
  });
}

function ev(ts, type, module, label, duration = 0) {
  return { ts, type, module, label, duration };
}

function makeVisitor(v) {
  const events = [
    ev(now - 6 * DAY, "view", "home", "打开名片"),
    ev(now - 5 * DAY, "dwell", "intro", "阅读个人简介", 46),
    ev(now - 3 * DAY, "module", v.module, v.moduleLabel),
    ev(now - 2 * DAY, "view", "home", "再次访问"),
    ev(now - 2 * DAY, "dwell", v.module, v.moduleLabel, v.dwell),
    ev(now - 30 * MIN, "module", v.module, v.moduleLabel),
    ev(now - 12 * MIN, "dwell", v.module, v.moduleLabel, 110),
  ];
  if (v.chat) {
    events.push(ev(now - 20 * MIN, "chat", "ai", "与 AI 分身对话"));
    events.push(ev(now - 18 * MIN, "lead", "lead", "留下联系方式"));
  }
  return {
    id: v.id,
    name: v.name,
    company: v.company,
    role: v.role,
    source: v.source || "名片二维码",
    city: v.city || "苏州",
    profile: v.profile || "manufacturing",
    avatarColor: v.color,
    firstSeen: now - (v.days || 3) * DAY,
    lastSeen: now - (v.ago || 12) * MIN,
    visits: v.visits || 2,
    score: v.score,
    level: levelOf(v.score),
    events,
    note: v.note || "",
  };
}

function seedVisitors() {
  return [
    makeVisitor({
      id: "v_zhangming",
      name: "张明",
      company: "苏州精密制造",
      role: "生产总监",
      score: 86,
      dwell: 320,
      module: "case",
      moduleLabel: "苏州降本案例",
      visits: 3,
      ago: 4,
      days: 5,
      chat: true,
      color: "#FF5A1F",
      profile: "manufacturing",
      note: "反复查看「成本下降 23%」案例与报价页，已留资。",
    }),
    makeVisitor({
      id: "v_lihui",
      name: "李慧",
      company: "宁波华塑集团",
      role: "设备经理",
      score: 72,
      dwell: 260,
      module: "energy",
      moduleLabel: "能耗优化方案",
      visits: 2,
      ago: 18,
      days: 4,
      color: "#2E7D5B",
      profile: "manufacturing",
      note: "关注能耗优化，询问了交付周期。",
    }),
    makeVisitor({
      id: "v_nguyen",
      name: "Nguyen Van An",
      company: "Vinatech 越南",
      role: "Plant Manager",
      score: 64,
      dwell: 188,
      module: "overseas",
      moduleLabel: "出海交付案例",
      visits: 2,
      ago: 66,
      days: 6,
      color: "#2B5F8A",
      profile: "overseas",
      note: "英文浏览为主，关注越南 MES 交付。",
    }),
    makeVisitor({
      id: "v_wangtao",
      name: "王涛",
      company: "无锡精工",
      role: "采购经理",
      score: 51,
      dwell: 142,
      module: "pricing",
      moduleLabel: "产品与报价",
      visits: 2,
      ago: 130,
      days: 3,
      color: "#8A6A2F",
      profile: "manufacturing",
    }),
    makeVisitor({
      id: "v_chenlu",
      name: "陈露",
      company: "远山资本",
      role: "投资经理",
      score: 38,
      dwell: 96,
      module: "intro",
      moduleLabel: "公司与团队简介",
      visits: 1,
      ago: 220,
      days: 2,
      color: "#6B5B95",
      profile: "investor",
    }),
    makeVisitor({
      id: "v_zhaoqi",
      name: "赵启",
      company: "常州新材",
      role: "总经理",
      score: 29,
      dwell: 70,
      module: "cert",
      moduleLabel: "资质证书",
      visits: 1,
      ago: 320,
      days: 2,
      color: "#7A5C4B",
      profile: "manufacturing",
    }),
    makeVisitor({
      id: "v_sunyue",
      name: "孙悦",
      company: "杭州智造",
      role: "工艺工程师",
      score: 22,
      dwell: 54,
      module: "video",
      moduleLabel: "产线数字孪生视频",
      visits: 1,
      ago: 430,
      days: 1,
      color: "#3E6B6B",
      profile: "manufacturing",
    }),
    makeVisitor({
      id: "v_zhoukai",
      name: "周凯",
      company: "昆山模具",
      role: "创始人",
      score: 17,
      dwell: 36,
      module: "home",
      moduleLabel: "名片首页",
      visits: 1,
      ago: 620,
      days: 1,
      color: "#5C5C5C",
      profile: "manufacturing",
    }),
  ];
}

function levelOf(score) {
  if (score >= 75) return "A";
  if (score >= 45) return "B";
  return "C";
}

function seedDb() {
  return {
    meta: { createdAt: now, version: 1 },
    card: {
      slug: "shenzhiyuan",
      owner: {
        name: "沈知远",
        nameEn: "Shen Zhiyuan",
        title: "智能制造解决方案总监",
        titleEn: "Director, Smart Manufacturing Solutions",
        company: "澄明科技",
        companyEn: "CHENGMING TECH",
        avatarText: "沈",
        phone: "138 1688 0326",
        email: "zhiyuan.shen@chengming.tech",
        wechat: "zhiyuan_cm",
        city: "苏州 · 上海",
        cityEn: "Suzhou · Shanghai",
      },
      formerOwner: null,
      inheritedAt: null,
      stats: { views: 2486, connections: 318, rating: 4.9 },
      tags: [
        { zh: "智能制造", en: "Smart Manufacturing" },
        { zh: "降本增效", en: "Cost Reduction" },
        { zh: "出海交付", en: "Global Delivery" },
      ],
      bio: {
        zh: "在制造业一线做了 12 年数字化落地。我帮工厂把「看不见的浪费」变成可量化的数据：一条产线、一套系统、一支能陪跑的团队。如果你的工厂正卡在产能、能耗或交付上，欢迎直接和我的数字分身聊聊——它读过我全部的项目笔记。",
        en: "12 years on the factory floor turning invisible waste into measurable data — one line, one system, one team that stays. If capacity, energy or delivery is your bottleneck, talk to my digital twin. It has read every project note I have.",
      },
      highlights: [
        { value: "12年", valueEn: "12 yrs", label: "制造业一线", labelEn: "On the floor" },
        { value: "120+", valueEn: "120+", label: "服务工厂", labelEn: "Factories" },
        { value: "23%", valueEn: "23%", label: "最高综合降本", labelEn: "Cost cut" },
      ],
      menu: [
        { id: "site", label: "官方网站", labelEn: "Website", icon: "globe", url: "https://chengming.example.com", desc: "公司与解决方案总览", descEn: "Company & solutions" },
        { id: "deck", label: "产品图册", labelEn: "Product deck", icon: "book", url: "https://chengming.example.com/deck", desc: "2026 智能制造产品册", descEn: "2026 solution deck" },
        { id: "event", label: "活动报名", labelEn: "Events", icon: "calendar", url: "https://chengming.example.com/events", desc: "11 月工厂降本闭门会", descEn: "Nov factory cost workshop" },
        { id: "miniapp", label: "微信小程序", labelEn: "Mini Program", icon: "wechat", url: "#miniapp", desc: "在微信内打开完整名片", descEn: "Open in WeChat" },
      ],
      content: {
        intro: {
          zh: "澄明科技成立于 2016 年，专注离散制造的数字孪生与能耗优化。我们不卖「大而全」的系统，而是用 4–6 周先跑通一条产线，用数据证明价值，再逐步复制。",
          en: "Founded in 2016, CHENGMING focuses on digital twins and energy optimisation for discrete manufacturing. We do not sell one-size-fits-all platforms — we prove value on one line in 4–6 weeks, then scale.",
        },
        products: [
          {
            id: "twinline",
            name: "TwinLine 产线数字孪生",
            nameEn: "TwinLine Digital Twin",
            desc: "3D 还原产线节拍，提前发现瓶颈与空转浪费。",
            descEn: "A 3D replica of your line rhythm, exposing bottlenecks before they cost you.",
            price: "¥28.8 万起",
            priceEn: "from ¥288k",
            badge: "旗舰",
            badgeEn: "Flagship",
            icon: "cube",
            tone: "orange",
            featured: true,
          },
          {
            id: "ecopilot",
            name: "EcoPilot 能耗优化",
            nameEn: "EcoPilot Energy AI",
            desc: "重点设备能耗实时监测，AI 给出可执行的调优建议。",
            descEn: "Real-time energy monitoring with AI actions your shift team can actually run.",
            price: "¥12.6 万起",
            priceEn: "from ¥126k",
            badge: "高回报",
            badgeEn: "Fast ROI",
            icon: "bolt",
            tone: "green",
            featured: true,
          },
          {
            id: "flowmes",
            name: "FlowMES 轻量版",
            nameEn: "FlowMES Lite",
            desc: "4 周上线，为 50–300 人的工厂准备的 MES。",
            descEn: "Live in 4 weeks, built for factories of 50–300 people.",
            price: "¥6.8 万起",
            priceEn: "from ¥68k",
            badge: "快上线",
            badgeEn: "Fast go-live",
            icon: "layers",
            tone: "blue",
            featured: false,
          },
          {
            id: "global",
            name: "出海交付陪跑",
            nameEn: "Global Delivery",
            desc: "越南 / 泰国 / 印尼工厂落地，中英越三语交付。",
            descEn: "Vietnam, Thailand and Indonesia roll-outs with CN / EN / VN delivery.",
            price: "按项目定制",
            priceEn: "Custom",
            badge: "跨境",
            badgeEn: "Cross-border",
            icon: "globe",
            tone: "ink",
            featured: false,
          },
        ],
        cases: [
          {
            id: "suzhou",
            metric: "23%",
            metricLabel: "综合成本下降",
            metricLabelEn: "lower total cost",
            title: "苏州精密制造 · 6 个月降本 23%",
            titleEn: "Suzhou Precision · 23% lower cost in 6 months",
            desc: "3 条产线、480 台设备接入，OEE 从 61% 提升到 78%，库存周转加快 19%。",
            descEn: "3 lines, 480 machines connected. OEE 61% → 78%, inventory turns up 19%.",
            tags: ["降本", "数字孪生"],
            tagsEn: ["Cost", "Digital twin"],
            tone: "orange",
            industry: "manufacturing",
            duration: "6 个月",
            durationEn: "6 months",
          },
          {
            id: "ningbo",
            metric: "17%",
            metricLabel: "单厂能耗下降",
            metricLabelEn: "lower energy use",
            title: "宁波注塑集团 · 年省电费 420 万",
            titleEn: "Ningbo Injection · ¥4.2M saved per year",
            desc: "12 个车间、86 台高耗能设备实时监测，空压与注塑环节调优。",
            descEn: "12 workshops and 86 energy-heavy machines monitored; compressed air and moulding optimised.",
            tags: ["能耗", "高回报"],
            tagsEn: ["Energy", "ROI"],
            tone: "green",
            industry: "manufacturing",
            duration: "4 个月",
            durationEn: "4 months",
          },
          {
            id: "vietnam",
            metric: "4周",
            metricLabel: "完成 MES 上线",
            metricLabelEn: "to MES go-live",
            title: "越南电子厂 · 中越双语交付",
            titleEn: "Vietnam Electronics · bilingual delivery",
            desc: "跨时区远程 + 驻场结合，良率提升 5.2%，交付周期缩短 11%。",
            descEn: "Remote plus on-site delivery across time zones. Yield +5.2%, lead time −11%.",
            tags: ["出海", "MES"],
            tagsEn: ["Global", "MES"],
            tone: "blue",
            industry: "overseas",
            duration: "4 周",
            durationEn: "4 weeks",
          },
        ],
        certificates: [
          { id: "iso", title: "ISO 9001", sub: "质量管理体系认证", subEn: "Quality management", icon: "shield" },
          { id: "hitech", title: "国家高新技术企业", sub: "2023–2026", subEn: "High-tech enterprise", icon: "star" },
          { id: "aaa", title: "AAA 级供应商", sub: "智能制造解决方案", subEn: "Solution provider", icon: "award" },
          { id: "ip", title: "12 项软件著作权", sub: "核心算法自研", subEn: "Proprietary algorithms", icon: "file" },
        ],
        videos: [
          { id: "v1", title: "3 分钟看懂产线数字孪生", titleEn: "Digital twin in 3 minutes", duration: "03:12", tone: "orange" },
          { id: "v2", title: "苏州工厂实地回访", titleEn: "Suzhou factory revisit", duration: "05:48", tone: "ink" },
          { id: "v3", title: "东南亚交付日记", titleEn: "SE Asia delivery diary", duration: "02:36", tone: "blue" },
        ],
      },
      statsNote: "本月名片被查看 2,486 次 · 318 位访客建立连接",
    },
    persona: {
      name: "知远 · 数字分身",
      tone: "专业、直接、像一个懂工厂的老朋友",
      greeting: {
        zh: "你好，我是沈知远的 AI 数字分身。我看过他 47 个项目的复盘笔记，关于产线降本、能耗优化和出海交付，都可以直接问我。",
        en: "Hi, I am the AI digital twin of Shen Zhiyuan. I have read all 47 of his project reviews. Ask me anything about cost reduction, energy optimisation or global delivery.",
      },
      voiceCloned: true,
      voiceSimilarity: 96.2,
      skills: ["产线诊断", "方案报价", "案例匹配", "预约安排"],
      knowledge: [
        {
          id: "kb_company",
          title: "公司介绍",
          titleEn: "Company overview",
          category: "公司",
          content: "澄明科技成立于 2016 年，总部苏州，在上海、深圳、胡志明市设有交付团队。累计服务 120+ 家制造企业，聚焦离散制造的数字孪生、能耗优化与轻量 MES。",
          contentEn: "CHENGMING was founded in 2016, headquartered in Suzhou with delivery teams in Shanghai, Shenzhen and Ho Chi Minh City. 120+ manufacturers served, focused on digital twins, energy optimisation and lightweight MES.",
          keywords: ["公司", "介绍", "澄明", "团队", "company", "about", "who"],
        },
        {
          id: "kb_twin",
          title: "TwinLine 产线数字孪生",
          titleEn: "TwinLine digital twin",
          category: "产品",
          content: "TwinLine 用 3D 孪生还原产线节拍与物流路径，接入 PLC / 传感器数据，提前定位瓶颈、空转和换型浪费。标准交付 4–6 周，价格 28.8 万起。",
          contentEn: "TwinLine replicates line rhythm and material flow in 3D, connecting PLC and sensor data to expose bottlenecks, idle time and changeover waste. Standard delivery 4–6 weeks, from ¥288k.",
          keywords: ["数字孪生", "TwinLine", "产线", "瓶颈", "3D", "digital twin", "line", "bottleneck"],
        },
        {
          id: "kb_eco",
          title: "EcoPilot 能耗优化",
          titleEn: "EcoPilot energy",
          category: "产品",
          content: "EcoPilot 对空压、注塑、制冷等高耗能环节做分钟级监测，AI 给出调优建议。平均节能 12–18%，通常 8–14 个月回本，价格 12.6 万起。",
          contentEn: "EcoPilot monitors compressed air, moulding and cooling at minute-level, with AI tuning actions. Average 12–18% energy savings, payback in 8–14 months, from ¥126k.",
          keywords: ["能耗", "节能", "电费", "空压", "注塑", "energy", "saving", "electricity", "EcoPilot"],
        },
        {
          id: "kb_mes",
          title: "FlowMES 轻量版",
          titleEn: "FlowMES Lite",
          category: "产品",
          content: "FlowMES 面向 50–300 人的中小工厂，4 周上线，覆盖工单、报工、质检、追溯。支持中英双语，价格 6.8 万起。",
          contentEn: "FlowMES targets factories of 50–300 people, live in 4 weeks, covering work orders, reporting, quality and traceability. Bilingual, from ¥68k.",
          keywords: ["MES", "工单", "报工", "质检", "追溯", "FlowMES", "lightweight"],
        },
        {
          id: "kb_case_sz",
          title: "苏州精密制造降本案例",
          titleEn: "Suzhou precision cost case",
          category: "案例",
          content: "苏州精密制造客户：3 条产线、480 台设备，6 个月综合成本下降 23%，OEE 从 61% 提升至 78%，库存周转加快 19%。项目分三期，首期 5 周上线。",
          contentEn: "Suzhou precision manufacturer: 3 lines, 480 machines, 23% lower total cost in 6 months, OEE 61% to 78%, inventory turns +19%. Delivered in three phases, first live in 5 weeks.",
          keywords: ["苏州", "精密", "降本", "23%", "OEE", "案例", "case", "suzhou", "cost"],
        },
        {
          id: "kb_case_nb",
          title: "宁波注塑能耗案例",
          titleEn: "Ningbo injection energy case",
          category: "案例",
          content: "宁波注塑集团：12 个车间、86 台高耗能设备接入 EcoPilot，单厂能耗下降 17%，年省电费 420 万元，4 个月完成。",
          contentEn: "Ningbo injection group: 12 workshops, 86 heavy machines on EcoPilot, 17% lower plant energy, ¥4.2M annual savings, delivered in 4 months.",
          keywords: ["宁波", "注塑", "能耗", "17%", "420", "ningbo", "energy"],
        },
        {
          id: "kb_price",
          title: "报价与交付周期",
          titleEn: "Pricing & timeline",
          category: "商务",
          content: "典型项目 28–45 万，按诊断、试点、复制三期交付。首期通常 4–6 周。支持按单条产线试点，试点费用可抵扣后续合同。",
          contentEn: "Typical projects run ¥280k–450k, delivered in three phases: diagnosis, pilot, scale. First phase usually 4–6 weeks. Single-line pilots available and credited to the full contract.",
          keywords: ["报价", "价格", "多少钱", "预算", "费用", "周期", "交付", "price", "cost", "quote", "budget", "timeline"],
        },
        {
          id: "kb_book",
          title: "免费产线诊断与预约",
          titleEn: "Free line diagnosis",
          category: "商务",
          content: "每周二、周四下午提供 30 分钟免费产线诊断，线上或到厂均可。建议提前准备产能、能耗、OEE 三组数据，诊断后 48 小时内给出初步建议书。",
          contentEn: "Free 30-minute line diagnosis every Tuesday and Thursday afternoon, online or on-site. Bring capacity, energy and OEE data; a preliminary proposal follows within 48 hours.",
          keywords: ["预约", "诊断", "见面", "拜访", "时间", "book", "meeting", "diagnosis", "visit"],
        },
        {
          id: "kb_global",
          title: "出海与多语言交付",
          titleEn: "Global & multilingual delivery",
          category: "出海",
          content: "在越南、泰国、印尼交付过 17 个项目，团队支持中文、英文、越南语。可处理跨境合同与付款，支持独立站与微信生态双入口。",
          contentEn: "17 projects delivered across Vietnam, Thailand and Indonesia, with CN / EN / VN teams. Cross-border contracts and payments supported, plus standalone and WeChat entry points.",
          keywords: ["出海", "越南", "泰国", "印尼", "跨境", "多语言", "global", "vietnam", "overseas", "cross-border"],
        },
        {
          id: "kb_trust",
          title: "资质与售后",
          titleEn: "Credentials & support",
          category: "公司",
          content: "ISO 9001、国家高新技术企业、智能制造 AAA 级供应商、12 项软件著作权。项目上线后 7×24 响应，季度回访。",
          contentEn: "ISO 9001, national high-tech enterprise, AAA smart manufacturing supplier, 12 software copyrights. 7×24 support and quarterly reviews after go-live.",
          keywords: ["资质", "证书", "售后", "服务", "ISO", "专利", "credential", "support", "certificate"],
        },
      ],
    },
    team: [
      { id: "t_shen", name: "沈知远", title: "智能制造解决方案总监", role: "owner", status: "active", city: "苏州", clients: 86, color: "#FF5A1F", cardSlug: "shenzhiyuan", owner: true },
      { id: "t_gu", name: "顾清", title: "华东销售负责人", role: "sales", status: "active", city: "上海", clients: 64, color: "#2E7D5B", cardSlug: "guqing" },
      { id: "t_tang", name: "唐亦然", title: "海外交付经理", role: "delivery", status: "active", city: "胡志明", clients: 31, color: "#2B5F8A", cardSlug: "tangyiran" },
      { id: "t_zhou", name: "周牧", title: "海外业务经理", role: "sales", status: "left", city: "深圳", clients: 38, color: "#8A6A2F", cardSlug: "zhoumu", leftAt: now - 12 * DAY },
    ],
    visitors: seedVisitors(),
    leads: [
      { id: "l_1", visitorId: "v_zhangming", name: "张明", company: "苏州精密制造", phone: "139****2210", need: "三条产线的降本诊断，Q4 想完成试点。", createdAt: now - 26 * MIN, status: "new", score: 86 },
      { id: "l_2", visitorId: "v_lihui", name: "李慧", company: "宁波华塑集团", phone: "137****8062", need: "注塑车间能耗优化报价。", createdAt: now - 3 * HOUR, status: "following", score: 72 },
    ],
    appointments: [
      { id: "a_1", visitorId: "v_lihui", name: "李慧", company: "宁波华塑集团", date: dateKeyZh(now + DAY), slot: "14:00", mode: "线上", createdAt: now - 4 * HOUR, status: "confirmed" },
    ],
    orders: [
      { id: "o_1", visitorId: "v_nguyen", name: "Nguyen Van An", company: "Vinatech 越南", productId: "global", productName: "出海交付陪跑 · 诊断包", amount: 6800, currency: "CNY", createdAt: now - 2 * DAY, status: "paid", channel: "跨境支付" },
      { id: "o_2", visitorId: "v_wangtao", name: "王涛", company: "无锡精工", productId: "flowmes", productName: "FlowMES 试点 · 10 用户", amount: 16800, currency: "CNY", createdAt: now - 5 * HOUR, status: "paid", channel: "微信支付" },
    ],
    chats: {
      v_zhangming: [
        { role: "user", content: "你们做过和我们规模差不多的精密制造工厂吗？", ts: now - 32 * MIN },
        { role: "assistant", content: "做过。苏州有一家精密制造客户和你们很像：3 条产线、480 台设备。6 个月综合成本下降 23%，OEE 从 61% 提升到 78%。他们一开始也只是想解决换型慢的问题。", ts: now - 31 * MIN },
      ],
    },
    stats: {
      todayViews: 236,
      weekViews: 1043,
      weekLeads: 43,
      liveNow: 3,
      heatAlerts: 2,
      conversion: 4.2,
    },
    trend: seedTrend(),
    alerts: [
      { id: "al_1", visitorId: "v_zhangming", text: "张明 反复查看「苏州降本案例」第 4 次，意向分 86", ts: now - 4 * MIN, level: "A" },
      { id: "al_2", visitorId: "v_lihui", text: "李慧 预约了周四 14:00 的线上诊断", ts: now - 3 * HOUR, level: "B" },
    ],
  };
}

let db = null;
let saveTimer = null;

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      db.card.stats.views = db.card.stats.views || 2486;
      return db;
    }
  } catch (err) {
    console.error("读取数据失败，使用种子数据", err);
  }
  db = seedDb();
  flush();
  return db;
}

function flush() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("数据持久化失败", err);
  }
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 120);
}

function reset() {
  db = seedDb();
  flush();
  return db;
}

const MODULE_WEIGHT = {
  home: 3,
  intro: 4,
  case: 12,
  energy: 14,
  pricing: 15,
  product: 10,
  cert: 6,
  video: 8,
  shop: 12,
  booking: 15,
  contact: 10,
  ai: 8,
  lead: 10,
};

function scoreDelta(type, module = "", duration = 0) {
  if (type === "view") return 8;
  if (type === "return") return 10;
  if (type === "dwell") return Math.min(22, Math.round(Math.min(duration, 180) / 8));
  if (type === "module") return MODULE_WEIGHT[module] || 5;
  if (type === "chat") return 14;
  if (type === "lead") return 35;
  if (type === "book") return 45;
  if (type === "order") return 55;
  if (type === "share") return 8;
  if (type === "nfc") return 12;
  if (type === "lang") return 2;
  return 0;
}

function findOrCreateVisitor({ visitorId, name, company, profile }) {
  let v = db.visitors.find((x) => x.id === visitorId);
  let isNew = false;
  if (!v) {
    isNew = true;
    const colors = ["#FF5A1F", "#2E7D5B", "#2B5F8A", "#8A6A2F", "#6B5B95", "#3E6B6B"];
    v = {
      id: visitorId,
      name: name || "新访客",
      company: company || "未填写公司",
      role: "访客",
      source: "名片链接",
      city: "未知",
      profile: profile || "manufacturing",
      avatarColor: colors[db.visitors.length % colors.length],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      visits: 1,
      score: 0,
      level: "C",
      events: [],
      note: "",
    };
    db.visitors.unshift(v);
    db.stats.todayViews += 1;
  } else if (visitorId && Date.now() - v.lastSeen > 30 * MIN) {
    v.visits += 1;
  }
  return { visitor: v, isNew };
}

function track(payload) {
  const { visitorId, type, module = "home", label = "", duration = 0, name, company, profile } = payload;
  const { visitor, isNew } = findOrCreateVisitor({ visitorId, name, company, profile });
  const prevLevel = visitor.level;
  const delta = scoreDelta(type, module, duration);
  const oldScore = visitor.score;
  visitor.score = Math.min(99, Math.max(0, visitor.score + delta));
  visitor.level = levelOf(visitor.score);
  visitor.lastSeen = Date.now();
  if (profile) visitor.profile = profile;
  if (type === "module") visitor.visits = Math.max(visitor.visits, 1);
  visitor.events.push({
    ts: Date.now(),
    type,
    module,
    label: label || module,
    duration,
    delta,
  });
  if (visitor.events.length > 120) visitor.events = visitor.events.slice(-120);

  db.card.stats.views += type === "view" ? 1 : 0;
  db.stats.todayViews += type === "view" ? 1 : 0;
  db.stats.weekViews += type === "view" ? 1 : 0;

  let alert = null;
  if (
    type === "lead" ||
    type === "book" ||
    type === "order" ||
    (visitor.score >= 75 && prevLevel !== "A")
  ) {
    alert = {
      id: "al_" + Date.now(),
      visitorId: visitor.id,
      text:
        type === "lead"
          ? `${visitor.name} 留下了联系方式，意向分 ${visitor.score}`
          : type === "book"
          ? `${visitor.name} 提交了预约，意向分 ${visitor.score}`
          : type === "order"
          ? `${visitor.name} 完成了在线支付`
          : `${visitor.name} 意向升级为 A（${visitor.score} 分），正在看「${label || module}」`,
      ts: Date.now(),
      level: visitor.level,
    };
    db.alerts.unshift(alert);
    db.alerts = db.alerts.slice(0, 20);
    if (visitor.level === "A") {
      db.stats.heatAlerts += 1;
      visitor.note = visitor.note || `高意向：连续访问「${label || module}」。`;
    }
  }

  save();
  return { ok: true, visitor, delta, oldScore, isNew, alert };
}

function publicCard(origin) {
  const c = db.card;
  return {
    ...c,
    shareUrl: origin ? `${origin}/` : "/",
    qrUrl: `/api/qr?text=${encodeURIComponent(origin ? origin + "/" : "/")}`,
    avatarMonogram: c.owner.avatarText,
  };
}

function findKb(query) {
  const q = String(query || "").toLowerCase();
  return db.persona.knowledge
    .map((item) => {
      let score = 0;
      for (const kw of item.keywords) {
        if (q.includes(String(kw).toLowerCase())) score += 2;
      }
      for (const token of q.split(/[\s,，。？?！!、]+/)) {
        if (token.length > 1 && (item.content + item.title).toLowerCase().includes(token)) score += 1;
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, 2);
}

function detectProfile(text) {
  const q = String(text || "").toLowerCase();
  if (/(出海|海外|越南|泰国|印尼|跨境|vietnam|overseas|global|cross)/.test(q)) return "overseas";
  if (/(投资|融资|估值|资本|invest|fund|valuation)/.test(q)) return "investor";
  if (/(合作|代理|渠道|partner|reseller)/.test(q)) return "partner";
  if (/(工厂|产线|制造|降本|能耗|oee|产线|factory|line|manufactur|cost|energy)/.test(q)) return "manufacturing";
  return null;
}

function aiReply({ visitorId, lang = "zh", messages = [] }) {
  const isEn = lang === "en";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser ? lastUser.content : "";
  const profile = detectProfile(text) || (db.visitors.find((v) => v.id === visitorId) || {}).profile || "manufacturing";
  const userTurns = messages.filter((m) => m.role === "user").length;
  const hour = hourZh();
  const offHours = hour < 9 || hour >= 20;
  const kb = findKb(text);
  const q = text.toLowerCase();
  const visitor = db.visitors.find((v) => v.id === visitorId);
  const scoreBefore = visitor ? visitor.score : 0;

  let reply = "";
  let suggestions = [];
  let intent = "general";

  const has = (re) => re.test(q);

  if (has(/(报价|价格|多少钱|预算|费用|price|cost|quote|budget|how much)/)) {
    intent = "pricing";
    reply = isEn
      ? "For a plant of your scale, digital twin plus energy optimisation typically lands between **¥280k and ¥450k**, delivered in three phases. Phase one is a single-line pilot in **4–6 weeks**, and the pilot fee is credited to the full contract. Pricing depends on line count and PLC brands — how many lines are you running today?"
      : "和你们规模相近的项目，数字孪生 + 能耗优化通常在 **28–45 万**，按「诊断 → 试点 → 复制」三期交付。首期先跑一条产线，**4–6 周**就能看到数据，试点费用可以抵扣后续合同。具体会看产线数量和 PLC 品牌——你们现在大概几条线？";
    suggestions = isEn
      ? ["Show me the Suzhou case", "What does phase one include?", "Book a free diagnosis"]
      : ["看看苏州的降本案例", "首期具体交付什么？", "约一次免费诊断"];
  } else if (has(/(案例|降本|同行|效果|oee|case|reference|result|benchmark|saving)/)) {
    intent = "case";
    reply = isEn
      ? "The closest match is a precision manufacturer in Suzhou: **3 lines, 480 machines**, total cost down **23%** in six months, OEE from **61% to 78%**. They started exactly where most plants do — data scattered across Excel. Are you more focused on cost or on delivery lead time?"
      : "最接近的是**苏州精密制造**：3 条产线、480 台设备接入，6 个月综合成本下降 **23%**，OEE 从 **61% 提升到 78%**。他们的起点和多数工厂一样——数据散落在 Excel 里。你更关心降本，还是交付周期？";
    suggestions = isEn
      ? ["How did they start?", "Can we visit the plant?", "What would our ROI look like?"]
      : ["他们第一步怎么做的？", "可以去工厂看看吗？", "我们的投入产出大概多少？"];
  } else if (has(/(能耗|节能|电费|空压|energy|electricity|compressed)/)) {
    intent = "energy";
    reply = isEn
      ? "Energy is usually the fastest payback. Our EcoPilot deployment at a Ningbo injection group covered **12 workshops and 86 machines**, cutting plant energy **17%** and saving **¥4.2M a year**, live in four months. It starts with 30 days of metering — no production changes. Want me to estimate your saving range?"
      : "能耗通常是回本最快的一块。宁波注塑集团接入 **12 个车间、86 台高耗能设备**后，单厂能耗下降 **17%**，一年省下 **420 万电费**，4 个月完成。第一步只是 30 天的分项计量，不改生产。要不要我先帮你估一个节能区间？";
    suggestions = isEn
      ? ["Estimate my savings", "What data do you need?", "See the Ningbo case"]
      : ["帮我估一下节能空间", "需要我提供哪些数据？", "看宁波的详细案例"];
  } else if (has(/(预约|见面|拜访|诊断|时间|book|meeting|visit|diagnos|schedule)/)) {
    intent = "booking";
    reply = isEn
      ? "Happy to arrange it. There are **30-minute free line diagnoses every Tuesday and Thursday afternoon**, online or on-site. Bring capacity, energy and OEE numbers if you have them; a short proposal follows within 48 hours. Which works better for you — online first, or a plant visit?"
      : "可以。每周**二、四下午**有 30 分钟的免费产线诊断，线上或到厂都行。建议带上产能、能耗、OEE 三组数据，诊断后 48 小时内给一版初步建议书。你是想先线上聊，还是直接到厂看？";
    suggestions = isEn
      ? ["Book Thursday 2pm", "What should I prepare?", "Send me the checklist"]
      : ["约周四下午 2 点", "我需要准备什么？", "把检查清单发我"];
  } else if (has(/(出海|越南|泰国|印尼|跨境|多语言|global|vietnam|overseas|cross-border|english)/)) {
    intent = "overseas";
    reply = isEn
      ? "We have delivered **17 projects** across Vietnam, Thailand and Indonesia, with CN / EN / VN teams and cross-border contracting. A recent Vietnam electronics plant went live on FlowMES in **4 weeks**, with yield up **5.2%**. Where is your plant located?"
      : "我们在**越南、泰国、印尼**交付过 17 个项目，团队支持中、英、越三语，也能处理跨境合同与付款。最近一个越南电子厂 **4 周**上线 FlowMES，良率提升了 **5.2%**。你的工厂在哪个城市？";
    suggestions = isEn
      ? ["See the Vietnam case", "Can you invoice overseas?", "Book a call in my timezone"]
      : ["看越南的交付案例", "可以走跨境合同吗？", "按我的时区约会议"];
  } else if (has(/(产品|系统|mes|数字孪生|twin|product|platform|software)/)) {
    intent = "product";
    reply = isEn
      ? "Three core pieces: **TwinLine** for line-level digital twins (from ¥288k), **EcoPilot** for energy optimisation (from ¥126k), and **FlowMES Lite** for small plants, live in four weeks (from ¥68k). Most clients start with one line and one measurable target. Which problem is most urgent for you?"
      : "三块核心能力：**TwinLine 产线数字孪生**（28.8 万起）、**EcoPilot 能耗优化**（12.6 万起）、**FlowMES 轻量版**（6.8 万起，4 周上线）。多数客户会先选一条产线、一个可量化目标。你现在最想解决的是哪一块？";
    suggestions = isEn
      ? ["Compare TwinLine and FlowMES", "What is the ROI?", "Book a demo"]
      : ["数字孪生和 MES 怎么选？", "投入产出怎么算？", "约个演示"];
  } else if (has(/(合作|代理|渠道|partner|reseller|agency)/)) {
    intent = "partner";
    reply = isEn
      ? "We work with regional integrators in three ways: referral, co-delivery, and certified resale. Partners get technical training plus a 15–25% margin depending on delivery involvement. Which region are you covering?"
      : "我们和区域集成商有三种合作方式：转介绍、联合交付、认证代理。伙伴会有技术培训，按交付参与度给 **15–25%** 的利润空间。你主要覆盖哪个区域？";
    suggestions = isEn
      ? ["Partner program details", "Which regions are open?", "Talk to a human"]
      : ["看合作政策", "哪些区域还在招？", "转人工沟通"];
  } else if (has(/(你好|您好|hi|hello|在吗|hey)/) && text.length < 24) {
    intent = "greeting";
    reply = isEn
      ? "Hi, I am Zhiyuan's digital twin. I have his full project notes — cost reduction, energy, MES and overseas delivery. What would you like to look into first?"
      : "你好，我是知远的数字分身。他的项目笔记我全都读过——降本、能耗、MES、出海交付都可以问。你这次主要想了解哪一块？";
    suggestions = isEn
      ? ["What do you do?", "Show me a case", "Book a diagnosis"]
      : ["你们主要做什么？", "看一个降本案例", "预约免费诊断"];
  } else if (kb.length) {
    intent = "knowledge";
    const item = kb[0].item;
    const body = isEn ? item.contentEn : item.content;
    reply = isEn
      ? `${body}\n\nIf helpful, I can match this to a plant like yours or book a 30-minute diagnosis.`
      : `${body}\n\n如果需要，我可以按你的工厂情况做一版匹配，或者直接约 30 分钟诊断。`;
    suggestions = isEn
      ? ["Match this to my plant", "Book a diagnosis", "Show pricing"]
      : ["按我的工厂匹配一下", "预约诊断", "看报价区间"];
  } else {
    intent = "fallback";
    reply = isEn
      ? "Good question. I can help with line cost reduction, energy optimisation, lightweight MES and overseas delivery — and I can bring in Zhiyuan for anything commercial. Could you tell me your industry and the problem you are trying to solve?"
      : "这个问题我记下了。产线降本、能耗优化、轻量 MES、出海交付这几块我可以直接答；涉及商务条款，我会转给知远本人。方便先告诉我你的行业和目前最想解决的问题吗？";
    suggestions = isEn
      ? ["We run a precision plant", "Energy is our priority", "Talk to Zhiyuan"]
      : ["我们是精密制造工厂", "最关心能耗", "转给知远本人"];
  }

  if (offHours) {
    const time = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    reply = isEn
      ? `It is ${time} in Shanghai, so Zhiyuan is offline — but I am here all night.\n\n${reply}`
      : `现在是上海时间 ${time}，知远已经休息了，但我会 24 小时在线。\n\n${reply}`;
  }

  const sources = kb.map((k) => (isEn ? k.item.titleEn : k.item.title));

  // 记录对话与意向变化
  if (visitorId) {
    if (!db.chats[visitorId]) db.chats[visitorId] = [];
    db.chats[visitorId].push({ role: "user", content: text, ts: Date.now() });
    db.chats[visitorId].push({ role: "assistant", content: reply, ts: Date.now() });
    db.chats[visitorId] = db.chats[visitorId].slice(-30);
    const tr = track({ visitorId, type: "chat", module: "ai", label: "与 AI 分身对话" });
    tr.visitor.profile = profile;
    save();
    return {
      reply,
      suggestions,
      sources,
      intent: { type: intent, score: tr.visitor.score, level: tr.visitor.level, delta: tr.delta, oldScore: scoreBefore },
      profile,
      capture: userTurns >= 2,
      alert: tr.alert,
    };
  }

  return {
    reply,
    suggestions,
    sources,
    intent: { type: intent, score: scoreBefore, level: levelOf(scoreBefore), delta: 0, oldScore: scoreBefore },
    profile,
    capture: userTurns >= 2,
  };
}

function overview(range = 7) {
  const visitors = [...db.visitors].sort((a, b) => b.lastSeen - a.lastSeen);
  const trend = db.trend.map((d, i) => {
    if (i === db.trend.length - 1) {
      return { ...d, views: db.stats.todayViews, visitors: Math.round(db.stats.todayViews * 0.62) };
    }
    return d;
  });
  return {
    kpi: {
      weekViews: db.stats.weekViews,
      weekViewsDelta: 18.6,
      newVisitors: 236,
      newVisitorsDelta: 12.4,
      hotLeads: visitors.filter((v) => v.level === "A").length,
      hotLeadsDelta: 3,
      conversion: db.stats.conversion,
      conversionDelta: 0.8,
      liveNow: visitors.filter((v) => Date.now() - v.lastSeen < 15 * MIN).length,
    },
    trend,
    modules: [
      { name: "降本案例", nameEn: "Cost case", value: 34, tone: "orange" },
      { name: "产品方案", nameEn: "Products", value: 22, tone: "ink" },
      { name: "能耗优化", nameEn: "Energy", value: 16, tone: "green" },
      { name: "预约诊断", nameEn: "Booking", value: 11, tone: "blue" },
      { name: "资质证书", nameEn: "Credentials", value: 9, tone: "gold" },
      { name: "其他", nameEn: "Other", value: 8, tone: "grey" },
    ],
    funnel: [
      { label: "打开名片", labelEn: "Card views", value: 1286 },
      { label: "深度阅读", labelEn: "Deep reads", value: 486 },
      { label: "发起咨询", labelEn: "Consults", value: 127 },
      { label: "留下线索", labelEn: "Leads", value: 43 },
      { label: "完成预约", labelEn: "Bookings", value: 18 },
    ],
    visitors: visitors.slice(0, 30),
    alerts: db.alerts.slice(0, 12),
    leads: db.leads.slice(0, 20),
    appointments: db.appointments.slice(0, 20),
    orders: db.orders.slice(0, 20),
    team: db.team,
    chats: db.chats,
    stats: db.stats,
  };
}

function slots() {
  const days = [];
  const fmt = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", weekday: "short" });
  for (let i = 0; i < 7; i++) {
    const ts = Date.now() + i * DAY;
    const key = dateKeyZh(ts);
    days.push({
      date: key,
      label: i === 0 ? "今天" : i === 1 ? "明天" : fmt.format(new Date(ts)),
      slots: ["09:30", "10:30", "14:00", "15:30", "16:30"].map((s) => ({
        time: s,
        taken: db.appointments.some((a) => a.date === key && a.slot === s && a.status !== "cancelled"),
      })),
    });
  }
  return days;
}

module.exports = {
  load,
  reset,
  save,
  flush,
  track,
  publicCard,
  aiReply,
  overview,
  slots,
  get db() {
    return db;
  },
  levelOf,
  hourZh,
};
