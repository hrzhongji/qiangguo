const { BASE_URL } = require("./config");

function request(path, method = "GET", data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method,
      data,
      header: { "content-type": "application/json" },
      timeout: 15000,
      success(res) {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data);
        } else {
          reject(new Error(body.msg || "请求失败"));
        }
      },
      fail() {
        reject(new Error("网络异常，请稍后重试"));
      },
    });
  });
}

module.exports = { request, BASE_URL };
