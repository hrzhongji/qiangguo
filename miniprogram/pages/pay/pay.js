const app = getApp();
const { request } = require("../../utils/api");
const { t } = require("../../utils/i18n");

Page({
  data: {
    vm: {},
    products: [],
    selectedIndex: 0,
    channels: [],
    channelIndex: 0,
    name: "",
    phone: "",
    loading: false,
    done: false,
    result: null,
  },

  async onLoad(query) {
    const lang = app.globalData.lang;
    this.lang = lang;
    this.setData({
      vm: {
        title: t(lang, "payTitle"),
        tip: t(lang, "payTip"),
        selectProduct: t(lang, "selectProduct"),
        channel: t(lang, "channel"),
        amount: t(lang, "amount"),
        payNow: t(lang, "payNow"),
        success: t(lang, "paySuccess"),
        orderId: t(lang, "orderId"),
        back: t(lang, "backHome"),
        required: t(lang, "requiredTip"),
        productRequired: t(lang, "productRequired"),
        name: t(lang, "labelName"),
        phone: t(lang, "labelPhone"),
      },
      channels: [t(lang, "wechatPay"), t(lang, "alipay"), t(lang, "crossPay")],
    });

    try {
      const data = await app.loadCard();
      const products = data.card.content.products.map((p) => ({
        id: p.id,
        name: lang === "en" ? p.nameEn : p.name,
        desc: lang === "en" ? p.descEn : p.desc,
        price: lang === "en" ? p.priceEn : p.price,
        amount: Number(String(p.price).replace(/[^\d.]/g, "")) || 0,
      }));
      let selectedIndex = 0;
      if (query && query.productId) {
        const idx = products.findIndex((p) => p.id === query.productId);
        if (idx > -1) selectedIndex = idx;
      }
      this.setData({ products, selectedIndex });
      app.track("module", "shop", "打开方案商店");
    } catch (err) {
      wx.showToast({ title: err.message || "加载失败", icon: "none" });
    }
  },

  selectProduct(e) {
    this.setData({ selectedIndex: Number(e.currentTarget.dataset.index) });
  },

  selectChannel(e) {
    this.setData({ channelIndex: Number(e.currentTarget.dataset.index) });
  },

  onField(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  async onSubmit() {
    const { products, selectedIndex, channels, channelIndex, name, phone } = this.data;
    if (!products.length) {
      wx.showToast({ title: this.data.vm.productRequired, icon: "none" });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      wx.showToast({ title: this.data.vm.required, icon: "none" });
      return;
    }
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const result = await request("/api/orders", "POST", {
        visitorId: app.globalData.visitorId,
        name: name.trim(),
        phone: phone.trim(),
        productId: products[selectedIndex].id,
        channel: channels[channelIndex],
      });
      this.setData({ loading: false, done: true, result });
      app.track("order", "shop", "小程序下单");
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || "支付失败", icon: "none" });
    }
  },

  backHome() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
  },
});
