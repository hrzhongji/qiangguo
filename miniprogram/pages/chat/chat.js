const app = getApp();
const { request } = require("../../utils/api");
const { t } = require("../../utils/i18n");

function parse(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false });
  return parts.length ? parts : [{ text, bold: false }];
}

function defaultChips(lang) {
  return lang === "en"
    ? ["What is the budget?", "Any manufacturing case?", "How do I book a call?"]
    : ["报价大概多少？", "有制造业案例吗？", "怎么预约诊断？"];
}

Page({
  data: {
    vm: {},
    messages: [],
    chips: [],
    input: "",
    sending: false,
    capture: false,
    intoView: "",
  },

  async onLoad() {
    const lang = app.globalData.lang;
    this.history = [];
    this.lang = lang;
    this.setData({
      vm: {
        title: lang === "en" ? "AI Digital Twin" : "AI 数字分身",
        hint: t(lang, "chatHint"),
        leadTip: t(lang, "leadTip"),
        placeholder: t(lang, "inputPlaceholder"),
        send: t(lang, "send"),
      },
      chips: defaultChips(lang),
    });
    try {
      const data = await app.loadCard();
      const greeting = data.persona.greeting[lang] || data.persona.greeting.zh;
      this.setData({
        messages: [{ id: "m0", role: "ai", parts: parse(greeting), sources: [] }],
      });
    } catch (err) {
      wx.showToast({ title: err.message || "加载失败", icon: "none" });
    }
    app.track("module", "ai", "打开 AI 分身");
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  sendChip(e) {
    this.sendText(e.currentTarget.dataset.text);
  },

  onSend() {
    this.sendText(this.data.input);
  },

  async sendText(raw) {
    const text = String(raw || "").trim();
    if (!text || this.data.sending) return;
    const messages = this.data.messages.concat({
      id: "u" + Date.now(),
      role: "me",
      parts: parse(text),
      sources: [],
    });
    this.history.push({ role: "user", content: text });
    this.setData({ messages, input: "", sending: true, chips: [], intoView: "" });

    try {
      const data = await request("/api/ai/chat", "POST", {
        visitorId: app.globalData.visitorId,
        lang: this.lang,
        messages: this.history,
      });
      this.history.push({ role: "assistant", content: data.reply });
      const aiMsg = {
        id: "a" + Date.now(),
        role: "ai",
        parts: parse(data.reply),
        sources: (data.sources || []).slice(0, 2),
      };
      this.setData({
        messages: messages.concat(aiMsg),
        sending: false,
        chips: data.suggestions || [],
        capture: this.data.capture || !!data.capture,
        intoView: "bottom",
      });
    } catch (err) {
      this.setData({
        messages: messages.concat({
          id: "e" + Date.now(),
          role: "ai",
          parts: [{ text: err.message || "网络异常，请稍后再试", bold: false }],
          sources: [],
        }),
        sending: false,
      });
    }
  },

  goLead() {
    wx.navigateTo({ url: "/pages/lead/lead" });
  },

  onShareAppMessage() {
    return { title: "24 小时在线的 AI 数字分身", path: "/pages/index/index" };
  },
});
