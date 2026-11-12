(function () {
  const NAV = [
    { id: "overview", label: "数据概览", icon: "chart", sub: "实时访客与意向转化" },
    { id: "visitors", label: "访客追踪", icon: "pulse", sub: "谁在看、看了多久、反复看什么" },
    { id: "content", label: "名片内容", icon: "grid", sub: "微官网内容与自定义菜单" },
    { id: "ai", label: "AI 分身", icon: "spark", sub: "人设、知识库与声线克隆" },
    { id: "commerce", label: "交易与预约", icon: "wallet", sub: "订单、预约与商品" },
    { id: "team", label: "团队与继承", icon: "users", sub: "企业资产与离职交接" },
    { id: "nfc", label: "NFC 与二维码", icon: "nfc", sub: "线下入口与双形态名片" },
    { id: "settings", label: "设置", icon: "settings", sub: "多语言、生态与数据策略" },
  ];

  const Admin = {
    data: null,
    section: "overview",
    es: null,
    cache: null,

    async render(section) {
      this.section = section || "overview";
      this.buildShell();
      if (!this.data) {
        try {
          this.data = await UI.getJSON("/api/admin/overview");
        } catch (e) {
          document.getElementById("consoleContent").innerHTML = `<div class="empty">${UI.icon("slash")}<p>后台数据加载失败，请刷新重试</p></div>`;
          return;
        }
      }
      this.renderTop();
      this.renderContent();
      this.connectStream();
    },

    buildShell() {
      const shell = document.getElementById("consoleShell");
      if (shell.dataset.ready === "1") return;
      shell.innerHTML = `
        <aside class="console-side">
          <div class="console-brand">
            <img src="/assets/logo.svg" alt="晒名片" />
            <div><b>晒名片</b><span>ENTERPRISE CONSOLE</span></div>
          </div>
          <nav class="console-nav" id="consoleNav">
            ${NAV.map((n) => `<button data-section="${n.id}" class="${n.id === this.section ? "active" : ""}">${UI.icon(n.icon)}<span>${n.label}</span>${n.id === "visitors" ? '<span class="badge">3</span>' : ""}</button>`).join("")}
          </nav>
          <div class="console-user">
            <div class="cu-avatar">澄</div>
            <div><b>澄明科技</b><span>企业管理员 · 苏州总部</span></div>
            <button class="back" data-back>访客端 →</button>
          </div>
        </aside>
        <main class="console-main">
          <div class="console-top" id="consoleTop"></div>
          <div class="console-content" id="consoleContent"></div>
        </main>
      `;
      shell.dataset.ready = "1";
      UI.iconify(shell);
      shell.querySelectorAll("[data-section]").forEach((b) => {
        b.addEventListener("click", () => { location.hash = "#/admin/" + b.dataset.section; });
      });
      shell.querySelector("[data-back]").addEventListener("click", () => { location.hash = "#/"; });
    },

    renderTop() {
      const nav = NAV.find((n) => n.id === this.section) || NAV[0];
      const top = document.getElementById("consoleTop");
      const live = this.data?.kpi?.liveNow || 0;
      top.innerHTML = `
        <div class="console-title"><h2>${nav.label}</h2><p>${nav.sub}</p></div>
        <div class="console-actions">
          <span class="live-pill" id="livePill"><span class="dot"></span>${live} 位访客在线</span>
          <button class="console-btn" data-demo>${UI.icon("spark")} 模拟新访客</button>
          <button class="console-btn primary" data-refresh>${UI.icon("reset")} 刷新</button>
        </div>
      `;
      UI.iconify(top);
      top.querySelector("[data-demo]").addEventListener("click", async () => {
        try {
          const res = await UI.post("/api/admin/demo/visit", {});
          UI.toast(`${res.visitor.name} 正在查看「${res.visitor.events.slice(-1)[0].label}」`, "fire");
          await this.reload();
        } catch (e) { UI.toast("模拟失败"); }
      });
      top.querySelector("[data-refresh]").addEventListener("click", () => this.reload());
    },

    async reload() {
      try {
        this.data = await UI.getJSON("/api/admin/overview");
        this.renderTop();
        this.renderContent();
      } catch (e) {}
    },

    renderContent() {
      const el = document.getElementById("consoleContent");
      if (!el) return;
      const map = {
        overview: this.viewOverview,
        visitors: this.viewVisitors,
        content: this.viewContent,
        ai: this.viewAI,
        commerce: this.viewCommerce,
        team: this.viewTeam,
        nfc: this.viewNFC,
        settings: this.viewSettings,
      };
      el.innerHTML = (map[this.section] || this.viewOverview).call(this);
      UI.iconify(el);
      this.bindSection();
    },

    /* ------------------------- 概览 ------------------------- */
    viewOverview() {
      const d = this.data;
      const k = d.kpi;
      const inherited = this.inheritedBanner();
      return `
        ${inherited}
        <div class="kpi-grid">
          ${this.kpi("eye", "本周名片浏览", UI.num(k.weekViews), "+" + k.weekViewsDelta + "%", "较上周")}
          ${this.kpi("users", "新访客", UI.num(k.newVisitors), "+" + k.newVisitorsDelta + "%", "较上周")}
          ${this.kpi("fire", "高意向线索", k.hotLeads + " 位", "+" + k.hotLeadsDelta, "A 级 · 待跟进", true)}
          ${this.kpi("chart", "留资转化率", k.conversion + "%", "+" + k.conversionDelta + " pt", "浏览 → 留资")}
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head">
              <h3>近 7 天访问趋势</h3>
              <div class="legend"><span><i style="background:#ff5a1f"></i>浏览</span><span><i style="background:#2e7d5b"></i>留资</span></div>
            </div>
            <div class="chart-wrap">${this.lineChart(d.trend)}</div>
          </div>
          <div class="panel">
            <div class="panel-head"><h3>实时意向雷达</h3><span>SSE 实时推送</span></div>
            <div class="feed" id="liveFeed">${this.feedItems(d.alerts)}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h3>访客最关注的模块</h3><span>按停留时长与重复访问加权</span></div>
            <div class="module-bars">
              ${d.modules.map((m) => `
                <div class="module-bar">
                  <div class="mb-top"><b>${m.name}</b><span>${m.value}%</span></div>
                  <div class="mb-track"><div class="mb-fill" style="width:${m.value}%;background:${this.tone(m.tone)}"></div></div>
                </div>`).join("")}
            </div>
            <div class="hr"></div>
            <div class="panel-head" style="margin:10px 0 4px"><h3>成交漏斗</h3><span>本周</span></div>
            ${d.funnel.map((f, i) => `
              <div class="module-bar" style="margin-bottom:7px">
                <div class="mb-top"><b>${f.label}</b><span>${UI.num(f.value)}</span></div>
                <div class="mb-track"><div class="mb-fill" style="width:${Math.max(8, (f.value / d.funnel[0].value) * 100)}%;background:${i === 0 ? "#171310" : "#ff5a1f"};opacity:${1 - i * 0.12}"></div></div>
              </div>`).join("")}
          </div>
          <div class="panel">
            <div class="panel-head"><h3>高意向访客</h3><span>意向分 ≥ 75</span></div>
            <table class="table">
              <thead><tr><th>访客</th><th>意向</th><th>最近关注</th></tr></thead>
              <tbody>
                ${d.visitors.filter((v) => v.level === "A").slice(0, 4).map((v) => `
                  <tr class="clickable" data-visitor="${v.id}">
                    <td><div class="td-person"><span class="td-avatar" style="background:${v.avatarColor}">${UI.esc(v.name.slice(0, 1))}</span><div><b>${UI.esc(v.name)}</b><span>${UI.esc(v.company)}</span></div></div></td>
                    <td><span class="badge-level level-${v.level}">${v.level}</span></td>
                    <td><span class="td-tag">${UI.esc(v.events[v.events.length - 1]?.label || "名片首页")}</span></td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div class="hr"></div>
            <div class="panel-head" style="margin:10px 0 0"><h3>最新留资</h3><span>${d.leads.length} 条</span></div>
            ${d.leads.slice(0, 2).map((l) => `
              <div class="feed-item">
                <div class="feed-avatar" style="background:#ff5a1f">${UI.esc(l.name.slice(0, 1))}</div>
                <div class="feed-body"><p><b>${UI.esc(l.name)}</b> · ${UI.esc(l.company)}</p><span>${UI.esc(l.need || "留下了联系方式")} · ${UI.timeAgo(l.createdAt)}</span></div>
              </div>`).join("")}
          </div>
        </div>
        <div class="panel" style="margin-top:12px">
          <div class="panel-head"><h3>今日访客路径</h3><span>从打开名片到预约的典型路径</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${["打开名片 100%", "阅读简介 68%", "查看降本案例 41%", "向 AI 提问 19%", "留资 / 预约 7%"].map((s, i) => `
              <div style="flex:1;min-width:110px;padding:12px;border-radius:11px;background:${i === 4 ? "#fff2e5" : "#faf7f0"};border:1px solid ${i === 4 ? "rgba(255,90,31,.25)" : "var(--line)"}">
                <b style="font-size:15px;color:${i === 4 ? "#ff5a1f" : "#171310"}">${s.split(" ")[1]}</b>
                <div style="font-size:8.5px;color:var(--muted);margin-top:3px">${s.split(" ")[0]}</div>
              </div>`).join("")}
          </div>
        </div>
      `;
    },

    kpi(icon, label, value, delta, sub, hot) {
      return `
        <div class="kpi-card">
          <div class="kpi-label">${UI.icon(icon)} ${label}</div>
          <div class="kpi-value">${value}</div>
          <div class="kpi-delta ${hot ? "" : ""}">${delta} <span style="color:var(--muted);font-weight:500">${sub}</span></div>
        </div>`;
    },

    tone(t) {
      return { orange: "#ff5a1f", ink: "#171310", green: "#2e7d5b", blue: "#2b5f8a", gold: "#b98a32", grey: "#a39a8c" }[t] || "#ff5a1f";
    },

    lineChart(trend) {
      const W = 640, H = 190, L = 34, R = 12, T = 14, B = 28;
      const maxV = Math.max(...trend.map((d) => d.views)) * 1.12;
      const maxL = Math.max(...trend.map((d) => d.leads)) * 1.4;
      const iw = W - L - R, ih = H - T - B;
      const x = (i) => L + (iw / (trend.length - 1)) * i;
      const y = (v) => T + ih - (v / maxV) * ih;
      const yl = (v) => T + ih - (v / maxL) * (ih * 0.32);
      const pts = trend.map((d, i) => [x(i), y(d.views)]);
      let path = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        const cx = (p0[0] + p1[0]) / 2;
        path += ` C ${cx} ${p0[1]}, ${cx} ${p1[1]}, ${p1[0]} ${p1[1]}`;
      }
      const area = `${path} L ${pts[pts.length - 1][0]} ${T + ih} L ${pts[0][0]} ${T + ih} Z`;
      const grid = [0, 0.25, 0.5, 0.75, 1].map((r) => {
        const yy = T + ih - r * ih;
        return `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" stroke="rgba(23,19,16,.07)" stroke-width="1"/>
          <text x="${L - 8}" y="${yy + 3}" text-anchor="end" fill="#b3a999" font-size="8">${Math.round(maxV * r)}</text>`;
      }).join("");
      const bars = trend.map((d, i) => {
        const bh = (d.leads / maxL) * (ih * 0.32);
        return `<rect x="${x(i) - 9}" y="${T + ih - bh}" width="18" height="${bh}" rx="4" fill="rgba(46,125,91,.35)"/>`;
      }).join("");
      const labels = trend.map((d, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" fill="#b3a999" font-size="8">${d.date}</text>`).join("");
      const dots = pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#fff" stroke="#ff5a1f" stroke-width="2"/>`).join("");
      return `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ff5a1f" stop-opacity=".22"/>
              <stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${grid}
          ${bars}
          <path d="${area}" fill="url(#areaGrad)"/>
          <path d="${path}" fill="none" stroke="#ff5a1f" stroke-width="2.4" stroke-linecap="round"/>
          ${dots}
          ${labels}
        </svg>`;
    },

    feedItems(alerts) {
      return alerts.map((a) => `
        <div class="feed-item">
          <div class="feed-avatar" style="background:${a.level === "A" ? "#ff5a1f" : a.level === "B" ? "#b98a32" : "#8b8175"}">${a.level}</div>
          <div class="feed-body"><p>${UI.esc(a.text)}</p><span>${UI.timeAgo(a.ts)} · ${a.level === "A" ? "高意向" : a.level === "B" ? "培育中" : "初步了解"}</span></div>
          <span class="feed-live"></span>
        </div>`).join("") || `<div class="empty">${UI.icon("pulse")}<p>暂时还没有新的访客动态</p></div>`;
    },

    inheritedBanner() {
      const c = App.data?.card;
      if (!c?.formerOwner) return "";
      return `
        <div class="history-banner">
          ${UI.icon("users")}
          <div><b>继承已生效：${UI.esc(c.formerOwner.name)} → ${UI.esc(c.owner.name)}</b>
          <p>客户资料、历史拜访与 AI 对话仍归属企业。访客打开名片看到的已是 ${UI.esc(c.owner.name)}，历史对接记录完整保留。</p></div>
        </div>`;
    },

    /* ------------------------- 访客 ------------------------- */
    viewVisitors() {
      const d = this.data;
      const list = [...d.visitors].sort((a, b) => b.score - a.score);
      return `
        <div class="grid-3" style="margin-top:0">
          ${this.kpi("fire", "A 级高意向", d.visitors.filter((v) => v.level === "A").length + " 位", "实时提醒", "建议 10 分钟内跟进", true)}
          ${this.kpi("eye", "今日访客", UI.num(d.stats.todayViews), "+12.4%", "较昨日")}
          ${this.kpi("timer", "平均停留", "3m 42s", "+26s", "较上周")}
        </div>
        <div class="panel" style="margin-top:12px">
          <div class="panel-head">
            <h3>访客行为与意向分级</h3>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="visitorSearch" placeholder="搜索姓名 / 公司" style="height:30px;border:1px solid var(--line);border-radius:8px;padding:0 9px;font-size:10px;background:#fff;outline:none" />
              <button class="console-btn" data-export>${UI.icon("download")} 导出线索</button>
            </div>
          </div>
          <table class="table" id="visitorTable">
            <thead><tr><th>访客</th><th>意向</th><th>最近关注</th><th>停留</th><th>访问</th><th>来源</th><th>最近活跃</th></tr></thead>
            <tbody>
              ${list.map((v) => this.visitorRow(v)).join("")}
            </tbody>
          </table>
        </div>
      `;
    },

    visitorRow(v) {
      const dwell = v.events.reduce((s, e) => s + (e.duration || 0), 0);
      return `
        <tr class="clickable" data-visitor="${v.id}" data-search="${UI.esc((v.name + v.company).toLowerCase())}">
          <td><div class="td-person"><span class="td-avatar" style="background:${v.avatarColor}">${UI.esc(v.name.slice(0, 1))}</span><div><b>${UI.esc(v.name)}</b><span>${UI.esc(v.company)} · ${UI.esc(v.role)}</span></div></div></td>
          <td><div class="score-wrap"><span class="badge-level level-${v.level}">${v.level}</span><div class="score-bar"><i style="width:${v.score}%"></i></div><b style="font-size:9.5px">${v.score}</b></div></td>
          <td><span class="td-tag">${UI.esc(v.events[v.events.length - 1]?.label || "名片首页")}</span></td>
          <td>${Math.floor(dwell / 60)}m ${dwell % 60}s</td>
          <td>${v.visits} 次</td>
          <td><span style="color:var(--muted);font-size:9px">${UI.esc(v.source)}</span></td>
          <td>${Date.now() - v.lastSeen < 15 * 60000 ? `<span class="td-live"><i></i>在线</span>` : `<span style="color:var(--muted);font-size:9px">${UI.timeAgo(v.lastSeen)}</span>`}</td>
        </tr>`;
    },

    openVisitor(id) {
      const v = this.data.visitors.find((x) => x.id === id);
      if (!v) return;
      const dwell = v.events.reduce((s, e) => s + (e.duration || 0), 0);
      const chats = (this.data.chats || {})[v.id] || [];
      const backdrop = document.createElement("div");
      backdrop.className = "drawer-backdrop";
      backdrop.innerHTML = `
        <div class="drawer">
          <div class="drawer-head">
            <div style="display:flex;gap:11px;align-items:center">
              <span class="td-avatar" style="width:44px;height:44px;flex:0 0 44px;font-size:15px;background:${v.avatarColor}">${UI.esc(v.name.slice(0, 1))}</span>
              <div><h3>${UI.esc(v.name)}</h3><p>${UI.esc(v.company)} · ${UI.esc(v.role)}</p></div>
            </div>
            <button class="sheet-close" data-close>${UI.icon("close")}</button>
          </div>
          <div class="panel" style="margin-bottom:14px;background:linear-gradient(120deg,#fff3e4,#fdf9f0)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div><div style="font-size:9px;color:var(--muted)">意向评分</div><div style="font-size:32px;font-weight:800;color:${v.level === "A" ? "#ff5a1f" : "var(--ink)"}">${v.score}<span style="font-size:11px;color:var(--muted)"> / 100</span></div></div>
              <span class="badge-level level-${v.level}" style="width:34px;height:34px;font-size:13px">${v.level}</span>
            </div>
            <div class="score-bar" style="margin-top:8px;height:5px"><i style="width:${v.score}%"></i></div>
            <p style="font-size:8.5px;color:var(--muted);margin:8px 0 0">${UI.esc(v.note || "系统根据停留、模块重复访问与主动咨询自动评分。")}</p>
          </div>
          <div class="drawer-section">
            <h4>行为摘要</h4>
            <div class="grid-3" style="margin-top:0;gap:8px">
              <div class="panel" style="padding:10px"><b style="font-size:15px">${v.visits}</b><div style="font-size:8px;color:var(--muted)">访问次数</div></div>
              <div class="panel" style="padding:10px"><b style="font-size:15px">${Math.floor(dwell / 60)}m ${dwell % 60}s</b><div style="font-size:8px;color:var(--muted)">累计停留</div></div>
              <div class="panel" style="padding:10px"><b style="font-size:15px">${chats.length ? Math.ceil(chats.length / 2) : 0}</b><div style="font-size:8px;color:var(--muted)">AI 对话轮次</div></div>
            </div>
          </div>
          <div class="drawer-section">
            <h4>访问时间线</h4>
            <div class="timeline">
              ${[...v.events].reverse().slice(0, 10).map((e) => `
                <div class="tl-item ${["lead", "chat", "book", "order"].includes(e.type) ? "hot" : ""}">
                  <span class="tl-dot"></span>
                  <div class="tl-body"><p>${UI.esc(e.label)} ${e.duration ? `<span style="color:var(--muted)">· 停留 ${e.duration}s</span>` : ""}</p><span>${UI.timeAgo(e.ts)} · ${e.type}</span></div>
                </div>`).join("")}
            </div>
          </div>
          ${chats.length ? `
          <div class="drawer-section">
            <h4>AI 对话记录</h4>
            <div class="chat-log">${chats.slice(-6).map((m) => `<div class="cl ${m.role}">${UI.esc(m.content).slice(0, 180)}</div>`).join("")}</div>
          </div>` : ""}
          <div class="drawer-section" style="display:flex;gap:8px">
            <button class="console-btn orange" style="flex:1;justify-content:center;height:38px" data-follow>标记已跟进</button>
            <button class="console-btn" style="flex:1;justify-content:center;height:38px" data-card>查看名片</button>
          </div>
        </div>`;
      document.body.appendChild(backdrop);
      UI.iconify(backdrop);
      const close = () => backdrop.remove();
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
      backdrop.querySelector("[data-close]").addEventListener("click", close);
      backdrop.querySelector("[data-follow]").addEventListener("click", () => {
        v.note = "已标记跟进 · " + new Date().toLocaleString("zh-CN");
        UI.toast("已标记跟进，并生成今日待办", "check");
        close();
      });
      backdrop.querySelector("[data-card]").addEventListener("click", () => window.open("/", "_blank"));
    },

    /* ------------------------- 内容 ------------------------- */
    viewContent() {
      const c = App.data.card;
      return `
        ${this.inheritedBanner()}
        <div class="grid-2">
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>名片简介</h3><span>一次修改，微信 / H5 / 小程序全端同步</span></div>
              <div class="form-grid">
                <div class="admin-field"><label>中文简介</label><textarea id="bioZh" style="min-height:120px">${UI.esc(c.bio.zh)}</textarea></div>
                <div class="admin-field"><label>English bio</label><textarea id="bioEn" style="min-height:120px">${UI.esc(c.bio.en)}</textarea></div>
              </div>
              <div class="form-grid" style="margin-top:10px">
                <div class="admin-field"><label>姓名</label><input id="ownerName" value="${UI.esc(c.owner.name)}" /></div>
                <div class="admin-field"><label>职位</label><input id="ownerTitle" value="${UI.esc(c.owner.title)}" /></div>
              </div>
              <button class="console-btn primary" data-save-card style="margin-top:12px">${UI.icon("check")} 保存并同步</button>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>底部自定义菜单</h3><span>跳转官网 / 小程序 / 活动落地页</span></div>
              <div id="menuEditor">
                ${c.menu.map((m) => `
                  <div class="menu-editor-row" data-menu-id="${m.id}">
                    <input data-field="label" value="${UI.esc(m.label)}" placeholder="中文名称" />
                    <input data-field="url" value="${UI.esc(m.url)}" placeholder="https://" />
                    <button class="console-btn" data-menu-del style="padding:0 9px">${UI.icon("trash")}</button>
                  </div>`).join("")}
              </div>
              <button class="console-btn" data-save-menu style="margin-top:6px">${UI.icon("check")} 保存菜单</button>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>访客画像策略</h3><span>根据画像动态重排内容</span></div>
              <div class="toggle-row"><div class="tr-main"><b>制造业客户 → 置顶降本案例</b><span>苏州精密制造 · 综合成本下降 23%</span></div><button class="switch on" data-toggle></button></div>
              <div class="toggle-row"><div class="tr-main"><b>海外买家 → 英文内容 + 跨境支付</b><span>越南 / 泰国 / 印尼交付案例</span></div><button class="switch on" data-toggle></button></div>
              <div class="toggle-row"><div class="tr-main"><b>投资 / 合作 → 公司与团队优先</b><span>12 年经验、120+ 工厂、资质背书</span></div><button class="switch on" data-toggle></button></div>
            </div>
          </div>
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>实时预览</h3><span>修改后立即生效</span></div>
              <div style="display:flex;gap:14px;align-items:center">
                <div style="width:92px;height:92px;border-radius:20px;background:radial-gradient(circle at 80% 10%,#4a2a14,transparent 55%),#171310;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fbf7ee;flex:0 0 92px">
                  <span style="font-family:var(--serif);font-size:26px">${UI.esc(c.owner.avatarText)}</span>
                  <span style="font-size:7px;letter-spacing:.1em;color:#ffb020;margin-top:2px">AI CARD</span>
                </div>
                <div><b style="font-family:var(--serif);font-size:19px">${UI.esc(c.owner.name)}</b>
                  <p style="font-size:9px;color:var(--muted);margin:3px 0 0">${UI.esc(c.owner.title)}</p>
                  <p style="font-size:8.5px;color:var(--muted);margin:2px 0 0">${UI.esc(c.owner.company)}</p>
                  <div style="display:flex;gap:4px;margin-top:7px">${c.tags.map((x) => `<span class="td-tag">${UI.esc(x.zh)}</span>`).join("")}</div>
                </div>
              </div>
              <div class="hr"></div>
              <div class="qr-panel" style="padding:4px 0 0">
                <div class="qr-frame" style="padding:7px"><img src="${c.qrUrl}" alt="QR" style="width:130px;height:130px" /></div>
                <p class="qr-sub" style="margin-top:10px">扫码实时查看访客端</p>
              </div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>内容资产</h3><span>微官网级承载</span></div>
              ${[
                ["产品方案", c.content.products.length + " 个", "已上线"],
                ["客户案例", c.content.cases.length + " 个", "已上线"],
                ["资质证书", c.content.certificates.length + " 项", "已上线"],
                ["视频素材", c.content.videos.length + " 条", "已上线"],
                ["自定义菜单", c.menu.length + " 个入口", "已同步"],
              ].map((r) => `<div class="toggle-row"><div class="tr-main"><b>${r[0]}</b></div><span style="font-size:9px;color:var(--muted)">${r[1]}</span><span class="td-tag">${r[2]}</span></div>`).join("")}
            </div>
          </div>
        </div>
      `;
    },

    /* ------------------------- AI ------------------------- */
    viewAI() {
      const p = App.data.persona;
      const kb = p.knowledge || [];
      return `
        <div class="grid-2">
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>数字分身人设</h3><span>24 小时在线 · 非工作时间自动兜底</span></div>
              <div class="form-grid">
                <div class="admin-field"><label>中文招呼语</label><textarea id="greetZh">${UI.esc(p.greeting.zh)}</textarea></div>
                <div class="admin-field"><label>English greeting</label><textarea id="greetEn">${UI.esc(p.greeting.en)}</textarea></div>
              </div>
              <div class="admin-field" style="margin-top:10px"><label>回答风格</label><input id="personaTone" value="${UI.esc(p.tone)}" /></div>
              <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">${["产线诊断", "方案报价", "案例匹配", "预约安排", "转人工"].map((s) => `<span class="td-tag" style="background:#fff2e5;color:#a94a17">${s}</span>`).join("")}</div>
              <button class="console-btn primary" data-save-persona style="margin-top:12px">${UI.icon("check")} 保存人设</button>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>专业知识库</h3><span>${kb.length} 篇 · 每次回答自动检索</span></div>
              <div style="max-height:300px;overflow-y:auto;padding-right:3px">
                ${kb.map((k) => `
                  <div class="kb-item">
                    <div class="kb-ico">${UI.icon("file")}</div>
                    <div class="kb-main"><div style="display:flex;align-items:center;gap:6px"><b>${UI.esc(k.title)}</b><span class="kb-cat">${UI.esc(k.category)}</span></div><p>${UI.esc(k.content)}</p></div>
                    <button class="kb-del" data-kb-del="${k.id}">×</button>
                  </div>`).join("")}
              </div>
              <div class="hr"></div>
              <div class="form-grid">
                <div class="admin-field"><label>新增知识标题</label><input id="kbTitle" placeholder="例如：注塑行业能耗基准" /></div>
                <div class="admin-field"><label>分类</label><input id="kbCat" placeholder="案例 / 产品 / 商务" /></div>
              </div>
              <div class="admin-field" style="margin-top:8px"><label>知识内容</label><textarea id="kbContent" placeholder="把项目复盘、报价口径、FAQ 直接贴进来…"></textarea></div>
              <div class="admin-field" style="margin-top:8px"><label>关键词（逗号分隔）</label><input id="kbKeywords" placeholder="能耗, 注塑, 电费" /></div>
              <div style="display:flex;gap:7px;margin-top:9px">
                <button class="console-btn orange" data-kb-add>${UI.icon("plus")} 添加到知识库</button>
                <label class="console-btn" style="cursor:pointer">${UI.icon("upload")} 上传 .md / .txt<input type="file" id="kbFile" accept=".txt,.md,text/plain" hidden /></label>
              </div>
            </div>
          </div>
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>声线克隆</h3><span>Voice Clone · 已授权</span></div>
              <div class="voice-lab">
                <div class="waveform" id="voiceWave">${Array.from({ length: 28 }).map((_, i) => `<i style="animation-delay:${(i * 0.05).toFixed(2)}s"></i>`).join("")}</div>
                <h4>${UI.esc(App.data.card.owner.name)} · 专属声线</h4>
                <p>基于 8 分钟授权录音训练 · 仅用于本名片</p>
                <div class="voice-stat">
                  <div><b id="voiceSim">${p.voiceSimilarity}%</b><span>相似度</span></div>
                  <div><b>1.4s</b><span>首字延迟</span></div>
                  <div><b>中 / 英</b><span>支持语言</span></div>
                </div>
                <button class="console-btn dark" style="background:var(--ink);color:#fff8ec" data-voice-clone>${UI.icon("mic")} 重新录制并克隆</button>
                <p class="form-note">演示：克隆流程为模拟，实际接入可对接声纹克隆 TTS 服务。</p>
              </div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>分身运行数据</h3><span>近 7 天</span></div>
              ${[
                ["接待对话", "186 次", "ai"],
                ["自动解决", "92.4%", "check"],
                ["转人工", "14 次", "users"],
                ["平均首响", "1.4s", "timer"],
                ["夜间接待", "37 次", "clock"],
              ].map((r) => `<div class="toggle-row"><div class="tr-main"><b>${r[0]}</b></div><b style="font-size:11px;color:${r[1].includes("%") ? "var(--green)" : "var(--ink)"}">${r[1]}</b></div>`).join("")}
            </div>
            <div class="panel" style="background:linear-gradient(130deg,#1d1712,#12100e);color:#f8f2e6">
              <div class="panel-head"><h3 style="color:#ffd9a8">非工作时间兜底</h3><span style="color:rgba(248,242,230,.45)">20:00 – 09:00</span></div>
              <p style="font-size:9.5px;line-height:1.8;color:rgba(248,242,230,.65);margin:0">夜间由数字分身接待，自动记录问题与联系方式；次日 9:00 生成「夜间线索摘要」推送给沈知远，高意向线索即时短信提醒。</p>
              <button class="console-btn" style="margin-top:12px;background:rgba(255,255,255,.08);color:#ffd9a8;border-color:rgba(255,255,255,.14)">${UI.icon("bell")} 查看夜间线索摘要</button>
            </div>
          </div>
        </div>
      `;
    },

    /* ------------------------- 交易 ------------------------- */
    viewCommerce() {
      const d = this.data;
      const gmv = d.orders.reduce((s, o) => s + (o.currency === "USD" ? o.amount * 7.2 : o.amount), 0);
      return `
        <div class="kpi-grid">
          ${this.kpi("wallet", "累计成交", "¥" + UI.num(gmv), "3 笔", "演示订单")}
          ${this.kpi("calendar", "本周预约", d.appointments.length + " 个", "2 个待确认", "线上 / 到厂")}
          ${this.kpi("cart", "商品转化率", "6.8%", "+1.2 pt", "浏览 → 下单")}
          ${this.kpi("clock", "平均成单周期", "4.2 天", "-0.8 天", "首次触达到支付")}
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h3>订单</h3><span>微信支付 / 支付宝 / 跨境</span></div>
            <table class="table">
              <thead><tr><th>客户</th><th>产品</th><th>金额</th><th>渠道</th><th>状态</th><th>时间</th></tr></thead>
              <tbody>
                ${d.orders.map((o) => `
                  <tr>
                    <td><div class="td-person"><span class="td-avatar" style="background:#2b5f8a">${UI.esc(o.name.slice(0, 1))}</span><div><b>${UI.esc(o.name)}</b><span>${UI.esc(o.company)}</span></div></div></td>
                    <td><span class="td-tag">${UI.esc(o.productName)}</span></td>
                    <td><b>${o.currency === "USD" ? "$" : "¥"}${UI.num(o.amount)}</b></td>
                    <td>${UI.esc(o.channel)}</td>
                    <td><span class="td-tag" style="background:#e9f4ee;color:#246a4c">已支付</span></td>
                    <td><span style="color:var(--muted);font-size:9px">${UI.timeAgo(o.createdAt)}</span></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
          <div class="panel">
            <div class="panel-head"><h3>预约排期</h3><span>名片内直接锁定时段</span></div>
            ${d.appointments.map((a) => `
              <div class="feed-item">
                <div class="feed-avatar" style="background:#2e7d5b">${UI.esc(a.name.slice(0, 1))}</div>
                <div class="feed-body"><p><b>${UI.esc(a.name)}</b> · ${UI.esc(a.company || "未填写")}</p><span>${a.date} ${a.slot} · ${a.mode} · ${UI.timeAgo(a.createdAt)}</span></div>
                <span class="td-tag" style="background:#e9f4ee;color:#246a4c">已确认</span>
              </div>`).join("")}
            <div class="hr"></div>
            <div class="panel-head" style="margin:8px 0 6px"><h3>可售商品</h3><span>4 个</span></div>
            ${App.data.card.content.products.map((p) => `
              <div class="toggle-row">
                <div class="tr-main"><b>${UI.esc(p.name)}</b><span>${UI.esc(p.price)} · ${UI.esc(p.badge)}</span></div>
                <span class="switch on"></span>
              </div>`).join("")}
          </div>
        </div>
        <div class="panel" style="margin-top:12px">
          <div class="panel-head"><h3>交易闭环</h3><span>从「看完感兴趣」到「下单 / 约时间」压缩在一屏内</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${["浏览方案", "AI 答疑", "报价测算", "锁定档期", "在线支付", "交付跟进"].map((s, i) => `
              <div style="flex:1;min-width:100px;padding:12px;border-radius:11px;background:${i < 4 ? "#fff8ef" : "#faf7f0"};border:1px solid ${i < 4 ? "rgba(255,90,31,.22)" : "var(--line)"}">
                <div style="font-size:8px;color:var(--orange);font-weight:700">STEP ${i + 1}</div>
                <b style="font-size:10.5px;display:block;margin-top:4px">${s}</b>
              </div>`).join("")}
          </div>
        </div>
      `;
    },

    /* ------------------------- 团队 ------------------------- */
    viewTeam() {
      const team = this.data.team;
      return `
        ${this.inheritedBanner()}
        <div class="grid-2" style="margin-top:0">
          <div class="panel">
            <div class="panel-head"><h3>团队成员与名片归属</h3><span>客户资产归企业所有</span></div>
            <div class="team-grid">
              ${team.map((t) => `
                <div class="team-card">
                  <span class="tc-status ${t.status === "active" ? "active" : "left"}">${t.status === "active" ? "在职" : "已离职"}</span>
                  <div class="tc-top">
                    <span class="tc-avatar" style="background:${t.color}">${UI.esc(t.name.slice(0, 1))}</span>
                    <div><b>${UI.esc(t.name)}</b><span>${UI.esc(t.title)}</span></div>
                  </div>
                  <div class="tc-meta"><span>${UI.esc(t.city)}</span><span>${t.clients} 位客户</span></div>
                  ${t.status === "left" ? `<button class="tc-btn" data-inherit="${t.id}">发起离职继承</button>` : t.owner ? `<button class="tc-btn" data-inherit="owner" style="border-color:rgba(255,90,31,.4);color:#e8430c">模拟离职交接</button>` : ""}
                </div>`).join("")}
            </div>
            <div class="history-banner" style="margin:14px 0 0">
              ${UI.icon("shield")}
              <div><b>客户数据集中存企业后台</b><p>员工离职后，继任者可直接继承名片、历史拜访记录与 AI 对话，客户打开名片永远看到最新联系人。这是 B 端采购的硬性决策项。</p></div>
            </div>
          </div>
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>企业资产池</h3><span>不可被员工带走</span></div>
              <div class="kpi-grid" style="grid-template-columns:1fr 1fr;gap:8px">
                <div class="panel" style="padding:12px"><b style="font-size:20px">1,284</b><div style="font-size:8.5px;color:var(--muted)">企业客户总数</div></div>
                <div class="panel" style="padding:12px"><b style="font-size:20px">318</b><div style="font-size:8.5px;color:var(--muted)">已建立连接</div></div>
                <div class="panel" style="padding:12px"><b style="font-size:20px">86</b><div style="font-size:8.5px;color:var(--muted)">本月新增线索</div></div>
                <div class="panel" style="padding:12px"><b style="font-size:20px">100%</b><div style="font-size:8.5px;color:var(--muted)">离职继承留存</div></div>
              </div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>继承规则</h3><span>自动执行</span></div>
              <div class="toggle-row"><div class="tr-main"><b>离职员工名片自动冻结</b><span>客户访问时展示继任者信息</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>历史对话与拜访记录保留</b><span>AI 分身继续基于历史上下文回答</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>高意向客户优先分配</b><span>A 级线索自动进入继任者待办</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>管理员二次确认</b><span>继承操作留痕，可审计</span></div><span class="switch on"></span></div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>演示操作</h3></div>
              <button class="console-btn" data-reset style="width:100%;justify-content:center;height:36px">${UI.icon("reset")} 重置全部演示数据</button>
            </div>
          </div>
        </div>
      `;
    },

    /* ------------------------- NFC ------------------------- */
    viewNFC() {
      const c = App.data.card;
      return `
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h3>NFC 实体名片</h3><span>展会 / 饭局 · 一碰即换</span></div>
            <div class="nfc-visual">
              <div class="nfc-card">
                <span class="nfc-chip"></span>
                <img class="nfc-logo" src="/assets/logo.svg" alt="" />
                <div class="nfc-name">${UI.esc(c.owner.name)}</div>
                <div class="nfc-title">${UI.esc(c.owner.title)}</div>
                <span class="nfc-waves">${UI.icon("nfc")}</span>
              </div>
              <p class="nfc-hint">支持 NTAG 213 / 215 / 216<br/>写入后无需 App，碰一碰即可打开名片</p>
            </div>
            <div style="display:flex;gap:8px">
              <button class="console-btn orange" data-nfc-write style="flex:1;justify-content:center;height:38px">${UI.icon("nfc")} 写入名片链接</button>
              <button class="console-btn" data-nfc-order style="flex:1;justify-content:center;height:38px">${UI.icon("cart")} 采购实体卡</button>
            </div>
            <p class="form-note">演示环境：写入流程为模拟，真实场景可调用 Web NFC / 发卡工具批量写卡。</p>
          </div>
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>二维码入口</h3><span>线下物料 / 海报 / PPT</span></div>
              <div class="qr-panel" style="padding:0">
                <div class="qr-frame"><img src="${c.qrUrl}" alt="QR" style="width:150px;height:150px" /></div>
                <p class="qr-sub" style="margin-top:12px">扫码打开 ${UI.esc(c.owner.name)} 的名片</p>
                <div class="share-actions" style="margin-top:10px">
                  <button class="console-btn" data-download-qr>${UI.icon("download")} 下载二维码</button>
                  <button class="console-btn" data-copy-link>${UI.icon("copy")} 复制链接</button>
                </div>
              </div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>双形态覆盖场景</h3></div>
              ${[
                ["展会 / 峰会", "NFC 胸牌 · 一秒交换", "已覆盖"],
                ["饭局 / 拜访", "NFC 卡片 · 碰一碰", "已覆盖"],
                ["线上海报 / PPT", "二维码 · 扫码即看", "已覆盖"],
                ["微信内转发", "小程序卡片 · 直接打开", "已打通"],
              ].map((r) => `<div class="toggle-row"><div class="tr-main"><b>${r[0]}</b><span>${r[1]}</span></div><span class="td-tag" style="background:#e9f4ee;color:#246a4c">${r[2]}</span></div>`).join("")}
            </div>
            <div class="panel">
              <div class="panel-head"><h3>微信小程序</h3><span>与 H5 共用接口</span></div>
              <p style="font-size:9.5px;color:var(--muted);line-height:1.7;margin:0 0 10px">同一套名片数据与追踪接口，小程序内打开自动携带 openid，访客轨迹并入企业后台。</p>
              <button class="console-btn" data-mini>${UI.icon("wechat")} 下载小程序码</button>
            </div>
          </div>
        </div>
      `;
    },

    /* ------------------------- 设置 ------------------------- */
    viewSettings() {
      const c = App.data.card;
      return `
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h3>跨生态与多语言</h3><span>微信内外，一套内容</span></div>
            <div class="toggle-row"><div class="tr-main"><b>中文 / English 双语名片</b><span>访客可手动切换，海外访客自动英文</span></div><span class="switch on"></span></div>
            <div class="toggle-row"><div class="tr-main"><b>微信内分享卡片</b><span>自定义标题、描述与缩略图</span></div><span class="switch on"></span></div>
            <div class="toggle-row"><div class="tr-main"><b>独立链接 / 独立站</b><span>出海场景无需微信即可访问</span></div><span class="switch on"></span></div>
            <div class="toggle-row"><div class="tr-main"><b>跨境支付</b><span>Stripe · USD / EUR</span></div><span class="switch on"></span></div>
            <div class="toggle-row"><div class="tr-main"><b>访客追踪在基础版开放</b><span>追踪是电子名片区别于纸质名片的本质价值</span></div><span class="switch on"></span></div>
            <div class="hr"></div>
            <div class="admin-field"><label>名片主链接</label><input value="${UI.esc(App.data.shareUrl)}" readonly /></div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="console-btn" data-copy-link>${UI.icon("copy")} 复制链接</button>
              <button class="console-btn" data-back-card>${UI.icon("external")} 打开访客端</button>
            </div>
          </div>
          <div class="stack">
            <div class="panel">
              <div class="panel-head"><h3>数据与隐私</h3><span>企业级</span></div>
              <div class="toggle-row"><div class="tr-main"><b>访客行为追踪</b><span>停留时长、模块偏好、重复访问</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>高意向实时提醒</b><span>阈值 ≥ 75 分即时推送</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>匿名访客脱敏</b><span>未留资访客不展示完整手机号</span></div><span class="switch on"></span></div>
              <div class="toggle-row"><div class="tr-main"><b>数据归属企业</b><span>员工离职不可带走客户资产</span></div><span class="switch on"></span></div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>已接入生态</h3><span>4 个入口</span></div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${[["wechat", "微信小程序"], ["globe", "独立 H5"], ["nfc", "NFC 实体卡"], ["qr", "二维码"]].map(([ic, label]) => `
                  <div style="flex:1;min-width:96px;padding:11px;border-radius:11px;background:#faf7f0;border:1px solid var(--line);text-align:center">
                    <div style="color:var(--orange);display:flex;justify-content:center">${UI.icon(ic)}</div>
                    <div style="font-size:9px;margin-top:5px;font-weight:600">${label}</div>
                  </div>`).join("")}
              </div>
            </div>
            <div class="panel">
              <div class="panel-head"><h3>版本</h3><span>Enterprise</span></div>
              <div class="toggle-row"><div class="tr-main"><b>晒名片 Enterprise</b><span>追踪 + AI 分身 + 企业继承</span></div><span class="td-tag">v2.6.0</span></div>
              <button class="console-btn" data-reset style="width:100%;justify-content:center;height:36px;margin-top:8px">${UI.icon("reset")} 重置演示数据</button>
            </div>
          </div>
        </div>
      `;
    },

    /* ------------------------- 绑定 ------------------------- */
    bindSection() {
      const el = document.getElementById("consoleContent");
      el.querySelectorAll("[data-visitor]").forEach((row) => row.addEventListener("click", () => this.openVisitor(row.dataset.visitor)));
      el.querySelectorAll("[data-toggle]").forEach((sw) => sw.addEventListener("click", () => sw.classList.toggle("on")));
      el.querySelectorAll("[data-copy-link]").forEach((b) => b.addEventListener("click", async () => {
        await UI.copy(App.data.card.shareUrl || location.origin + "/");
        UI.toast("链接已复制", "copy");
      }));
      el.querySelector("[data-back-card]")?.addEventListener("click", () => { location.hash = "#/"; });
      el.querySelectorAll("[data-reset]").forEach((b) => b.addEventListener("click", () => this.resetDemo()));
      el.querySelector("[data-export]")?.addEventListener("click", () => this.exportLeads());

      // 访客搜索
      const search = el.querySelector("#visitorSearch");
      if (search) {
        search.addEventListener("input", () => {
          const q = search.value.trim().toLowerCase();
          el.querySelectorAll("#visitorTable tbody tr").forEach((tr) => {
            tr.style.display = !q || tr.dataset.search.includes(q) ? "" : "none";
          });
        });
      }

      // 内容保存
      el.querySelector("[data-save-card]")?.addEventListener("click", async () => {
        const bio = { zh: el.querySelector("#bioZh").value, en: el.querySelector("#bioEn").value };
        const owner = { name: el.querySelector("#ownerName").value, nameEn: el.querySelector("#ownerName").value, title: el.querySelector("#ownerTitle").value, titleEn: el.querySelector("#ownerTitle").value };
        try {
          const card = await UI.put("/api/admin/card", { bio, owner });
          App.data.card = card;
          UI.toast("已保存，访客端 / 小程序 / H5 已同步", "check");
        } catch (e) { UI.toast("保存失败"); }
      });
      el.querySelector("[data-save-menu]")?.addEventListener("click", async () => {
        const rows = [...el.querySelectorAll("#menuEditor [data-menu-id]")];
        const menu = rows.map((row) => {
          const id = row.dataset.menuId;
          const old = App.data.card.menu.find((m) => m.id === id) || {};
          return {
            ...old,
            id,
            label: row.querySelector('[data-field="label"]').value,
            labelEn: old.labelEn || row.querySelector('[data-field="label"]').value,
            url: row.querySelector('[data-field="url"]').value,
          };
        });
        try {
          const card = await UI.put("/api/admin/card", { menu });
          App.data.card = card;
          document.getElementById("consoleContent").innerHTML = this.viewContent();
          UI.iconify(document.getElementById("consoleContent"));
          this.bindSection();
          UI.toast("菜单已保存并同步", "check");
        } catch (e) { UI.toast("保存失败"); }
      });
      el.querySelectorAll("[data-menu-del]").forEach((b) => b.addEventListener("click", () => {
        b.closest("[data-menu-id]").remove();
      }));

      // AI
      el.querySelector("[data-save-persona]")?.addEventListener("click", async () => {
        try {
          await UI.post("/api/admin/persona", {
            greeting: { zh: el.querySelector("#greetZh").value, en: el.querySelector("#greetEn").value },
            tone: el.querySelector("#personaTone").value,
          });
          UI.toast("数字分身人设已更新", "check");
        } catch (e) { UI.toast("保存失败"); }
      });
      el.querySelector("[data-kb-add]")?.addEventListener("click", () => this.addKB(el));
      el.querySelector("#kbFile")?.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        el.querySelector("#kbContent").value = text.slice(0, 4000);
        if (!el.querySelector("#kbTitle").value) el.querySelector("#kbTitle").value = file.name.replace(/\.(md|txt)$/, "");
        UI.toast("文件已读取，确认内容后点击添加", "upload");
      });
      el.querySelectorAll("[data-kb-del]").forEach((b) => b.addEventListener("click", async () => {
        try {
          await fetch("/api/admin/kb/" + b.dataset.kbDel, { method: "DELETE" });
          if (App.data?.persona?.knowledge) {
            App.data.persona.knowledge = App.data.persona.knowledge.filter((k) => k.id !== b.dataset.kbDel);
            App.data.persona.knowledgeCount = App.data.persona.knowledge.length;
          }
          this.renderContent();
        } catch (e) { UI.toast("删除失败"); }
      }));
      el.querySelector("[data-voice-clone]")?.addEventListener("click", () => this.cloneVoice(el));

      // 团队继承
      el.querySelectorAll("[data-inherit]").forEach((b) => b.addEventListener("click", () => this.openInherit(b.dataset.inherit)));
      el.querySelector("[data-nfc-write]")?.addEventListener("click", () => {
        UI.toast("已写入 NDEF · 碰一碰即可打开名片", "nfc");
      });
      el.querySelector("[data-nfc-order]")?.addEventListener("click", () => {
        UI.toast("已提交 50 张 NTAG 215 制卡需求，顾问会联系你", "cart");
      });
      el.querySelector("[data-download-qr]")?.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = App.data.card.qrUrl;
        a.download = "晒名片-二维码.png";
        a.click();
        UI.toast("二维码已下载", "download");
      });
      el.querySelector("[data-mini]")?.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = App.data.card.qrUrl;
        a.download = "晒名片-小程序码.png";
        a.click();
        UI.toast("已下载（演示为同一二维码）", "wechat");
      });
    },

    async addKB(el) {
      const title = el.querySelector("#kbTitle").value.trim();
      const content = el.querySelector("#kbContent").value.trim();
      if (!title || !content) return UI.toast("请填写标题与内容", "file");
      const keywords = el.querySelector("#kbKeywords").value.split(/[,，\s]+/).filter(Boolean);
      try {
        const item = await UI.post("/api/admin/kb", {
          title,
          content,
          category: el.querySelector("#kbCat").value.trim() || "自定义",
          keywords,
        });
        if (App.data?.persona) {
          App.data.persona.knowledge = [item, ...(App.data.persona.knowledge || [])];
          App.data.persona.knowledgeCount = App.data.persona.knowledge.length;
        }
        this.renderContent();
        UI.toast("知识已写入，数字分身立即学会", "check");
      } catch (e) { UI.toast("添加失败"); }
    },

    cloneVoice(el) {
      const wave = el.querySelector("#voiceWave");
      const btn = el.querySelector("[data-voice-clone]");
      if (!wave || btn.dataset.busy) return;
      btn.dataset.busy = "1";
      wave.classList.add("recording");
      btn.innerHTML = `${UI.icon("mic")} 正在克隆声线… 68%`;
      UI.iconify(btn);
      setTimeout(async () => {
        wave.classList.remove("recording");
        el.querySelector("#voiceSim").textContent = "96.8%";
        btn.innerHTML = `${UI.icon("check")} 克隆完成`;
        UI.iconify(btn);
        btn.dataset.busy = "";
        try { await UI.post("/api/admin/persona", { voiceCloned: true, voiceSimilarity: 96.8 }); } catch (e) {}
        UI.toast("声线克隆完成 · 相似度 96.8%", "mic");
      }, 2200);
    },

    openInherit(id) {
      const team = this.data.team.filter((t) => t.status === "active" && !t.owner);
      const backdrop = document.createElement("div");
      backdrop.className = "drawer-backdrop";
      backdrop.innerHTML = `
        <div class="drawer" style="width:420px">
          <div class="drawer-head">
            <div><h3>离职继承</h3><p>客户资产不随员工离开</p></div>
            <button class="sheet-close" data-close>${UI.icon("close")}</button>
          </div>
          <div class="history-banner">
            ${UI.icon("shield")}
            <div><b>客户打开名片将看到新联系人</b><p>历史拜访记录、AI 对话与意向评分完整保留，并同步进入继任者待办。</p></div>
          </div>
          <div class="drawer-section">
            <h4>选择继任者</h4>
            ${team.map((t, i) => `
              <button class="pay-opt ${i === 0 ? "active" : ""}" data-successor="${t.id}" style="width:100%;margin-bottom:7px">
                <span class="tc-avatar" style="width:30px;height:30px;background:${t.color};display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-size:10px">${UI.esc(t.name.slice(0, 1))}</span>
                <b style="text-align:left">${UI.esc(t.name)}<span style="display:block;font-size:8px;color:var(--muted);font-weight:400">${UI.esc(t.title)} · ${t.clients} 位客户</span></b>
                <span class="pay-check"></span>
              </button>`).join("")}
          </div>
          <button class="console-btn orange" style="width:100%;justify-content:center;height:40px" data-confirm>确认执行继承</button>
          <p class="form-note">操作将留痕，可在审计日志中查看。</p>
        </div>`;
      document.body.appendChild(backdrop);
      UI.iconify(backdrop);
      let selected = team[0]?.id;
      const close = () => backdrop.remove();
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
      backdrop.querySelector("[data-close]").addEventListener("click", close);
      backdrop.querySelectorAll("[data-successor]").forEach((b) => b.addEventListener("click", () => {
        selected = b.dataset.successor;
        backdrop.querySelectorAll("[data-successor]").forEach((x) => x.classList.toggle("active", x === b));
      }));
      backdrop.querySelector("[data-confirm]").addEventListener("click", async () => {
        try {
          const res = await UI.post("/api/admin/inherit", { toId: selected });
          App.data.card = res.card;
          const boot = await UI.getJSON("/api/bootstrap");
          App.data.card = boot.card;
          App.data.persona = boot.persona;
          this.data = await UI.getJSON("/api/admin/overview");
          close();
          this.renderContent();
          if (typeof Card !== "undefined") Card.render();
          UI.toast("继承完成 · 客户已同步至新联系人", "check");
        } catch (e) { UI.toast("继承失败"); }
      });
    },

    async resetDemo() {
      try {
        await UI.post("/api/admin/reset", {});
        this.data = await UI.getJSON("/api/admin/overview");
        const boot = await UI.getJSON("/api/bootstrap");
        App.data = boot;
        App.profile = "manufacturing";
        App.lang = "zh";
        this.renderTop();
        this.renderContent();
        if (typeof Card !== "undefined") Card.render();
        UI.toast("演示数据已重置", "reset");
      } catch (e) { UI.toast("重置失败"); }
    },

    exportLeads() {
      const rows = [["姓名", "公司", "手机", "需求", "意向分", "等级", "时间"]];
      this.data.leads.forEach((l) => rows.push([l.name, l.company, l.phone, l.need, l.score, l.level || "", new Date(l.createdAt).toLocaleString("zh-CN")]));
      const csv = "\ufeff" + rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
      UI.downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "晒名片-线索导出.csv");
      UI.toast("线索已导出", "download");
    },

    connectStream() {
      if (this.es || !window.EventSource) return;
      this.es = new EventSource("/api/stream");
      this.es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "alert") {
            UI.toast(msg.data.text, "fire");
            if (this.data) {
              this.data.alerts.unshift(msg.data);
              const feed = document.getElementById("liveFeed");
              if (feed) {
                feed.innerHTML = this.feedItems(this.data.alerts);
                UI.iconify(feed);
              }
            }
          }
          if (msg.type === "visitor" && this.section === "overview" && msg.data) {
            const pill = document.getElementById("livePill");
            if (pill) pill.innerHTML = `<span class="dot"></span>${this.data.kpi.liveNow + 1} 位访客在线`;
          }
        } catch (err) {}
      };
    },

    closeStream() {
      if (this.es) {
        this.es.close();
        this.es = null;
      }
    },
  };

  window.Admin = Admin;
})();
