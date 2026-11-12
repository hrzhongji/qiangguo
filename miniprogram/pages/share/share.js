const app = getApp();
const { BASE_URL } = require("../../utils/api");
const { t } = require("../../utils/i18n");

Page({
  data: {
    vm: {},
    qr: "",
    link: "",
  },

  onLoad() {
    const lang = app.globalData.lang;
    const link = BASE_URL + "/";
    this.setData({
      link,
      qr: BASE_URL + "/api/qr?text=" + encodeURIComponent(link),
      vm: {
        title: t(lang, "shareTitle"),
        scanTip: t(lang, "scanTip"),
        nfcTip: t(lang, "nfcTip"),
        copy: t(lang, "copyLink"),
        copied: t(lang, "copied"),
        saveQr: lang === "en" ? "Save QR" : "保存到相册",
      },
    });
    app.track("module", "home", "打开分享页");
  },

  copyLink() {
    wx.setClipboardData({
      data: this.data.link,
      success: () => wx.showToast({ title: this.data.vm.copied, icon: "none" }),
    });
  },

  saveQr() {
    wx.showLoading({ title: "…" });
    wx.downloadFile({
      url: this.data.qr,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading();
            wx.showToast({ title: "已保存", icon: "success" });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "请允许保存到相册", icon: "none" });
          },
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "下载失败，请长按二维码保存", icon: "none" });
      },
    });
  },

  onShareAppMessage() {
    return { title: "扫码看我的电子名片", path: "/pages/index/index" };
  },
});
