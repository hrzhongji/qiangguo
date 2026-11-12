const app = getApp();
const { t } = require("../../utils/i18n");

function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Page({
  data: {
    loading: true,
    tab: "intro",
    vm: null,
  },

  onLoad() {
    this.load();
  },

  onPullDownRefresh() {
    this.load(true);
  },

  async load(force) {
    try {
      const data = await app.loadCard(force);
      const lang = app.globalData.lang;
      this.setData({ loading: false, vm: this.buildVm(data, lang) });
      if (!this.tracked) {
        this.tracked = true;
        app.track("view", "home", "打开名片");
      }
    } catch (err) {
      wx.showToast({ title: err.message || "加载失败", icon: "none" });
    }
    wx.stopPullDownRefresh();
  },

  buildVm(data, lang) {
    const c = data.card;
    const en = lang === "en";
    const cases = [...c.content.cases].sort(
      (a, b) => (b.id === "suzhou" ? 1 : 0) - (a.id === "suzhou" ? 1 : 0)
    );
    return {
      langLabel: en ? "中文" : "EN",
      brand: t(lang, "brand"),
      online: t(lang, "online"),
      aiCta: t(lang, "aiCta"),
      share: t(lang, "share"),
      saveShort: en ? "Save" : "存",
      owner: {
        name: en ? c.owner.nameEn : c.owner.name,
        title: en ? c.owner.titleEn : c.owner.title,
        company: en ? c.owner.companyEn : c.owner.company,
        avatar: c.owner.avatarText || "沈",
        phone: c.owner.phone,
        wechat: c.owner.wechat,
      },
      tags: c.tags.map((x) => (en ? x.en : x.zh)),
      stats: [
        { v: fmt(c.stats.views), l: t(lang, "views") },
        { v: fmt(c.stats.connections), l: t(lang, "connections") },
        { v: c.stats.rating + " / 5.0", l: t(lang, "rating") },
      ],
      quick: [
        { key: "lead", label: t(lang, "qMessage"), ico: "聊" },
        { key: "booking", label: t(lang, "qBook"), ico: "约" },
        { key: "shop", label: t(lang, "qShop"), ico: "购" },
        { key: "save", label: t(lang, "qSave"), ico: "存" },
      ],
      banner: t(lang, "bannerManufacturing"),
      former: c.formerOwner
        ? {
            name: c.formerOwner.name,
            owner: en ? c.owner.nameEn : c.owner.name,
            text: t(lang, "inherited"),
          }
        : null,
      tabs: [
        { id: "intro", label: t(lang, "tabsIntro") },
        { id: "products", label: t(lang, "tabsProducts") },
        { id: "cases", label: t(lang, "tabsCases") },
        { id: "certs", label: t(lang, "tabsCerts") },
        { id: "videos", label: t(lang, "tabsVideos") },
      ],
      introTitle: t(lang, "introTitle"),
      introSmall: t(lang, "introSmall"),
      productsTitle: t(lang, "productsTitle"),
      productsSmall: t(lang, "productsSmall"),
      casesTitle: t(lang, "casesTitle"),
      casesSmall: t(lang, "casesSmall"),
      certsTitle: t(lang, "certsTitle"),
      certsSmall: t(lang, "certsSmall"),
      videosTitle: t(lang, "videosTitle"),
      videosSmall: t(lang, "videosSmall"),
      menuTitle: t(lang, "menuTitle"),
      footer: t(lang, "footerNote"),
      bio: en ? c.bio.en : c.bio.zh,
      highlights: c.highlights.map((h) => ({
        v: en ? h.valueEn : h.value,
        l: en ? h.labelEn : h.label,
      })),
      products: c.content.products.map((p) => ({
        id: p.id,
        name: en ? p.nameEn : p.name,
        desc: en ? p.descEn : p.desc,
        price: en ? p.priceEn : p.price,
        badge: en ? p.badgeEn : p.badge,
        tone: p.tone,
        glyph: (en ? p.nameEn : p.name).slice(0, 1),
      })),
      cases: cases.map((x) => ({
        id: x.id,
        metric: x.metric,
        metricLabel: en ? x.metricLabelEn : x.metricLabel,
        title: en ? x.titleEn : x.title,
        desc: en ? x.descEn : x.desc,
        tags: en ? x.tagsEn : x.tags,
      })),
      certs: c.content.certificates.map((x) => ({
        title: x.title,
        sub: en ? x.subEn : x.sub,
        icon: "证",
      })),
      videos: c.content.videos.map((v) => ({
        id: v.id,
        title: en ? v.titleEn : v.title,
        duration: v.duration,
        tone: v.tone,
      })),
      menu: c.menu.map((m) => ({
        id: m.id,
        label: en ? m.labelEn : m.label,
        desc: en ? m.descEn : m.desc,
        url: m.url,
      })),
      nav: {
        card: t(lang, "navCard"),
        content: t(lang, "navContent"),
        ai: t(lang, "navAi"),
        book: t(lang, "navBook"),
      },
    };
  },

  toggleLang() {
    const lang = app.globalData.lang === "en" ? "zh" : "en";
    app.globalData.lang = lang;
    this.setData({ vm: this.buildVm(app.globalData.data, lang) });
    app.track("module", "intro", "切换语言 · " + lang);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.id;
    if (tab === this.data.tab) return;
    this.setData({ tab });
    app.track("module", tab === "cases" ? "case" : tab === "products" ? "product" : tab, "查看 " + tab);
  },

  onQuick(e) {
    const key = e.currentTarget.dataset.key;
    if (key === "lead") this.goLead();
    else if (key === "booking") this.goBooking();
    else if (key === "shop") this.goPay();
    else if (key === "save") this.saveContact();
  },

  goChat() {
    wx.navigateTo({ url: "/pages/chat/chat" });
  },
  goLead() {
    wx.navigateTo({ url: "/pages/lead/lead" });
  },
  goBooking() {
    wx.navigateTo({ url: "/pages/booking/booking" });
  },
  goPay(e) {
    const id = e && e.currentTarget ? e.currentTarget.dataset.id : "";
    wx.navigateTo({ url: "/pages/pay/pay" + (id ? "?productId=" + id : "") });
  },
  goShare() {
    wx.navigateTo({ url: "/pages/share/share" });
  },

  saveContact() {
    const o = this.data.vm.owner;
    wx.setClipboardData({
      data: o.name + " " + o.phone + " 微信：" + o.wechat,
      success: () => {
        wx.showToast({ title: t(app.globalData.lang, "saveTip"), icon: "none" });
        app.track("module", "intro", "保存名片");
      },
    });
  },

  openCase(e) {
    const item = this.data.vm.cases[e.currentTarget.dataset.index];
    if (!item) return;
    wx.showModal({
      title: item.title,
      content: item.metric + " " + item.metricLabel + "\n" + item.desc,
      showCancel: false,
      confirmText: "知道了",
    });
    app.track("module", "case", "查看案例 · " + item.title);
  },

  openVideo() {
    wx.showToast({ title: t(app.globalData.lang, "videoTip"), icon: "none" });
    app.track("module", "video", "点击企业视频");
  },

  openMenu(e) {
    const item = this.data.vm.menu[e.currentTarget.dataset.index];
    if (!item) return;
    if (item.url.indexOf("#miniapp") === 0) {
      wx.showToast({ title: t(app.globalData.lang, "miniTip"), icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: item.url,
      success: () => {
        wx.showToast({ title: t(app.globalData.lang, "menuTip"), icon: "none" });
      },
    });
    app.track("module", "home", "打开自定义菜单 · " + item.label);
  },

  backTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 260 });
  },

  scrollToContent() {
    wx.pageScrollTo({ selector: "#contentTabs", duration: 260 });
  },

  onShareAppMessage() {
    const data = app.globalData.data;
    if (!data) return { title: "晒名片", path: "/pages/index/index" };
    const c = data.card;
    const en = app.globalData.lang === "en";
    app.track("module", "home", "小程序分享");
    return {
      title: (en ? c.owner.nameEn : c.owner.name) + " · " + (en ? c.owner.titleEn : c.owner.title),
      path: "/pages/index/index",
    };
  },

  onShareTimeline() {
    const data = app.globalData.data;
    if (!data) return { title: "晒名片" };
    const c = data.card;
    return { title: c.owner.name + " · " + c.owner.title };
  },
});
