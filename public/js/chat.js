(function () {
  const Chat = {
    root: null,
    messages: [],
    voiceOn: false,
    sending: false,
    lastSuggestions: [],
    openedAt: 0,

    t(key) {
      return window.T(key, App.lang);
    },

    raw(text) {
      return UI.esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
    },

    open(opts = {}) {
      if (this.root) return;
      const t = this.t.bind(this);
      const persona = App.data.persona;
      const hour = App.data.server.hour;
      const root = document.createElement("div");
      root.className = "chat-screen";
      root.innerHTML = `
        <div class="chat-head">
          <button class="chat-back" data-close aria-label="back">${UI.icon("back")}</button>
          <div class="chat-avatar">${UI.esc(App.data.card.owner.avatarText || "沈")}</div>
          <div class="chat-id">
            <b>${UI.esc(App.lang === "en" ? "Zhiyuan · Digital Twin" : persona.name)}</b>
            <span>${t("chatStatus")} · ${persona.knowledgeCount} 篇知识库</span>
          </div>
          <button class="chat-voice-btn ${this.voiceOn ? "on" : ""}" data-voice>${UI.icon("mic")} ${t("chatVoice")}</button>
        </div>
        <div class="chat-body" id="chatBody">
          <div class="chat-day">${UI.dateLabel()} · ${App.lang === "en" ? "Shanghai time" : "上海时间"} ${UI.clock()}</div>
        </div>
        <div class="chat-suggestions" id="chatSugs"></div>
        <div id="captureSlot"></div>
        <div class="chat-input">
          <div class="chat-input-inner">
            <input id="chatInput" placeholder="${t("chatPlaceholder")}" autocomplete="off" />
            <button class="voice" data-speak aria-label="voice">${UI.icon("mic")}</button>
            <button class="send" data-send aria-label="send">${UI.icon("send")}</button>
          </div>
          <div class="chat-disclaimer">${t("chatDisclaimer")}</div>
        </div>
      `;
      document.getElementById("screenRoot").appendChild(root);
      this.root = root;
      UI.iconify(root);
      this.openedAt = Date.now();
      App.track("module", "ai", "打开 AI 数字分身");

      const greeting = App.lang === "en" ? persona.greeting.en : persona.greeting.zh;
      this.pushAssistant(greeting, true);
      this.messages = [{ role: "assistant", content: greeting }];
      this.lastSuggestions = [
        t("suggestPrice"),
        t("suggestCase"),
        t("suggestBook"),
      ];
      this.renderSuggestions();

      root.querySelector("[data-close]").addEventListener("click", () => this.close());
      root.querySelector("[data-send]").addEventListener("click", () => this.send());
      root.querySelector("#chatInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.send();
      });
      root.querySelector("[data-voice]").addEventListener("click", (e) => {
        this.voiceOn = !this.voiceOn;
        e.currentTarget.classList.toggle("on", this.voiceOn);
        if (this.voiceOn) UI.toast(App.lang === "en" ? "Cloned voice enabled" : "已开启知远声线", "mic");
      });
      root.querySelector("[data-speak]").addEventListener("click", () => {
        const last = [...this.messages].reverse().find((m) => m.role === "assistant");
        if (last) this.speak(last.content);
      });
      this.scrollBottom();
      if (opts.prefill) {
        const input = root.querySelector("#chatInput");
        input.value = opts.prefill;
        setTimeout(() => this.send(), 380);
      }
      document.addEventListener("keydown", this.escHandler = (e) => {
        if (e.key === "Escape") this.close();
      });
    },

    close() {
      if (!this.root) return;
      const seconds = Math.round((Date.now() - this.openedAt) / 1000);
      App.track("dwell", "ai", "与 AI 分身对话", Math.min(seconds, 300));
      try { window.speechSynthesis.cancel(); } catch (e) {}
      this.root.remove();
      this.root = null;
      this.messages = [];
      this.sending = false;
      document.removeEventListener("keydown", this.escHandler);
    },

    pushAssistant(text, skipAnimation) {
      const body = this.root?.querySelector("#chatBody");
      if (!body) return;
      const el = document.createElement("div");
      el.className = "msg";
      el.innerHTML = `<div class="mini-avatar">${UI.esc(App.data.card.owner.avatarText || "沈")}</div><div class="bubble">${this.raw(text)}</div>`;
      body.appendChild(el);
      if (!skipAnimation) el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 260, easing: "ease-out" });
      this.scrollBottom();
    },

    pushUser(text) {
      const body = this.root?.querySelector("#chatBody");
      if (!body) return;
      const el = document.createElement("div");
      el.className = "msg user";
      el.innerHTML = `<div class="bubble">${UI.esc(text)}</div>`;
      body.appendChild(el);
      this.scrollBottom();
    },

    pushMeta(text) {
      const body = this.root?.querySelector("#chatBody");
      if (!body) return;
      const el = document.createElement("div");
      el.className = "chat-sources";
      el.innerHTML = `${UI.icon("file")}<span>${UI.esc(text)}</span>`;
      body.appendChild(el);
      UI.iconify(el);
      this.scrollBottom();
    },

    showTyping() {
      const body = this.root?.querySelector("#chatBody");
      if (!body) return null;
      const el = document.createElement("div");
      el.className = "msg";
      el.id = "typingRow";
      el.innerHTML = `<div class="mini-avatar">${UI.esc(App.data.card.owner.avatarText || "沈")}</div><div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
      body.appendChild(el);
      this.scrollBottom();
      return el;
    },

    renderSuggestions() {
      const box = this.root?.querySelector("#chatSugs");
      if (!box) return;
      const list = (this.lastSuggestions || []).slice(0, 3);
      box.innerHTML = list.map((s) => `<button class="chip" data-sug="${UI.esc(s)}">${UI.esc(s)}</button>`).join("");
      box.querySelectorAll("[data-sug]").forEach((b) => b.addEventListener("click", () => {
        const input = this.root.querySelector("#chatInput");
        input.value = b.dataset.sug;
        this.send();
      }));
    },

    async send() {
      if (this.sending || !this.root) return;
      const input = this.root.querySelector("#chatInput");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      this.sending = true;
      this.pushUser(text);
      this.messages.push({ role: "user", content: text });
      this.lastSuggestions = [];
      this.renderSuggestions();
      const typing = this.showTyping();
      const started = Date.now();

      try {
        const data = await UI.post("/api/ai/chat", {
          visitorId: App.visitorId,
          lang: App.lang,
          messages: this.messages,
        });
        const elapsed = Date.now() - started;
        if (elapsed < 650) await UI.sleep(650 - elapsed);
        typing?.remove();
        this.pushAssistant(data.reply);
        this.messages.push({ role: "assistant", content: data.reply });
        if (data.sources?.length) this.pushMeta((App.lang === "en" ? "Sources: " : "知识库来源：") + data.sources.join(" · "));
        this.lastSuggestions = data.suggestions || [];
        this.renderSuggestions();

        if (this.voiceOn) this.speak(data.reply);

        if (data.intent && data.intent.level === "A") {
          this.showIntent(data.intent);
        }
        if (data.capture) this.showCapture();
        if (data.profile && data.profile !== App.profile) {
          App.profile = data.profile;
          document.querySelectorAll("#profileSwitch button").forEach((b) => b.classList.toggle("active", b.dataset.profile === data.profile));
          document.getElementById("profileHint") && (document.getElementById("profileHint").textContent =
            data.profile === "overseas" ? "已根据对话切换为海外访客视角" : "已根据对话识别为制造业访客");
        }
      } catch (err) {
        typing?.remove();
        this.pushAssistant(App.lang === "en" ? "Connection hiccup — could you send that again?" : "网络有点抖，能再发一次吗？");
      } finally {
        this.sending = false;
        this.scrollBottom();
      }
    },

    showIntent(intent) {
      const body = this.root?.querySelector("#chatBody");
      if (!body || body.querySelector(".intent-flag")) return;
      const el = document.createElement("div");
      el.className = "chat-capture intent-flag";
      el.style.background = "linear-gradient(120deg,#eaf4ef,#f6fbf8)";
      el.style.borderColor = "rgba(46,125,91,.28)";
      el.innerHTML = `<b>${UI.icon("bell")} ${this.t("aiAlert")}</b><p>${App.lang === "en" ? "Zhiyuan has received a real-time alert and will follow up personally." : "已实时推送到沈知远的企业后台，他会亲自跟进这条线索。"}</p>`;
      body.appendChild(el);
      UI.iconify(el);
      this.scrollBottom();
    },

    showCapture() {
      const slot = this.root?.querySelector("#captureSlot");
      if (!slot || slot.dataset.shown) return;
      slot.dataset.shown = "1";
      slot.innerHTML = `
        <div class="chat-capture">
          <b>${this.t("captureTitle")}</b>
          <p>${this.t("captureSub")}</p>
          <div class="row">
            <input id="capName" placeholder="${this.t("leadName")}" />
            <input id="capPhone" placeholder="${this.t("leadPhone")}" />
            <button id="capSend">${this.t("captureBtn")}</button>
          </div>
        </div>`;
      slot.querySelector("#capSend").addEventListener("click", async () => {
        const name = slot.querySelector("#capName").value.trim();
        const phone = slot.querySelector("#capPhone").value.trim();
        if (!name || !phone) return UI.toast(this.t("leadPhone"), "message");
        try {
          await UI.post("/api/leads", {
            visitorId: App.visitorId,
            name,
            company: "",
            phone,
            need: App.lang === "en" ? "From AI chat" : "来自 AI 分身对话",
            lang: App.lang,
          });
          slot.innerHTML = `<div class="chat-capture" style="text-align:center"><b>${this.t("leadSuccessTitle")}</b><p>${this.t("leadSuccessSub")}</p></div>`;
          UI.iconify(slot);
          UI.toast(this.t("leadSuccessTitle"), "check");
        } catch (err) {
          UI.toast(err.message || this.t("error"));
        }
      });
    },

    speak(text) {
      if (!("speechSynthesis" in window)) {
        UI.toast(this.t("voiceUnsupported"));
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const clean = text.replace(/\*\*/g, "").replace(/[#*]/g, "");
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = App.lang === "en" ? "en-US" : "zh-CN";
        u.rate = 1.02;
        u.pitch = 0.92;
        const voices = window.speechSynthesis.getVoices();
        const zh = voices.find((v) => /zh|Chinese|Mandarin/i.test(v.lang) && /(Yun|Xiao|Ting|Mei|Sinji|Google)/i.test(v.name)) || voices.find((v) => /zh/i.test(v.lang));
        if (App.lang !== "en" && zh) u.voice = zh;
        window.speechSynthesis.speak(u);
        UI.toast(this.t("voicePlaying"), "mic");
      } catch (e) {
        UI.toast(this.t("voiceUnsupported"));
      }
    },

    scrollBottom() {
      const body = this.root?.querySelector("#chatBody");
      if (body) body.scrollTop = body.scrollHeight;
    },
  };

  window.Chat = Chat;
})();
