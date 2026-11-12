const { request } = require("./utils/api");

App({
  globalData: {
    visitorId: "",
    lang: "zh",
    data: null,
  },

  onLaunch() {
    let visitorId = wx.getStorageSync("shinecard_visitor");
    if (!visitorId) {
      visitorId = "wx_" + Math.random().toString(36).slice(2, 10);
      wx.setStorageSync("shinecard_visitor", visitorId);
    }
    this.globalData.visitorId = visitorId;
  },

  track(type, module, label, duration = 0) {
    return request("/api/track", "POST", {
      visitorId: this.globalData.visitorId,
      type,
      module,
      label,
      duration,
      profile: "manufacturing",
    }).catch(() => null);
  },

  async loadCard(force) {
    if (this.globalData.data && !force) return this.globalData.data;
    const data = await request("/api/bootstrap");
    this.globalData.data = data;
    return data;
  },
});
