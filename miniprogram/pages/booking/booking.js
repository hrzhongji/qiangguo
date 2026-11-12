const app = getApp();
const { request } = require("../../utils/api");
const { t } = require("../../utils/i18n");

Page({
  data: {
    vm: {},
    days: [],
    dateIndex: 0,
    time: "",
    modeIndex: 0,
    modes: [],
    name: "",
    phone: "",
    company: "",
    loading: false,
    done: false,
    result: null,
  },

  async onLoad() {
    const lang = app.globalData.lang;
    this.setData({
      vm: {
        title: t(lang, "bookingTitle"),
        tip: t(lang, "bookTip"),
        selectDate: t(lang, "selectDate"),
        selectTime: t(lang, "selectTime"),
        mode: t(lang, "mode"),
        name: t(lang, "labelName"),
        phone: t(lang, "labelPhone"),
        company: t(lang, "labelCompany"),
        confirm: t(lang, "confirmBook"),
        success: t(lang, "bookSuccess"),
        done: t(lang, "bookDone"),
        back: t(lang, "backHome"),
        required: t(lang, "requiredTip"),
        noSlot: t(lang, "noSlot"),
      },
      modes: [t(lang, "modeOnline"), t(lang, "modeOnsite")],
    });
    try {
      const days = await request("/api/slots");
      this.setData({ days });
      app.track("module", "booking", "打开预约");
    } catch (err) {
      wx.showToast({ title: err.message || "加载失败", icon: "none" });
    }
  },

  selectDate(e) {
    this.setData({ dateIndex: Number(e.currentTarget.dataset.index), time: "" });
  },

  selectSlot(e) {
    const { time, taken } = e.currentTarget.dataset;
    if (taken) {
      wx.showToast({ title: this.data.vm.noSlot, icon: "none" });
      return;
    }
    this.setData({ time });
  },

  selectMode(e) {
    this.setData({ modeIndex: Number(e.currentTarget.dataset.index) });
  },

  onField(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  async onSubmit() {
    const { days, dateIndex, time, modes, modeIndex, name, phone, company } = this.data;
    if (!time) {
      wx.showToast({ title: this.data.vm.selectTime, icon: "none" });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      wx.showToast({ title: this.data.vm.required, icon: "none" });
      return;
    }
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const result = await request("/api/appointments", "POST", {
        visitorId: app.globalData.visitorId,
        name: name.trim(),
        phone: phone.trim(),
        company: company.trim(),
        date: days[dateIndex].date,
        slot: time,
        mode: modes[modeIndex],
      });
      this.setData({ loading: false, done: true, result });
      app.track("book", "booking", "小程序预约");
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || "预约失败", icon: "none" });
    }
  },

  backHome() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
  },
});
