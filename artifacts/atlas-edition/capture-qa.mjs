import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputRoot = new URL("./", import.meta.url);
const baseUrl = process.env.ATLAS_QA_URL || "http://localhost:3000";
const localUrl = (path) => new URL(path, `${baseUrl}/`).href;
const profile = await mkdtemp(join(tmpdir(), "today-news-atlas-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

let socket;
try {
  const browserSocket = await readDevToolsUrl(chrome.stderr);
  const targetsUrl = browserSocket.replace("ws://", "http://").replace(/\/devtools\/browser\/.*$/, "/json/list");
  const targets = await fetch(targetsUrl).then((response) => response.json());
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget) throw new Error("Chrome did not expose a page target");

  socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const cdp = createCdp(socket);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__atlasVitals = { cls: 0, lcp: 0, longTasks: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__atlasVitals.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          window.__atlasVitals.lcp = entries.at(-1)?.startTime || 0;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          window.__atlasVitals.longTasks += list.getEntries().length;
        }).observe({ type: "longtask", buffered: true });
      } catch {}
    `,
  });

  const captures = [
    { name: "home-360x800.png", url: localUrl("/"), width: 360, height: 800, mobile: true },
    { name: "home-390x844.png", url: localUrl("/"), width: 390, height: 844, mobile: true },
    { name: "home-768x1024.png", url: localUrl("/"), width: 768, height: 1024 },
    { name: "home-1024x900.png", url: localUrl("/"), width: 1024, height: 900 },
    { name: "home-1440x900.png", url: localUrl("/"), width: 1440, height: 900 },
    { name: "category-world-1440x900.png", url: localUrl("/world"), width: 1440, height: 900 },
    {
      name: "article-390x844.png",
      url: localUrl("/world/coastal-cities-accelerate-flood-defense-projects"),
      width: 390,
      height: 844,
      mobile: true,
    },
    {
      name: "article-1440x900.png",
      url: localUrl("/world/coastal-cities-accelerate-flood-defense-projects"),
      width: 1440,
      height: 900,
    },
    { name: "staff-1440x900.png", url: localUrl("/staff"), width: 1440, height: 900 },
  ];

  const measurements = [];
  for (const capture of captures) {
    measurements.push(await capturePage(cdp, capture));
  }

  await setViewport(cdp, 1440, 900, false);
  await setMotion(cdp, false);
  await navigate(cdp, localUrl("/"));
  await scrollTo(cdp, "#world-heading");
  await delay(1800);
  await saveScreenshot(cdp, "world-rest-1440x900.png");
  const globeRect = await evaluate(cdp, `(() => {
    const rect = document.querySelector('.atlas-globe')?.getBoundingClientRect();
    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  })()`);
  if (globeRect) {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: globeRect.x + globeRect.width * 0.82,
      y: globeRect.y + globeRect.height * 0.35,
    });
    await delay(520);
  }
  await saveScreenshot(cdp, "world-pointer-1440x900.png");

  await setMotion(cdp, true);
  await navigate(cdp, localUrl("/"));
  await scrollTo(cdp, "#world-heading");
  await delay(500);
  await saveScreenshot(cdp, "world-reduced-motion-1440x900.png");

  const version = await cdp.send("Browser.getVersion");
  await writeFile(
    new URL("qa-results.json", outputRoot),
    JSON.stringify({ browser: version.product, baseUrl, capturedAt: new Date().toISOString(), measurements }, null, 2),
  );
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill();
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      delay(2000),
    ]);
  }
  await rm(profile, { recursive: true, force: true });
}

async function capturePage(cdp, capture) {
  await setViewport(cdp, capture.width, capture.height, capture.mobile ?? false);
  await setMotion(cdp, false);
  await navigate(cdp, capture.url);
  await evaluate(cdp, "scrollTo(0, 0)");
  await delay(700);
  await saveScreenshot(cdp, capture.name);
  return evaluate(cdp, `(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      route: location.pathname,
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      loadMs: nav?.loadEventEnd || 0,
      ...window.__atlasVitals,
    };
  })()`);
}

async function setViewport(cdp, width, height, mobile) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function setMotion(cdp, reduce) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      if ((await evaluate(cdp, "document.readyState")) === "complete") break;
    } catch {
      // The execution context is briefly replaced during navigation.
    }
    await delay(250);
  }
  await evaluate(cdp, "document.fonts.ready.then(() => true)", true);
  await delay(300);
}

async function scrollTo(cdp, selector) {
  await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'start' })`);
}

async function saveScreenshot(cdp, name) {
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await writeFile(new URL(name, outputRoot), Buffer.from(data, "base64"));
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

function createCdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message));
    else item.resolve(message.result);
  });
  return {
    send(method, params = {}) {
      const messageId = ++id;
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
  };
}

async function readDevToolsUrl(stream) {
  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk.toString();
    const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) return match[1];
  }
  throw new Error("Chrome exited before exposing DevTools");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
