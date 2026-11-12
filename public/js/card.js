(function () {
  const Card = {
    activeTab: "intro",
    tabStart: Date.now(),
    scrollTop: 0,

    get lang() {
      return App.lang;
    },
    t(key) {
      return window.T(key, App.lang);
    },
    L(obj, zhKey, enKey) {
      if (!obj) return "";
      return App.lang === "en" ? obj[enKey] || obj[zhKey] : obj[zhKey];
    },
    card() {
      return App.data.card;
    },

    orderedCases() {
      const list = [...this.card().content.cases];
      if (App.profile === "overseas") {
        return list.sort((a, b) => (b.industry === "overseas" ? 1 : 0) - (a.industry === "overseas" ? 1 : 0));
      }
      return list.sort((a, b) => (b.id === "suzhou" ? 1 : 0) - (a.id === "suzhou" ? 1 : 0));
    },

    orderedProducts() {
      const list = [...this.card().content.products];
      if (App.profile === "overseas") {
        return list.sort((a, b) => (b.id === "global" ? 1 : 0) - (a.id === "global" ? 1 : 0));
      }
      return list;
    },

    render() {
      if (!App.data) return;
      const screen = document.getElementById("screen");
      if (!screen) return;
      if (document.getElementById("screen").dataset.ready === "1") {
        this.scrollTop = document.querySelector(".screen-body").scrollTop;
      }
      const card = this.card();
      const owner = card.owner;
      const unread = card.formerOwner;
      const banner =
        App.profile === "manufacturing"
          ? this.t("bannerManufacturing")
          : App.profile === "overseas"
          ? this.t("bannerOverseas")
          : this.t("bannerInvestor");

      screen.innerHTML = `
        <section class="hero">
          <div class="hero-glow"></div>
          <div class="hero-top">
            <div class="hero-brand"><img src="/assets/logo.svg" alt="晒名片" /><span>${this.t("brand")}</span></div>
            <div class="hero-top-actions">
              <button class="pill" data-action="chat"><span class="dot"></span>${this.t("online")}</button>
              <button class="lang-toggle" data-action="lang">${this.t("langSwitch")}</button>
              <button class="icon-btn" data-action="share" aria-label="share">${UI.icon("share")}</button>
            </div>
          </div>
          <div class="hero-profile">
            <div class="avatar-ring">
              <div class="avatar">${UI.esc(owner.avatarText || "沈")}</div>
              <span class="verified">✓</span>
            </div>
            <h1 class="hero-name">${UI.esc(App.lang === "en" ? owner.nameEn : owner.name)}</h1>
            <p class="hero-title">${UI.esc(App.lang === "en" ? owner.titleEn : owner.title)}</p>
            <p class="hero-company">${UI.esc(App.lang === "en" ? owner.companyEn : owner.company)}</p>
            <div class="hero-tags">
              ${card.tags.map((tag) => `<span class="hero-tag">${UI.esc(App.lang === "en" ? tag.en : tag.zh)}</span>`).join("")}
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn-primary" data-action="chat">${UI.icon("spark")}<span>${this.t("aiCta")}</span></button>
            <button class="btn-ghost" data-action="share" aria-label="share">${UI.icon("share")}</button>
            <button class="btn-ghost" data-action="save" aria-label="save">${UI.icon("save")}</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><b>${UI.num(card.stats.views)}</b><span>${this.t("views")}</span></div>
            <div class="hero-stat"><b>${UI.num(card.stats.connections)}</b><span>${this.t("connections")}</span></div>
            <div class="hero-stat"><b>${card.stats.rating} / 5.0</b><span>${this.t("rating")}</span></div>
          </div>
        </section>

        <div class="quick-grid">
          <button class="quick-item" data-action="lead">
            <span class="quick-ico">${UI.icon("message")}</span><span>${this.t("qMessage")}</span>
          </button>
          <button class="quick-item" data-action="booking">
            <span class="quick-ico">${UI.icon("calendar")}</span><span>${this.t("qBook")}</span>
          </button>
          <button class="quick-item" data-action="shop">
            <span class="quick-ico">${UI.icon("cart")}</span><span>${this.t("qShop")}</span>
          </button>
          <button class="quick-item" data-action="save">
            <span class="quick-ico">${UI.icon("save")}</span><span>${this.t("qSave")}</span>
          </button>
        </div>

        <div class="profile-banner">${UI.icon("target")}<span>${UI.esc(banner)}</span></div>

        ${unread ? `<div class="section" style="padding-bottom:0"><div class="history-banner">${UI.icon("users")}<div><b>${UI.esc(unread.name)} 已离职，名片由 ${UI.esc(owner.name)} 继承</b><p>历史客户资料、拜访记录与 AI 对话已完整交接。客户打开的永远是当前最新联系人。</p></div></div></div>` : ""}

        <div class="tabs" id="contentTabs">
          ${this.tabs().map((tab) => `<button data-tab="${tab.id}" class="${this.activeTab === tab.id ? "active" : ""}">${this.t(tab.key)}</button>`).join("")}
        </div>
        <div class="tab-panel" id="tabPanel">${this.renderTab(this.activeTab)}</div>

        <footer class="card-footer">
          <div class="brandline"><img src="/assets/logo.svg" alt="" /><span>${this.t("brand")}</span></div>
          <p>${this.t("footerNote")}</p>
        </footer>
      `;

      this.renderTabbar();
      UI.iconify(screen);
      this.bind(screen);
      if (App.data && App.data.card.formerOwner) {
        const q = document.querySelector(".device .avatar");
        if (q) q.textContent = owner.avatarText;
      }
      const body = document.querySelector(".screen-body");
      if (body && this.scrollTop) body.scrollTop = this.scrollTop;
      screen.dataset.ready = "1";
    },

    tabs() {
      return [
        { id: "intro", key: "tabsIntro" },
        { id: "products", key: "tabsProducts" },
        { id: "cases", key: "tabsCases" },
        { id: "certs", key: "tabsCerts" },
        { id: "videos", key: "tabsVideos" },
      ];
    },

    renderTabbar() {
      const bar = document.getElementById("tabbar");
      if (!bar) return;
      const active = "home";
      bar.innerHTML = `
        <button class="tab-item ${active === "home" ? "active" : ""}" data-nav="home">${UI.icon("grid")}<span>${this.t("navCard")}</span></button>
        <button class="tab-item" data-nav="content">${UI.icon("book")}<span>${this.t("navContent")}</span></button>
        <button class="tab-item tab-ai" data-nav="ai">
          <span class="ai-orb">${UI.icon("spark")}</span><span class="ai-label">${this.t("navAi")}</span>
        </button>
        <button class="tab-item" data-nav="booking">${UI.icon("calendar")}<span>${this.t("navBooking")}</span></button>
        <button class="tab-item" data-nav="site">${UI.icon("globe")}<span>${this.t("navSite")}</span></button>
      `;
      UI.iconify(bar);
      bar.querySelectorAll("[data-nav]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nav = btn.dataset.nav;
          if (nav === "home") {
            document.querySelector(".screen-body").scrollTo({ top: 0, behavior: "smooth" });
            App.track("module", "home", "回到名片首页");
          } else if (nav === "content") {
            document.getElementById("contentTabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
            App.track("module", "intro", "浏览内容板块");
          } else if (nav === "ai") {
            Chat.open();
          } else if (nav === "booking") {
            Card.openBooking();
          } else if (nav === "site") {
            Card.openMenu();
          }
        });
      });
    },

    renderTab(tab) {
      const t = this.t.bind(this);
      const card = this.card();
      if (tab === "intro") {
        const c = card.content;
        return `
          <div class="section-head" style="margin-top:10px">
            <h3 class="section-title">${t("introTitle")}<small>${t("introSmall")}</small></h3>
            <button class="section-link" data-action="chat">${UI.icon("spark")} AI 已读</button>
          </div>
          <p class="bio-text">${UI.esc(App.lang === "en" ? card.bio.en : card.bio.zh)}</p>
          <div class="highlight-grid">
            ${card.highlights.map((h) => `<div class="highlight"><b>${UI.esc(App.lang === "en" ? h.valueEn : h.value)}</b><span>${UI.esc(App.lang === "en" ? h.labelEn : h.label)}</span></div>`).join("")}
          </div>
          <div class="section-head">
            <h3 class="section-title">${t("introTitle")} · ${t("aboutCompany")}<small>COMPANY</small></h3>
          </div>
          <p class="bio-text">${UI.esc(App.lang === "en" ? c.intro.en : c.intro.zh)}</p>
          <div class="info-list">
            <div class="info-row">${UI.icon("briefcase")}<span>${t("aboutCompany")}</span><b>${UI.esc(App.lang === "en" ? card.owner.companyEn : card.owner.company)}</b></div>
            <div class="info-row">${UI.icon("location")}<span>${t("aboutCity")}</span><b>${UI.esc(App.lang === "en" ? card.owner.cityEn : card.owner.city)}</b></div>
            <div class="info-row">${UI.icon("mail")}<span>${t("aboutEmail")}</span><b>${UI.esc(card.owner.email)}</b><button class="copy" data-copy="${UI.esc(card.owner.email)}">${t("copy")}</button></div>
            <div class="info-row">${UI.icon("wechat")}<span>${t("aboutWechat")}</span><b>${UI.esc(card.owner.wechat)}</b><button class="copy" data-copy="${UI.esc(card.owner.wechat)}">${t("copy")}</button></div>
          </div>
          <div class="section-head" style="margin-top:18px">
            <h3 class="section-title">${t("contactTitle")}<small>SAVE CONTACT</small></h3>
          </div>
          <button class="btn-block dark" data-action="save">${UI.icon("save")} ${t("qSave")}</button>
        `;
      }
      if (tab === "products") {
        return `
          <div class="section-head" style="margin-top:10px">
            <h3 class="section-title">${t("productsTitle")}<small>${t("productsSmall")}</small></h3>
            <span class="section-link">${this.t("demo")} · 实时同步</span>
          </div>
          ${this.orderedProducts().map((p) => `
            <div class="shop-item" data-product="${p.id}">
              <div class="shop-art art-${p.tone}">${UI.icon(p.icon)}</div>
              <div class="shop-info">
                <b>${UI.esc(App.lang === "en" ? p.nameEn : p.name)}</b>
                <p>${UI.esc(App.lang === "en" ? p.descEn : p.desc)}</p>
                <div class="shop-price"><b>${UI.esc(App.lang === "en" ? p.priceEn : p.price)}</b><button class="buy-mini" data-buy="${p.id}">${t("shopBuy")}</button></div>
              </div>
            </div>`).join("")}
          <button class="btn-block dark" data-action="shop" style="margin-top:6px">${UI.icon("cart")} ${t("shopTitle")}</button>
        `;
      }
      if (tab === "cases") {
        return `
          <div class="section-head" style="margin-top:10px">
            <h3 class="section-title">${t("casesTitle")}<small>${t("casesSmall")}</small></h3>
            <span class="section-link">${this.orderedCases().length} 个案例</span>
          </div>
          ${this.orderedCases().map((c) => `
            <article class="case-card art-${c.tone}" data-case="${c.id}">
              <div class="case-top">
                <div class="case-metric">${c.metric}<small>${UI.esc(App.lang === "en" ? c.metricLabelEn : c.metricLabel)}</small></div>
                <span class="case-industry">${UI.esc(App.lang === "en" ? c.durationEn : c.duration)}</span>
              </div>
              <h4 class="case-title">${UI.esc(App.lang === "en" ? c.titleEn : c.title)}</h4>
              <p class="case-desc">${UI.esc(App.lang === "en" ? c.descEn : c.desc)}</p>
              <div class="case-foot">
                <div class="case-tags">${(App.lang === "en" ? c.tagsEn : c.tags).map((tag) => `<span>${UI.esc(tag)}</span>`).join("")}</div>
                <span class="case-go">${t("caseView")} ${UI.icon("chevron")}</span>
              </div>
            </article>`).join("")}
        `;
      }
      if (tab === "certs") {
        return `
          <div class="section-head" style="margin-top:10px">
            <h3 class="section-title">${t("certsTitle")}<small>${t("certsSmall")}</small></h3>
          </div>
          <div class="cert-grid">
            ${card.content.certificates.map((c) => `
              <div class="cert">
                <div class="cert-ico">${UI.icon(c.icon)}</div>
                <div><b>${UI.esc(c.title)}</b><span>${UI.esc(App.lang === "en" ? c.subEn : c.sub)}</span></div>
              </div>`).join("")}
          </div>
          <div class="section" style="padding:18px 0 0">
            <p class="bio-text" style="font-size:10.5px;color:var(--muted)">${App.lang === "en" ? "All certificates can be verified. Ask the digital twin for the full compliance pack." : "以上资质均可核验。需要完整的合规材料包，可以直接向数字分身索取。"}</p>
          </div>
        `;
      }
      return `
        <div class="section-head" style="margin-top:10px">
          <h3 class="section-title">${t("videosTitle")}<small>${t("videosSmall")}</small></h3>
        </div>
        ${card.content.videos.map((v) => `
          <button class="video-row" data-video="${v.id}">
            <div class="video-thumb art-${v.tone}"><span class="play-btn">${UI.icon("play")}</span></div>
            <div class="video-meta" style="text-align:left"><b>${UI.esc(App.lang === "en" ? v.titleEn : v.title)}</b><span>${v.duration} · 现场实拍</span></div>
          </button>`).join("")}
      `;
    },

    bind(root) {
      root.querySelectorAll("[data-action]").forEach((el) => {
        el.addEventListener("click", () => {
          const action = el.dataset.action;
          if (action === "chat") Chat.open();
          else if (action === "lang") App.setLang(App.lang === "en" ? "zh" : "en");
          else if (action === "share") Card.openShare();
          else if (action === "save") Card.saveContact();
          else if (action === "lead") Card.openLead();
          else if (action === "booking") Card.openBooking();
          else if (action === "shop") Card.openShop();
        });
      });
      root.querySelectorAll("[data-tab]").forEach((btn) => {
        btn.addEventListener("click", () => Card.switchTab(btn.dataset.tab));
      });
      root.querySelectorAll("[data-buy]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          Card.openPay(btn.dataset.buy);
        });
      });
      root.querySelectorAll("[data-product]").forEach((el) => {
        el.addEventListener("click", () => Card.openPay(el.dataset.product));
      });
      root.querySelectorAll("[data-case]").forEach((el) => {
        el.addEventListener("click", () => Card.openCase(el.dataset.case));
      });
      root.querySelectorAll("[data-video]").forEach((el) => {
        el.addEventListener("click", () => {
          UI.toast("演示环境：视频播放器未接入，可替换为企业视频源", "play");
          App.track("module", "video", "点击企业视频");
        });
      });
      root.querySelectorAll("[data-copy]").forEach((el) => {
        el.addEventListener("click", async (e) => {
          e.stopPropagation();
          await UI.copy(el.dataset.copy);
          UI.toast(Card.t("copiedTip"), "copy");
        });
      });
    },

    switchTab(tab) {
      if (tab === this.activeTab) return;
      const duration = Math.round((Date.now() - this.tabStart) / 1000);
      const modMap = { intro: "intro", products: "product", cases: "case", certs: "cert", videos: "video" };
      if (this.activeTab) {
        App.track("dwell", modMap[this.activeTab] || "intro", "阅读 " + this.activeTab, Math.min(duration, 300));
      }
      this.activeTab = tab;
      this.tabStart = Date.now();
      App.track("module", modMap[tab], "查看 " + tab + " 板块");
      const panel = document.getElementById("tabPanel");
      if (panel) {
        panel.innerHTML = this.renderTab(tab);
        UI.iconify(panel);
        this.bind(panel);
      }
      document.querySelectorAll("#contentTabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      document.getElementById("contentTabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    saveContact() {
      const card = this.card();
      const owner = card.owner;
      const vcf = UI.vCard({
        name: App.lang === "en" ? owner.nameEn : owner.name,
        company: App.lang === "en" ? owner.companyEn : owner.company,
        title: App.lang === "en" ? owner.titleEn : owner.title,
        phone: owner.phone,
        email: owner.email,
        url: App.data.shareUrl,
        note: "晒名片 · AI 电子名片",
      });
      UI.downloadBlob(new Blob([vcf], { type: "text/vcard;charset=utf-8" }), `${owner.nameEn || owner.name}.vcf`);
      UI.toast(this.t("savedTip"), "check");
      App.track("share", "contact", "保存名片到通讯录");
    },

    openLead(prefill = {}) {
      const t = this.t.bind(this);
      const card = this.card();
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${t("leadTitle")}</h3><p>${t("leadSub")}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        <form id="leadForm">
          <div class="form-row">
            <div class="form-field"><label>${t("leadName")}</label><input name="name" required placeholder="${t("leadNamePh")}" value="${UI.esc(prefill.name || "")}" /></div>
            <div class="form-field"><label>${t("leadCompany")}</label><input name="company" placeholder="${t("leadCompanyPh")}" value="${UI.esc(prefill.company || "")}" /></div>
          </div>
          <div class="form-field"><label>${t("leadPhone")}</label><input name="phone" required placeholder="${t("leadPhonePh")}" /></div>
          <div class="form-field"><label>${t("leadNeed")}</label><textarea name="need" placeholder="${t("leadNeedPh")}"></textarea></div>
          <button class="btn-block" type="submit">${UI.icon("send")} ${t("leadSubmit")}</button>
          <p class="form-note">${t("leadNote")}</p>
        </form>
      `);
      const form = sheet.body.querySelector("#leadForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submit = form.querySelector("button[type=submit]");
        submit.textContent = t("submitting");
        submit.disabled = true;
        const fd = new FormData(form);
        try {
          const data = await UI.post("/api/leads", {
            visitorId: App.visitorId,
            name: fd.get("name"),
            company: fd.get("company"),
            phone: fd.get("phone"),
            need: fd.get("need"),
            lang: App.lang,
          });
          sheet.body.innerHTML = `
            <div class="success-panel">
              <div class="success-ico">${UI.icon("check")}</div>
              <h3>${t("leadSuccessTitle")}</h3>
              <p>${t("leadSuccessSub")}</p>
              <div class="success-meta">
                <div><span>${t("leadName")}</span><b>${UI.esc(fd.get("name"))}</b></div>
                <div><span>${t("leadPhone")}</span><b>${UI.esc(fd.get("phone"))}</b></div>
                <div><span>${t("intentA")}</span><b>${data.score} / 100 · ${data.level}</b></div>
              </div>
              <button class="btn-block" data-chat>${UI.icon("spark")} ${t("aiCta")}</button>
              <button class="btn-block dark" data-close style="margin-top:8px">${t("sheetClose")}</button>
            </div>`;
          UI.iconify(sheet.body);
          sheet.body.querySelector("[data-chat]")?.addEventListener("click", () => {
            sheet.close();
            Chat.open();
          });
          sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
          UI.toast(t("leadSuccessTitle"), "check");
        } catch (err) {
          submit.disabled = false;
          submit.textContent = t("leadSubmit");
          UI.toast(err.message || t("error"));
        }
      });
    },

    async openBooking() {
      const t = this.t.bind(this);
      let slots = App.data.slots;
      try {
        slots = await UI.getJSON("/api/slots");
        App.data.slots = slots;
      } catch (e) {}
      const state = { date: slots[0]?.date, slot: null, mode: "线上" };
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${t("bookTitle")}</h3><p>${t("bookSub")}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        <div class="form-field"><label>${t("bookDate")}</label></div>
        <div class="day-chips" id="dayChips"></div>
        <div class="form-field" style="margin-top:12px"><label>${t("bookSlot")}</label></div>
        <div class="slot-grid" id="slotGrid"></div>
        <div class="form-field" style="margin-top:12px"><label>${t("bookMode")}</label>
          <div class="mode-switch" id="modeSwitch">
            <button data-mode="线上" class="active">${t("modeOnline")}</button>
            <button data-mode="到厂">${t("modeOnsite")}</button>
          </div>
        </div>
        <form id="bookForm">
          <div class="form-row">
            <div class="form-field"><label>${t("bookName")}</label><input name="name" required value="${UI.esc((App.data.card.formerOwner ? "" : ""))}" placeholder="${t("leadNamePh")}" /></div>
            <div class="form-field"><label>${t("bookPhone")}</label><input name="phone" required placeholder="138 0000 0000" /></div>
          </div>
          <div class="form-field"><label>${t("leadCompany")}</label><input name="company" placeholder="${t("leadCompanyPh")}" /></div>
          <button class="btn-block" type="submit">${UI.icon("calendar")} ${t("bookSubmit")}</button>
          <p class="form-note">${t("leadNote")}</p>
        </form>
      `, { noGrab: false });

      const renderDays = () => {
        sheet.body.querySelector("#dayChips").innerHTML = slots.map((d, i) => `
          <button class="day-chip ${d.date === state.date ? "active" : ""}" data-date="${d.date}">
            <b>${i === 0 ? "今天" : i === 1 ? "明天" : d.label}</b><span>${d.date}</span>
          </button>`).join("");
        sheet.body.querySelectorAll("[data-date]").forEach((b) => b.addEventListener("click", () => {
          state.date = b.dataset.date;
          state.slot = null;
          renderDays();
          renderSlots();
        }));
      };
      const renderSlots = () => {
        const day = slots.find((d) => d.date === state.date) || slots[0];
        sheet.body.querySelector("#slotGrid").innerHTML = day.slots.map((s) => `
          <button class="slot ${state.slot === s.time ? "active" : ""}" data-slot="${s.time}" ${s.taken ? "disabled" : ""}>${s.time}</button>`).join("");
        sheet.body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => {
          state.slot = b.dataset.slot;
          renderSlots();
        }));
      };
      renderDays();
      renderSlots();
      sheet.body.querySelectorAll("#modeSwitch button").forEach((b) => b.addEventListener("click", () => {
        state.mode = b.dataset.mode;
        sheet.body.querySelectorAll("#modeSwitch button").forEach((x) => x.classList.toggle("active", x === b));
      }));
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);

      const form = sheet.body.querySelector("#bookForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.slot) return UI.toast("请选择时段", "clock");
        const fd = new FormData(form);
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = t("submitting");
        try {
          await UI.post("/api/appointments", {
            visitorId: App.visitorId,
            name: fd.get("name"),
            phone: fd.get("phone"),
            company: fd.get("company"),
            date: state.date,
            slot: state.slot,
            mode: state.mode,
          });
          sheet.body.innerHTML = `
            <div class="success-panel">
              <div class="success-ico">${UI.icon("check")}</div>
              <h3>${t("bookSuccessTitle")}</h3>
              <p>${t("bookSuccessSub")}</p>
              <div class="success-meta">
                <div><span>${t("bookDate")}</span><b>${state.date}</b></div>
                <div><span>${t("bookSlot")}</span><b>${state.slot}</b></div>
                <div><span>${t("bookMode")}</span><b>${state.mode === "线上" ? t("modeOnline") : t("modeOnsite")}</b></div>
                <div><span>${t("leadName")}</span><b>${UI.esc(fd.get("name"))}</b></div>
              </div>
              <button class="btn-block dark" data-close>${t("sheetClose")}</button>
            </div>`;
          UI.iconify(sheet.body);
          sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = t("bookSubmit");
          UI.toast(err.message.includes("时段") ? t("slotTaken") : err.message || t("error"));
        }
      });
    },

    openShop() {
      const t = this.t.bind(this);
      const products = this.orderedProducts();
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${t("shopTitle")}</h3><p>${t("shopSub")}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        ${products.map((p) => `
          <div class="shop-item">
            <div class="shop-art art-${p.tone}">${UI.icon(p.icon)}</div>
            <div class="shop-info">
              <b>${UI.esc(App.lang === "en" ? p.nameEn : p.name)}</b>
              <p>${UI.esc(App.lang === "en" ? p.descEn : p.desc)}</p>
              <div class="shop-price"><b>${UI.esc(App.lang === "en" ? p.priceEn : p.price)}</b><button class="buy-mini" data-buy="${p.id}">${t("shopBuy")}</button></div>
            </div>
          </div>`).join("")}
        <p class="form-note">${App.lang === "en" ? "Prices are indicative. Cross-border payment available for overseas clients." : "价格为起步参考，最终以产线诊断后的方案为准。海外客户支持跨境支付。"}</p>
      `, { noGrab: false });
      sheet.body.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => {
        sheet.close();
        Card.openPay(b.dataset.buy);
      }));
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
      App.track("module", "shop", "打开方案商店");
    },

    openPay(productId) {
      const t = this.t.bind(this);
      const products = this.card().content.products;
      const p = products.find((x) => x.id === productId) || products[0];
      const state = { channel: App.profile === "overseas" ? "跨境支付" : "微信支付" };
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${t("payTitle")}</h3><p>${t("paySubmit")} · ${UI.esc(p.name)}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        <div class="shop-item" style="margin-bottom:14px">
          <div class="shop-art art-${p.tone}">${UI.icon(p.icon)}</div>
          <div class="shop-info">
            <b>${UI.esc(App.lang === "en" ? p.nameEn : p.name)}</b>
            <p>${UI.esc(App.lang === "en" ? p.descEn : p.desc)}</p>
            <div class="shop-price"><b>${UI.esc(App.lang === "en" ? p.priceEn : p.price)}</b><span style="font-size:8px;color:var(--muted)">${p.badge}</span></div>
          </div>
        </div>
        <div class="pay-options" id="payOptions">
          <button class="pay-opt ${state.channel === "微信支付" ? "active" : ""}" data-channel="微信支付">
            <span class="pay-ico" style="background:#2e7d5b">微</span><b>${t("payWx")}</b><span>推荐</span><span class="pay-check"></span>
          </button>
          <button class="pay-opt ${state.channel === "支付宝" ? "active" : ""}" data-channel="支付宝">
            <span class="pay-ico" style="background:#2b5f8a">支</span><b>${t("payAli")}</b><span>花呗分期</span><span class="pay-check"></span>
          </button>
          <button class="pay-opt ${state.channel === "跨境支付" ? "active" : ""}" data-channel="跨境支付">
            <span class="pay-ico" style="background:#171310">S</span><b>${t("payCross")}</b><span>USD / EUR</span><span class="pay-check"></span>
          </button>
        </div>
        <form id="payForm" style="margin-top:12px">
          <div class="form-row">
            <div class="form-field"><label>${t("leadName")}</label><input name="name" required placeholder="${t("leadNamePh")}" /></div>
            <div class="form-field"><label>${t("leadCompany")}</label><input name="company" placeholder="${t("leadCompanyPh")}" /></div>
          </div>
          <button class="btn-block" type="submit">${UI.icon("wallet")} ${t("paySubmit")} · ${UI.esc(App.lang === "en" ? p.priceEn : p.price)}</button>
          <p class="form-note">${App.lang === "en" ? "Demo payment — no real charge is made." : "演示支付，不会产生真实扣款。实际接入可替换为微信支付 / 支付宝 / Stripe。"}</p>
        </form>
      `, { noGrab: false });
      sheet.body.querySelectorAll("[data-channel]").forEach((b) => b.addEventListener("click", () => {
        state.channel = b.dataset.channel;
        sheet.body.querySelectorAll("[data-channel]").forEach((x) => x.classList.toggle("active", x === b));
      }));
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
      const form = sheet.body.querySelector("#payForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        try {
          const order = await UI.post("/api/orders", {
            visitorId: App.visitorId,
            name: fd.get("name"),
            company: fd.get("company"),
            productId: p.id,
            channel: state.channel,
          });
          sheet.body.innerHTML = `
            <div class="success-panel">
              <div class="success-ico">${UI.icon("check")}</div>
              <h3>${t("paySuccessTitle")}</h3>
              <p>${t("paySuccessSub")}</p>
              <div class="success-meta">
                <div><span>订单号</span><b>${order.id}</b></div>
                <div><span>产品</span><b>${UI.esc(order.productName)}</b></div>
                <div><span>支付方式</span><b>${UI.esc(order.channel)}</b></div>
                <div><span>金额</span><b>${order.currency === "USD" ? "$" : "¥"}${UI.num(order.amount)}</b></div>
              </div>
              <button class="btn-block dark" data-close>${t("sheetClose")}</button>
            </div>`;
          UI.iconify(sheet.body);
          sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
        } catch (err) {
          btn.disabled = false;
          UI.toast(err.message || t("error"));
        }
      });
      App.track("module", "shop", "查看商品 " + p.name);
    },

    openCase(id) {
      const t = this.t.bind(this);
      const c = this.card().content.cases.find((x) => x.id === id);
      if (!c) return;
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${UI.esc(App.lang === "en" ? c.titleEn : c.title)}</h3><p>${UI.esc(App.lang === "en" ? c.durationEn : c.duration)} · ${UI.esc(App.lang === "en" ? c.metricLabelEn : c.metricLabel)} ${c.metric}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        <div class="case-card art-${c.tone}" style="margin-bottom:14px">
          <div class="case-top">
            <div class="case-metric">${c.metric}<small>${UI.esc(App.lang === "en" ? c.metricLabelEn : c.metricLabel)}</small></div>
            <span class="case-industry">${UI.esc(App.lang === "en" ? c.durationEn : c.duration)}</span>
          </div>
          <h4 class="case-title">${UI.esc(App.lang === "en" ? c.titleEn : c.title)}</h4>
          <p class="case-desc">${UI.esc(App.lang === "en" ? c.descEn : c.desc)}</p>
        </div>
        <p class="bio-text" style="font-size:10.5px">${App.lang === "en" ? "Starting point: three months of production, energy and quality data, then a single-line pilot. No big-bang transformation. The full case note is available from the digital twin or in a 30-minute diagnosis." : "项目起点：先用 3 个月的产能、能耗与质量数据做一次基线诊断，再选一条产线试点，不做「大而全」的改造。完整复盘笔记可以向数字分身索取，也可以在 30 分钟诊断中当面拆解。"}</p>
        <button class="btn-block" data-chat>${UI.icon("spark")} ${t("aiCta")}</button>
        <button class="btn-block dark" data-book style="margin-top:8px">${UI.icon("calendar")} ${t("qBook")}</button>
      `, { noGrab: false });
      sheet.body.querySelector("[data-chat]")?.addEventListener("click", () => {
        sheet.close();
        Chat.open({ prefill: App.lang === "en" ? "Tell me how the Suzhou cost case started" : "讲讲苏州降本案例是怎么开始的" });
      });
      sheet.body.querySelector("[data-book]")?.addEventListener("click", () => {
        sheet.close();
        Card.openBooking();
      });
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
      App.track("module", "case", "查看案例 " + c.title);
    },

    openShare() {
      const t = this.t.bind(this);
      const card = this.card();
      const shareUrl = App.data.shareUrl;
      const qr = `/api/qr?text=${encodeURIComponent(shareUrl)}`;
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${t("shareTitle")}</h3><p>${t("shareSub")}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        <div class="share-tabs" id="shareTabs">
          <button data-stab="qr" class="active">${t("tabQr")}</button>
          <button data-stab="nfc">${t("tabNfc")}</button>
          <button data-stab="wechat">${t("tabWechat")}</button>
        </div>
        <div id="shareBody"></div>
      `, { noGrab: true });

      const bodies = {
        qr: `
          <div class="qr-panel">
            <div class="qr-frame">
              <img src="${qr}" alt="QR" />
              <span class="qr-badge">SHINE CARD · ${UI.esc(card.owner.name)}</span>
            </div>
            <h4 class="qr-title">${App.lang === "en" ? "Scan to open my card" : "扫码打开我的名片"}</h4>
            <p class="qr-sub">${App.lang === "en" ? "Works in WeChat and any browser" : "微信 / 浏览器均可打开 · 数据实时同步"}</p>
            <div class="share-actions">
              <button class="share-action" data-copy-link>${UI.icon("link")} ${t("copyLink")}</button>
              <button class="share-action" data-poster>${UI.icon("download")} ${t("savePoster")}</button>
              <button class="share-action" data-lead>${UI.icon("message")} ${t("qMessage")}</button>
              <button class="share-action dark" data-nfc>${UI.icon("nfc")} NFC</button>
            </div>
          </div>`,
        nfc: `
          <div class="nfc-visual">
            <div class="nfc-card" id="nfcCard">
              <span class="nfc-chip"></span>
              <img class="nfc-logo" src="/assets/logo.svg" alt="" />
              <div class="nfc-name">${UI.esc(card.owner.name)}</div>
              <div class="nfc-title">${UI.esc(App.lang === "en" ? card.owner.titleEn : card.owner.title)}</div>
              <span class="nfc-waves">${UI.icon("nfc")}</span>
              <span class="nfc-ripple" style="display:none"></span>
            </div>
            <p class="nfc-hint">${t("nfcHint")}</p>
          </div>
          <button class="btn-block dark" data-nfc-write>${UI.icon("nfc")} ${t("nfcBtn")}</button>
          <p class="form-note">NFC 卡支持 NTAG 213/215/216，写入后无需打开 App，碰一碰即可访问。</p>`,
        wechat: `
          <div class="wechat-guide">
            <div class="qr-frame" style="margin-bottom:14px"><img src="${qr}" alt="QR" style="width:150px;height:150px" /></div>
            <div class="arrow">↗</div>
            <p>${t("wechatHint")}</p>
            <div class="share-actions" style="margin-top:10px">
              <button class="share-action" data-copy-link>${UI.icon("link")} ${t("copyLink")}</button>
              <button class="share-action" data-poster>${UI.icon("download")} ${t("savePoster")}</button>
            </div>
            <div class="success-meta" style="margin-top:16px;text-align:left">
              <div><span>${t("wechatMini")}</span><b>${App.lang === "en" ? "Synced" : "已打通"}</b></div>
              <div><span>独立链接</span><b>${shareUrl.replace(/^https?:\/\//, "").slice(0, 28)}</b></div>
            </div>
            <p class="form-note">${t("wechatMiniHint")}</p>
          </div>`,
      };

      const body = sheet.body.querySelector("#shareBody");
      const renderBody = (tab) => {
        body.innerHTML = bodies[tab];
        UI.iconify(body);
        bindBody();
        sheet.body.querySelectorAll("[data-stab]").forEach((b) => b.classList.toggle("active", b.dataset.stab === tab));
      };
      const bindBody = () => {
        body.querySelector("[data-copy-link]")?.addEventListener("click", async () => {
          await UI.copy(shareUrl);
          UI.toast(t("copiedTip"), "copy");
          App.track("share", "link", "复制名片链接");
        });
        body.querySelector("[data-poster]")?.addEventListener("click", () => Card.savePoster());
        body.querySelector("[data-nfc]")?.addEventListener("click", () => renderBody("nfc"));
        body.querySelector("[data-nfc-write]")?.addEventListener("click", () => Card.nfcWrite(body));
        body.querySelector("[data-lead]")?.addEventListener("click", () => {
          sheet.close();
          Card.openLead();
        });
        body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
      };
      sheet.body.querySelectorAll("[data-stab]").forEach((b) => b.addEventListener("click", () => renderBody(b.dataset.stab)));
      renderBody("qr");
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
      App.track("share", "share", "打开分享面板");
    },

    nfcWrite(scope) {
      const t = this.t.bind(this);
      const card = scope.querySelector("#nfcCard");
      const ripple = scope.querySelector(".nfc-ripple");
      if (ripple) ripple.style.display = "block";
      card?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }],
        { duration: 700, easing: "ease-out" }
      );
      setTimeout(() => {
        if (ripple) ripple.style.display = "none";
        UI.toast(t("nfcDone"), "nfc");
        App.track("nfc", "share", "写入 NFC 名片");
      }, 1200);
    },

    openMenu() {
      const t = this.t.bind(this);
      const card = this.card();
      const shareUrl = App.data.shareUrl;
      const sheet = UI.sheet(`
        <div class="sheet-head">
          <div><h3>${App.lang === "en" ? "More from me" : "更多入口"}</h3><p>${App.lang === "en" ? "Custom menu · one edit, synced everywhere" : "底部自定义菜单 · 一次修改，全端同步"}</p></div>
          <button class="sheet-close" data-close>${UI.icon("close")}</button>
        </div>
        ${card.menu.map((m) => `
          <button class="shop-item" data-menu="${m.id}" style="width:100%;text-align:left">
            <div class="shop-art art-ink" style="width:48px;height:48px;flex:0 0 48px">${UI.icon(m.icon)}</div>
            <div class="shop-info" style="display:flex;align-items:center">
              <div style="flex:1">
                <b>${UI.esc(App.lang === "en" ? m.labelEn : m.label)}</b>
                <p>${UI.esc(App.lang === "en" ? m.descEn : m.desc)}</p>
              </div>
              ${UI.icon("external")}
            </div>
          </button>`).join("")}
        <div class="qr-panel" style="padding-top:8px">
          <div class="qr-frame"><img src="/api/qr?text=${encodeURIComponent(shareUrl)}" alt="QR" style="width:130px;height:130px" /></div>
          <p class="qr-sub" style="margin-top:14px">${t("wechatMiniHint")}</p>
        </div>
      `, { noGrab: false });
      sheet.body.querySelectorAll("[data-menu]").forEach((b) => b.addEventListener("click", () => {
        const m = card.menu.find((x) => x.id === b.dataset.menu);
        if (!m) return;
        if (m.id === "miniapp") {
          UI.toast(App.lang === "en" ? "Scan the QR in WeChat to open the Mini Program" : "请在微信中扫码打开小程序版本", "wechat");
        } else {
          window.open(m.url, "_blank", "noopener");
        }
        App.track("module", "contact", "自定义菜单 · " + m.label);
      }));
      sheet.body.querySelector("[data-close]")?.addEventListener("click", sheet.close);
    },

    async savePoster() {
      const t = this.t.bind(this);
      const card = this.card();
      const owner = card.owner;
      try {
        await document.fonts.ready;
        const W = 1080;
        const H = 1480;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#F6F1E7";
        ctx.fillRect(0, 0, W, H);

        const grad = ctx.createRadialGradient(860, 90, 10, 860, 90, 560);
        grad.addColorStop(0, "rgba(255,176,32,.55)");
        grad.addColorStop(0.45, "rgba(255,90,31,.18)");
        grad.addColorStop(1, "rgba(255,90,31,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, 780);

        roundRect(ctx, 48, 48, W - 96, 900, 46);
        ctx.fillStyle = "#171310";
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,.07)";
        ctx.lineWidth = 1;
        for (let x = 80; x < W - 80; x += 54) {
          ctx.beginPath();
          ctx.moveTo(x, 70);
          ctx.lineTo(x, 900);
          ctx.stroke();
        }

        const logo = new Image();
        logo.src = "/assets/logo.svg";
        await new Promise((r) => { logo.onload = r; logo.onerror = r; });
        try { ctx.drawImage(logo, 96, 96, 62, 62); } catch (e) {}

        ctx.fillStyle = "#FBF7EE";
        ctx.font = '600 30px "Noto Serif SC", serif';
        ctx.fillText(App.lang === "en" ? "SHINE CARD" : "晒名片", 176, 140);

        ctx.fillStyle = "rgba(251,247,238,.5)";
        ctx.font = '500 20px "Manrope", sans-serif';
        ctx.fillText("AI BUSINESS CARD · 2026", 96, 210);

        // avatar
        const ag = ctx.createLinearGradient(96, 280, 260, 444);
        ag.addColorStop(0, "#FF9A4D");
        ag.addColorStop(1, "#D93A09");
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(174, 360, 78, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFE3B8";
        ctx.font = '600 64px "Noto Serif SC", serif';
        ctx.textAlign = "center";
        ctx.fillText(owner.avatarText || "沈", 174, 384);
        ctx.textAlign = "left";

        ctx.fillStyle = "#FBF7EE";
        ctx.font = '600 92px "Noto Serif SC", serif';
        ctx.fillText(App.lang === "en" ? owner.nameEn : owner.name, 96, 560);
        ctx.fillStyle = "rgba(251,247,238,.78)";
        ctx.font = '400 32px "Noto Sans SC", sans-serif';
        ctx.fillText(App.lang === "en" ? owner.titleEn : owner.title, 98, 618);
        ctx.fillStyle = "rgba(251,247,238,.48)";
        ctx.font = '500 24px "Manrope", sans-serif';
        ctx.fillText((App.lang === "en" ? owner.companyEn : owner.company) + "  ·  " + (App.lang === "en" ? owner.cityEn : owner.city), 98, 666);

        ctx.fillStyle = "rgba(255,176,32,.14)";
        roundRect(ctx, 96, 724, 660, 92, 46);
        ctx.fill();
        ctx.fillStyle = "#FFD9A8";
        ctx.font = '500 28px "Noto Sans SC", sans-serif';
        ctx.fillText(App.lang === "en" ? "24/7 AI twin · replies in seconds" : "数字分身 24 小时在线 · 秒回", 132, 782);

        // QR card
        roundRect(ctx, 700, 920, 284, 340, 34);
        ctx.fillStyle = "#FFFDF8";
        ctx.fill();
        const qr = new Image();
        qr.src = `/api/qr?text=${encodeURIComponent(App.data.shareUrl)}`;
        await new Promise((r) => { qr.onload = r; qr.onerror = r; });
        try { ctx.drawImage(qr, 722, 942, 240, 240); } catch (e) {}
        ctx.fillStyle = "#171310";
        ctx.font = '700 22px "Manrope", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(App.lang === "en" ? "SCAN TO CONNECT" : "扫码与我连接", 842, 1222);
        ctx.textAlign = "left";

        ctx.fillStyle = "#171310";
        ctx.font = '600 54px "Noto Serif SC", serif';
        ctx.fillText(App.lang === "en" ? "A card that talks back." : "一张会对话的名片。", 96, 1100);
        ctx.fillStyle = "#6F675C";
        ctx.font = '400 28px "Noto Sans SC", sans-serif';
        wrapText(ctx, App.lang === "en" ? "Digital twin, visitor intent tracking, NFC and a full micro-site — in one card." : "数字分身、访客意向追踪、NFC 与微官网，都在这张名片里。", 96, 1160, 520, 44);

        ctx.fillStyle = "rgba(23,19,16,.1)";
        ctx.fillRect(96, 1300, W - 192, 1);
        ctx.fillStyle = "#8B8175";
        ctx.font = '500 22px "Manrope", sans-serif';
        ctx.fillText(App.data.shareUrl.replace(/^https?:\/\//, ""), 96, 1352);
        ctx.fillStyle = "#FF5A1F";
        ctx.font = '700 24px "Manrope", sans-serif';
        ctx.textAlign = "right";
        ctx.fillText("SHINE CARD", W - 96, 1352);
        ctx.textAlign = "left";

        canvas.toBlob((blob) => {
          UI.downloadBlob(blob, "晒名片-沈知远.png");
          UI.toast(t("posterSaved"), "download");
          App.track("share", "poster", "保存名片海报");
        }, "image/png");
      } catch (err) {
        console.error(err);
        UI.toast(t("error"));
      }
    },
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = String(text).split("");
    let line = "";
    let yy = y;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = ch;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  window.Card = Card;
})();
