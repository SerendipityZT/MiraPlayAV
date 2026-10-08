globalThis.websiteBundle = function() {
  return `(function() {
    const exports = {};
    const module = { exports };

const http = require("http");
const https = require("https");
const { URL } = require("url");
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const SITES = [
  { key: "souav", name: "搜AV", api: "https://api.souavzy.vip/api.php/provide/vod/" },
  { key: "fh", name: "番号", api: "http://fhapi9.com/api.php/provide/vod/" },
  { key: "jkun", name: "鸡坤", api: "https://jkunzyapi.com/api.php/provide/vod/" },
  { key: "yutu", name: "玉兔", api: "https://apiyutu.com/api.php/provide/vod/" },
  { key: "lajiao", name: "辣椒", api: "http://lajiaozy.com/api.php/provide/vod/" },
  { key: "aosi", name: "奥斯卡", api: "https://aosikazy4.com/api.php/provide/vod/" },
  { key: "th", name: "桃花", api: "https://thzy1.me/api.php/provide/vod/" },
  { key: "danaizi", name: "大奶子", api: "https://apidanaizi.com/api.php/provide/vod/" },
  { key: "lsb", name: "老色批", api: "https://apilsbzy1.com/api.php/provide/vod/" },
  { key: "xingba", name: "杏吧", api: "https://xingba111.com/api.php/provide/vod/" },
  { key: "api155", name: "155", api: "https://155api.com/api.php/provide/vod/" },
  { key: "jingpin", name: "精品X", api: "https://www.jingpinx.com/api.php/provide/vod/" },
  { key: "doudou", name: "豆豆", api: "https://doudouzy.com/api.php/provide/vod/" },
  { key: "hsck", name: "黄色仓库", api: "https://hsckzy888.com/api.php/provide/vod/from/hsckm3u8/at/json/" },
  { key: "didi", name: "滴滴", api: "https://api.ddapi.cc/api.php/provide/vod/" },
  { key: "ck", name: "CK伦理", api: "https://ckzy.me/api.php/provide/vod/" },
  { key: "vn", name: "越南", api: "https://vnzyz.com/api.php/provide/vod/" }
];
const siteMap = Object.fromEntries(SITES.map((s) => [s.key, s]));
let server = null;
function fetchJson(rawUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(rawUrl);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method: "GET",
      headers: { "User-Agent": UA, Accept: "application/json,text/plain,*/*" },
      timeout: 15000,
      rejectUnauthorized: false
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch (e) { reject(e); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}
function apiUrl(site, params) {
  const u = new URL(site.api);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v)); });
  return u.toString();
}
function card(siteKey, vod) {
  return { vod_id: siteKey + "|" + vod.vod_id, vod_name: String(vod.vod_name || ""), vod_pic: vod.vod_pic || "", vod_remarks: vod.vod_remarks || vod.type_name || "" };
}
function parsePlay(vod) {
  const from = String(vod.vod_play_from || "播放").split("$$$");
  const urls = String(vod.vod_play_url || "").split("$$$");
  const flags = [], plays = [];
  from.forEach((flag, i) => {
    const parts = (urls[i] || "").split("#").filter(Boolean).map((item) => {
      const idx = item.indexOf("$");
      return idx < 0 ? item + "$" + item : item.slice(0, idx) + "$" + item.slice(idx + 1);
    });
    if (parts.length) { flags.push(flag || "线路" + (i + 1)); plays.push(parts.join("#")); }
  });
  return { vod_play_from: flags.join("$$$") || "播放", vod_play_url: plays.join("$$$") };
}
async function home(site) {
  const data = await fetchJson(apiUrl(site, { ac: "list" }));
  const classes = (data.class || []).filter((c) => c && c.type_id && c.type_name && !/幼|萝莉|小学生|初中|未成年/.test(String(c.type_name))).map((c) => ({ type_id: String(c.type_id), type_name: String(c.type_name) }));
  return { class: classes, list: (data.list || []).slice(0, 20).map((v) => card(site.key, v)) };
}
async function category(site, body) {
  const page = Number(body.page || 1) || 1;
  const data = await fetchJson(apiUrl(site, { ac: "detail", t: body.id, pg: page }));
  return { page: Number(data.page || page), pagecount: Number(data.pagecount || 1), total: Number(data.total || 0), list: (data.list || []).map((v) => card(site.key, v)) };
}
async function detail(site, body) {
  const ids = Array.isArray(body.id) ? body.id : [body.id];
  const list = [];
  for (const raw of ids) {
    const id = String(raw).includes("|") ? String(raw).split("|").slice(1).join("|") : String(raw);
    const data = await fetchJson(apiUrl(site, { ac: "detail", ids: id }));
    const vod = (data.list || [])[0];
    if (!vod) continue;
    const play = parsePlay(vod);
    list.push({ vod_id: site.key + "|" + vod.vod_id, vod_name: vod.vod_name, vod_pic: vod.vod_pic, vod_year: vod.vod_year || "", vod_area: vod.vod_area || "", vod_actor: vod.vod_actor || "", vod_director: vod.vod_director || "", vod_content: vod.vod_content || vod.vod_blurb || "", vod_remarks: vod.vod_remarks || "", vod_play_from: play.vod_play_from, vod_play_url: play.vod_play_url });
  }
  return { list };
}
function play(body) {
  const url = String(body.id || "");
  let referer = "";
  try { referer = new URL(url).origin + "/"; } catch (e) {}
  return { parse: 0, url: url, header: { "User-Agent": UA, Referer: referer } };
}
async function search(site, body) {
  const page = Number(body.page || 1) || 1;
  const data = await fetchJson(apiUrl(site, { ac: "detail", wd: body.wd || "", pg: page }));
  return { page: Number(data.page || page), pagecount: Number(data.pagecount || 1), total: Number(data.total || 0), list: (data.list || []).map((v) => card(site.key, v)) };
}
function configPayload() {
  return { video: { sites: SITES.map((s) => ({ key: "nodejs_" + s.key, name: "18+ " + s.name, type: 3, api: "/spider/" + s.key + "/3" })) } };
}
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text) return resolve({});
      try { resolve(JSON.parse(text)); } catch (e) { resolve({}); }
    });
  });
}
function send(res, data, code) {
  const body = JSON.stringify(data === undefined ? {} : data);
  res.writeHead(code || 200, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}
async function handle(req, res) {
  const u = new URL(req.url, "http://127.0.0.1");
  const path = u.pathname.replace(/\\/+$/, "") || "/";
  try {
    if (path === "/check") return send(res, { run: true });
    if (path === "/config") return send(res, configPayload());
    const m = path.match(/^\\/spider\\/([a-z0-9]+)\\/3\\/(init|home|category|detail|play|search)$/);
    if (!m) return send(res, { error: "not found" }, 404);
    const site = siteMap[m[1]];
    if (!site) return send(res, { error: "unknown site" }, 404);
    const body = req.method === "GET" ? Object.fromEntries(u.searchParams) : await readBody(req);
    if (m[2] === "init") return send(res, {});
    if (m[2] === "home") return send(res, await home(site));
    if (m[2] === "category") return send(res, await category(site, body));
    if (m[2] === "detail") return send(res, await detail(site, body));
    if (m[2] === "play") return send(res, play(body));
    if (m[2] === "search") return send(res, await search(site, body));
    return send(res, {});
  } catch (err) {
    return send(res, { error: String(err && err.message || err) }, 500);
  }
}
async function start() {
  if (server) await stop();
  if (typeof catServerFactory === "function") server = catServerFactory(handle, { forceCloseConnections: true });
  else server = http.createServer(handle);
  await new Promise((resolve) => server.listen(Number(process.env.DEV_HTTP_PORT || 0), "127.0.0.1", resolve));
  return server;
}
async function stop() {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = null;
}
module.exports = { start: start, stop: stop };
globalThis.start = start;
globalThis.stop = stop;

    return module.exports;
  })()`;
};
