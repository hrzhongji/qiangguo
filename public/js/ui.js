(function () {
  const PATHS = {
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
    pulse: '<path d="M3 12h4l2.2-6 4.1 12L16 12h5"/>',
    nfc: '<path d="M6 8.5a8 8 0 010 7"/><path d="M9.5 6.5a12 12 0 010 11"/><rect x="14" y="9" width="7" height="6" rx="1.6"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.4-3 7.7-7 9.5-4-1.8-7-5.1-7-9.5V6l7-3z"/><path d="M9.2 12l2 2 3.6-3.8"/>',
    arrow: '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.4 10.8l7.2-4.4M8.4 13.2l7.2 4.4"/>',
    chat: '<path d="M20 11.5a7.5 7.5 0 01-10.9 6.7L4 20l1.8-5A7.5 7.5 0 1120 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    cart: '<path d="M3 4h2.2l2.4 11.2a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="17.5" cy="20" r="1.2"/>',
    globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.6 12h16.8M12 3.4c2.4 2.5 3.6 5.4 3.6 8.6S14.4 18.1 12 20.6C9.6 18.1 8.4 15.2 8.4 12S9.6 5.9 12 3.4z"/>',
    book: '<path d="M5 4.5h5.5A2.5 2.5 0 0113 7v13a2 2 0 00-2-2H5V4.5z"/><path d="M19 4.5h-5.5A2.5 2.5 0 0011 7v13a2 2 0 012-2h6V4.5z"/>',
    wechat: '<path d="M9.2 4C5.4 4 2.5 6.6 2.5 9.8c0 1.8 1 3.4 2.6 4.4l-.7 2.2 2.5-1.3c.8.2 1.5.3 2.3.3"/><path d="M21.5 13.6c0-2.7-2.5-4.9-5.6-4.9s-5.6 2.2-5.6 4.9 2.5 4.9 5.6 4.9c.7 0 1.4-.1 2-.3l2.2 1.1-.6-2c1.2-.9 2-2.3 2-3.7z"/>',
    message: '<path d="M4 5.5h16v11H9l-5 3.5v-14.5z"/><path d="M8 9.5h8M8 12.5h5"/>',
    save: '<path d="M12 3.5v11M8 11l4 3.5 4-3.5"/><path d="M4.5 17.5v1.2A1.8 1.8 0 006.3 20.5h11.4a1.8 1.8 0 001.8-1.8v-1.2"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    send: '<path d="M21 3L10.5 13.5"/><path d="M21 3l-6.5 18-4-8-8-4L21 3z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
    phone: '<path d="M7 3.5H5.6A2.1 2.1 0 003.5 5.7C3.5 13.8 10.2 20.5 18.3 20.5a2.1 2.1 0 002.2-2.1v-1.4l-4-1.6-1.9 2a13.3 13.3 0 01-5.9-5.9l2-1.9L7 3.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    location: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-3a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h3"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5"/><path d="M16 5.2a3.2 3.2 0 010 5.9M17.5 14.8c2.1.6 3.5 2.3 3.5 4.4"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M7.5 16l3.5-5 3 3 4-6"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 9h18"/><circle cx="16.5" cy="14" r="1.2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    logout: '<path d="M9 4H5.5A1.5 1.5 0 004 5.5v13A1.5 1.5 0 005.5 20H9"/><path d="M15 8l4 4-4 4M19 12H9"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    file: '<path d="M6 3.5h8l4 4V20a.5.5 0 01-.5.5h-11A.5.5 0 016 20V3.5z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
    star: '<path d="M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9L12 3.5z"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>',
    bolt: '<path d="M13.5 3L5 13.5h6L10.5 21 19 10.5h-6L13.5 3z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    play: '<path d="M8 5.5l10 6.5-10 6.5v-13z"/>',
    qr: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 14.5h2v2h-2zM18.5 14.5h2M14.5 18.5v2M18.5 18.5h2v2h-2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>',
    reset: '<path d="M4 4v5h5"/><path d="M4.6 9a8 8 0 113 9"/>',
    bell: '<path d="M6 16v-5a6 6 0 1112 0v5l1.5 2.5h-15L6 16z"/><path d="M10 20.5a2.2 2.2 0 004 0"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    fire: '<path d="M12 21c4 0 6.5-2.6 6.5-6.2 0-4.6-4.6-6.4-4.4-11.8-2.8 1.2-4.4 3.6-4.4 6.1 0 1.3.4 2.2.9 3-1.1-.2-2-1.1-2.4-2.2-1.3 1.4-2.7 3.2-2.7 5.4C5.5 18.6 8 21 12 21z"/>',
    signal: '<path d="M4 18v-2M8.5 18v-5M13 18v-8M17.5 18V6"/>',
    wifi: '<path d="M3 8.5a14 14 0 0118 0M6 12a9.5 9.5 0 0112 0M9.2 15.4a5 5 0 015.6 0"/><circle cx="12" cy="19" r="1"/>',
    battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3"/><rect x="4.5" y="9" width="12" height="6" rx="1" fill="currentColor" stroke="none"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 10-5.7-5.7l-1.4 1.4"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 105.7 5.7l1.4-1.4"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7M3 12h18"/>',
    robot: '<rect x="4" y="7" width="16" height="12" rx="3.5"/><path d="M12 3v4M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3" r="1"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    upload: '<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4.5 16v2.5A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5V16"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    slash: '<circle cx="12" cy="12" r="8.5"/><path d="M6 18L18 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10"/>',
    download: '<path d="M12 4v12M8 12l4 4 4-4"/><path d="M4.5 18.5V20h15v-1.5"/>',
    timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M9 2.5h6"/>',
  };

  function svg(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || PATHS.spark}</svg>`;
  }

  const UI = {
    icons: PATHS,
    icon(name) {
      return `<i data-icon="${name}">${svg(name)}</i>`;
    },
    iconify(root) {
      (root || document).querySelectorAll("i[data-icon]").forEach((el) => {
        if (!el.firstElementChild) el.innerHTML = svg(el.getAttribute("data-icon"));
      });
    },
    esc(str) {
      return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },
    num(n) {
      return Number(n || 0).toLocaleString("en-US");
    },
    timeAgo(ts, lang = "zh") {
      const diff = Math.max(0, Date.now() - Number(ts || 0));
      const min = Math.floor(diff / 60000);
      if (min < 1) return lang === "en" ? "just now" : "刚刚";
      if (min < 60) return lang === "en" ? `${min}m ago` : `${min} 分钟前`;
      const h = Math.floor(min / 60);
      if (h < 24) return lang === "en" ? `${h}h ago` : `${h} 小时前`;
      const d = Math.floor(h / 24);
      return lang === "en" ? `${d}d ago` : `${d} 天前`;
    },
    clock(ts) {
      return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ts || Date.now()));
    },
    dateLabel(ts) {
      return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric", weekday: "short" }).format(new Date(ts || Date.now()));
    },
    async sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    },
    toast(msg, iconName = "check") {
      const root = document.getElementById("toastRoot");
      const el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = `${UI.icon(iconName)}<span>${UI.esc(msg)}</span>`;
      root.appendChild(el);
      setTimeout(() => {
        el.classList.add("out");
        setTimeout(() => el.remove(), 260);
      }, 2600);
    },
    async copy(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      }
    },
    async post(url, body) {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.msg || "request failed");
      return data.data;
    },
    async put(url, body) {
      const res = await fetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.msg || "request failed");
      return data.data;
    },
    async getJSON(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      return data.data;
    },
    sheet(html, opts = {}) {
      const root = document.getElementById("layerRoot");
      const backdrop = document.createElement("div");
      backdrop.className = "sheet-backdrop" + (opts.global ? " global" : "");
      backdrop.innerHTML = `<div class="sheet">${opts.noGrab ? "" : '<div class="sheet-grab"></div>'}${html}</div>`;
      root.appendChild(backdrop);
      const close = () => {
        backdrop.style.animation = "fadeIn .18s ease reverse forwards";
        setTimeout(() => backdrop.remove(), 170);
        document.removeEventListener("keydown", onKey);
      };
      const onKey = (e) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", onKey);
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close();
      });
      backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
      UI.iconify(backdrop);
      return { el: backdrop, close, body: backdrop.querySelector(".sheet") };
    },
    downloadBlob(blob, filename) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
    },
    vCard(data) {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${data.name}`,
        `ORG:${data.company}`,
        `TITLE:${data.title}`,
        `TEL;TYPE=CELL:${data.phone || ""}`,
        `EMAIL:${data.email || ""}`,
        `URL:${data.url || ""}`,
        `NOTE:${data.note || ""}`,
        "END:VCARD",
      ];
      return lines.join("\r\n");
    },
  };

  window.UI = UI;
  document.addEventListener("DOMContentLoaded", () => UI.iconify(document));
})();
