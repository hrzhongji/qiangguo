const app = getApp();
const { request } = require("../../utils/api");
const { t } = require("../../utils/i18n");

Page({
  data: {
    vm: {},
    name: "",
    phone: "",
    company: "",
    need: "",
    done: false,
    loading: false,
    result: null,
  },

  onLoad() {
    const lang = app.globalData.lang;
    this.setData({
      vm: {
        title: t(lang, "leadTitle"),
        tip: t(lang, "leadTip"),
        name: t(lang, "labelName"),
        phone: t(lang, "labelPhone"),
        company: t(lang, "labelCompany"),
        need: t(lang, "labelNeed"),
        submit: t(lang, "submit"),
        back: t(lang, "backHome"),
        success: t(lang, "leadSuccess"),
        required: t(lang, "requiredTip"),
      },
    });
  },

  onField(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  async onSubmit() {
    const { name, phone, company, need } = this.data;
    if (!name.trim() || !phone.trim()) {
      wx.showToast({ title: this.data.vm.required, icon: "none" });
      return;
    }
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await request("/api/leads", "POST", {
        visitorId: app.globalData.visitorId,
        name: name.trim(),
        phone: phone.trim(),
        company: company.trim(),
        need: need.trim(),
        lang: app.globalData.lang,
      });
      this.setData({ loading: false, done: true, result: res });
      app.track("lead", "lead", "小程序留资");
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || "提交失败", icon: "none" });
    }
  },

  backHome() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
  },
});
