(function () {
  const LS_VISITOR = "shinecard_visitor";
  const LS_SEEN = "shinecard_seen";

  const App = {
    lang: "zh",
    data: null,
    profile: "manufacturing",
    visitorId: localStorage.getItem(LS_VISITOR) || "v_" + Math.random().toString(36).slice(2, 9),
    route: "home",
    adminSection: "overview",
    trackedTabs: {},

    t(key) {
      return window.T(key, App.lang);
    },

    async init() {
      localStorage.setItem(LS_VISITOR, App.visitorId);
      App.bindRail();
      App.updateClock();
      setInterval(App.updateClock, 30000);
      await App.load();
      Card.render();
      App.bindHash();
    },

    async load() {
      try {
        const data = await UI.getJSON("/api/bootstrap");
        App.data = data;
        const seen = sessionStorage.getItem(LS_SEEN);
        if (seen) {
          App.track("return", "home", "再次访问名片");
        } else {
          sessionStorage.setItem(LS_SEEN, "1");
          App.track("view", "home", "打开名片");
        }
        const railQr = document.getElementById("railQr");
        if (railQr && data.card.qrUrl) railQr.src = data.card.qrUrl;
      } catch (err) {
        console.error(err);
        UI.toast("数据加载失败，请刷新重试");
      }
    },

    track(type, module, label, duration = 0, extra = {}) {
      if (!App.visitorId) return;
      return UI.post("/api/track", {
        visitorId: App.visitorId,
        type,
        module,
        label,
        duration,
        profile: App.profile,
        ...extra,
      }).catch(() => null);
    },

    setLang(lang) {
      App.lang = lang;
      Card.render();
      UI.toast(lang === "en" ? "Switched to English" : "已切换为中文", "globe");
    },

    setProfile(profile) {
      App.profile = profile;
      document.querySelectorAll("#profileSwitch button").forEach((b) => {
        b.classList.toggle("active", b.dataset.profile === profile);
      });
      const hint = document.getElementById("profileHint");
      if (hint) {
        hint.textContent =
          profile === "manufacturing"
            ? "首页将优先置顶「苏州降本 23%」案例"
            : profile === "overseas"
            ? "自动切换英文内容，商店开启跨境支付"
            : "优先展示公司概况、团队与投资价值";
      }
      if (profile === "overseas") App.lang = "en";
      if (profile === "manufacturing") App.lang = "zh";
      Card.render();
      App.track("module", profile === "overseas" ? "overseas" : profile === "investor" ? "intro" : "case", "切换访客画像 · " + profile);
    },

    bindRail() {
      const switchEl = document.getElementById("profileSwitch");
      switchEl?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-profile]");
        if (btn) App.setProfile(btn.dataset.profile);
      });
      document.getElementById("enterConsole")?.addEventListener("click", () => {
        location.hash = "#/admin/overview";
      });
    },

    updateClock() {
      const el = document.getElementById("clock");
      if (!el) return;
      const now = new Date();
      el.textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    },

    bindHash() {
      window.addEventListener("hashchange", App.onHash);
      App.onHash();
    },

    onHash() {
      const hash = location.hash || "#/";
      if (hash.startsWith("#/admin")) {
        App.adminSection = hash.split("/")[2] || "overview";
        document.getElementById("cardShell").classList.add("hidden");
        document.getElementById("consoleShell").classList.remove("hidden");
        Admin.render(App.adminSection);
      } else {
        document.getElementById("consoleShell").classList.add("hidden");
        document.getElementById("cardShell").classList.remove("hidden");
        if (Admin.closeStream) Admin.closeStream();
        Card.render();
      }
    },

    toCard() {
      location.hash = "#/";
    },
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
