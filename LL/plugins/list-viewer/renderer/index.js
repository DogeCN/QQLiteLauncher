const semver = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;
const validateAndParse = (version) => {
  if (typeof version !== "string") {
    throw new TypeError("Invalid argument expected string");
  }
  const match = version.match(semver);
  if (!match) {
    throw new Error(`Invalid argument not valid semver ('${version}' received)`);
  }
  match.shift();
  return match;
};
const isWildcard = (s) => s === "*" || s === "x" || s === "X";
const tryParse = (v) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? v : n;
};
const forceType = (a, b) => typeof a !== typeof b ? [String(a), String(b)] : [a, b];
const compareStrings = (a, b) => {
  if (isWildcard(a) || isWildcard(b))
    return 0;
  const [ap, bp] = forceType(tryParse(a), tryParse(b));
  if (ap > bp)
    return 1;
  if (ap < bp)
    return -1;
  return 0;
};
const compareSegments = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const r = compareStrings(a[i] || "0", b[i] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
};
const compareVersions = (v1, v2) => {
  const n1 = validateAndParse(v1);
  const n2 = validateAndParse(v2);
  const p1 = n1.pop();
  const p2 = n2.pop();
  const r = compareSegments(n1, n2);
  if (r !== 0)
    return r;
  if (p1 && p2) {
    return compareSegments(p1.split("."), p2.split("."));
  } else if (p1 || p2) {
    return p1 ? -1 : 1;
  }
  return 0;
};
const compare = (v1, v2, operator) => {
  assertValidOperator(operator);
  const res = compareVersions(v1, v2);
  return operatorResMap[operator].includes(res);
};
const operatorResMap = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
};
const allowedOperators = Object.keys(operatorResMap);
const assertValidOperator = (op) => {
  if (typeof op !== "string") {
    throw new TypeError(`Invalid operator type, expected string but got ${typeof op}`);
  }
  if (allowedOperators.indexOf(op) === -1) {
    throw new Error(`Invalid operator, expected one of ${allowedOperators.join("|")}`);
  }
};
class Node {
  value;
  next;
  constructor(value) {
    this.value = value;
  }
}
class Queue {
  #head;
  #tail;
  #size;
  constructor() {
    this.clear();
  }
  enqueue(value) {
    const node = new Node(value);
    if (this.#head) {
      this.#tail.next = node;
      this.#tail = node;
    } else {
      this.#head = node;
      this.#tail = node;
    }
    this.#size++;
  }
  dequeue() {
    const current = this.#head;
    if (!current) {
      return;
    }
    this.#head = this.#head.next;
    this.#size--;
    return current.value;
  }
  peek() {
    if (!this.#head) {
      return;
    }
    return this.#head.value;
  }
  clear() {
    this.#head = void 0;
    this.#tail = void 0;
    this.#size = 0;
  }
  get size() {
    return this.#size;
  }
  *[Symbol.iterator]() {
    let current = this.#head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}
const AsyncResource = {
  bind(fn, _type, thisArg) {
    return fn.bind(thisArg);
  }
};
function pLimit(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
  }
  const queue = new Queue();
  let activeCount = 0;
  const next = () => {
    activeCount--;
    if (queue.size > 0) {
      queue.dequeue()();
    }
  };
  const run = async (function_, resolve, arguments_) => {
    activeCount++;
    const result = (async () => function_(...arguments_))();
    resolve(result);
    try {
      await result;
    } catch {
    }
    next();
  };
  const enqueue = (function_, resolve, arguments_) => {
    queue.enqueue(
      AsyncResource.bind(run.bind(void 0, function_, resolve, arguments_))
    );
    (async () => {
      await Promise.resolve();
      if (activeCount < concurrency && queue.size > 0) {
        queue.dequeue()();
      }
    })();
  };
  const generator = (function_, ...arguments_) => new Promise((resolve) => {
    enqueue(function_, resolve, arguments_);
  });
  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount
    },
    pendingCount: {
      get: () => queue.size
    },
    clearQueue: {
      value() {
        queue.clear();
      }
    }
  });
  return generator;
}
class QCheck {
  labelEl;
  inputEl;
  spanEl;
  textNodeEl;
  constructor(options) {
    const label = document.createElement("label");
    this.labelEl = label;
    label.classList.add(`q-${options.type}`);
    const input = document.createElement("input");
    this.inputEl = input;
    options.name && input.setAttribute("name", options.name);
    options.value && input.setAttribute("value", options.value);
    input.setAttribute("type", options.type);
    input.checked = options.checked;
    const span = document.createElement("span");
    this.spanEl = span;
    span.classList.add(`q-${options.type}__input`);
    const textNode = document.createElement("span");
    this.textNodeEl = textNode;
    textNode.style.marginLeft = "5px";
    textNode.textContent = options.label;
    label.appendChild(input);
    label.appendChild(span);
    label.appendChild(textNode);
    input.addEventListener("change", () => {
      if (input.checked) {
        label.classList.add("is-checked");
      } else {
        label.classList.remove("is-checked");
      }
    });
    if (input.checked) {
      label.classList.add("is-checked");
    } else {
      label.classList.remove("is-checked");
    }
  }
}
class QInput {
  prefixEL;
  inputEl;
  clearEl;
  element;
  constructor(options) {
    this.element = document.createElement("div");
    this.element.classList.add("q-input");
    this.clearEl = document.createElement("div");
    this.clearEl.classList.add("q-input__clear");
    this.clearEl.innerHTML = `<i class="q-svg-icon q-icon" role="button" bf-label-inner="true" tabindex="0" aria-label="清空" style="width: 16px; height: 16px; --340fd034: var(--icon_secondary);"><svg viewBox="0 0 24 24"><use xlink:href="/_upper_/resource/icons/close_24.svg#close_24"></use></svg></i>`;
    this.clearEl.style.display = "none";
    this.inputEl = document.createElement("input");
    this.inputEl.spellcheck = false;
    this.inputEl.type = options.type;
    this.inputEl.name = options.name || "";
    this.inputEl.value = options.value || "";
    this.inputEl.placeholder = options.placeholder || "";
    this.inputEl.classList.add("q-input__inner");
    this.element.appendChild(this.inputEl);
    if (options.clearable) {
      this.inputEl.classList.add("q-input__clearable");
      this.inputEl.addEventListener("input", () => {
        if (this.inputEl.value) {
          this.clearEl.style.display = "flex";
        } else {
          this.clearEl.style.display = "none";
        }
      });
      this.clearEl.addEventListener("click", () => {
        this.inputEl.value = "";
      });
      this.element.appendChild(this.clearEl);
    }
  }
}
const hostReg = /^https?:\/\/[^/]+/;
const originMirrors = ["https://mirror.ghproxy.com/", "https://ghproxy.net/", "https://github.moeyy.xyz/"];
const thisSlug = "list-viewer";
let config;
async function initConfig() {
  const defaultConfig = {
    inactivePlugins: [],
    debug: false,
    useMirror: true,
    useGithubIO: false,
    mirrors: {
      downloadUrl: ["https://cdn.jsdelivr.net/gh"]
      // rawUrl: []
    },
    listSortType: "default",
    githubToken: "",
    listLastForceUpdate: 0,
    proxy: {
      url: "",
      enabled: false
    },
    requestTimeout: 3e3
  };
  config = await LiteLoader.api.config.get(thisSlug, defaultConfig);
  const save = debounce((obj) => {
    const objCloned = JSON.parse(JSON.stringify(obj));
    config.debug && console.log("save obj", objCloned);
    LiteLoader.api.config.set(thisSlug, objCloned);
  }, 1e3);
  config = deepWatch(config, () => {
    save(config);
  });
}
function getRandomItem(arr) {
  return arr ? arr[Math.floor(Math.random() * arr.length)] : void 0;
}
function useMirror(url2, mirror, removeHost = true) {
  if (/\/gh$/.test(mirror) && mirror.includes("jsdelivr")) {
    return mirror + url2.replace(hostReg, "").replace("/raw/", "@").replace(/@v(?!v)/, "@vv");
  } else {
    return mirror + (removeHost ? url2.replace(hostReg, "") : url2);
  }
}
function localFetch(path, plugin = "list-viewer") {
  return fetch(`local:///${LiteLoader.plugins[plugin].path.plugin.replace(":\\", "://").replaceAll("\\", "/")}/${path.startsWith("/") ? path.slice(1) : path}`);
}
function fetchWithTimeout(url2, options, timeout = config.requestTimeout) {
  url2 = getRedirectedGitHubUrl(url2) || url2;
  config.debug && console.log("fetchWithTimeout", url2);
  if (config.proxy.enabled) {
    return ListViewer.request(url2, {
      timeout,
      headers: options?.headers,
      body: options?.body,
      method: options?.method
    }).then((res2) => {
      if (res2.success) {
        return res2.data;
      } else {
        throw new Error(res2.message);
      }
    });
  }
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("请求超时"));
    }, timeout);
    fetch(url2, { ...options, signal: controller.signal }).then(async (response) => {
      clearTimeout(timeoutId);
      const ab = await response.arrayBuffer();
      resolve({
        data: ab,
        str: new TextDecoder().decode(ab),
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
    }).catch((error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
function deepWatch(obj, callback) {
  const observer = new Proxy(obj, {
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue !== value) {
        callback();
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          deepWatch(value, callback);
        }
      }
      return Reflect.set(target, key, value, receiver);
    }
  });
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "object" && obj[i] !== null) {
        obj[i] = deepWatch(obj[i], callback);
      }
    }
  } else {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        obj[key] = deepWatch(obj[key], callback);
      }
    }
  }
  return observer;
}
function getRedirectedGitHubUrl(url2) {
  const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/refs\/heads\/([^/]+)\/(.+)/;
  const match = url2.match(regex);
  if (match) {
    const user = match[1];
    const repo = match[2];
    const branch = match[3];
    const filePath = match[4];
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`;
  }
  return;
}
function isSameDay(timestamp) {
  const inputDate = new Date(timestamp);
  const currentDate = /* @__PURE__ */ new Date();
  return inputDate.getFullYear() === currentDate.getFullYear() && inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() === currentDate.getDate();
}
const listUrl = {
  repo: "LiteLoaderQQNT/Plugin-List",
  branch: "v4",
  file: "plugins.json"
};
const defaultIcon = "local://root/src/settings/static/default.png";
const domParser = new DOMParser();
let listLoadingPromise;
let listIconsPromise;
let listIcons;
const typeMap = {
  extension: "扩展",
  theme: "主题",
  framework: "框架"
};
let pluginList;
let currentItem;
let currentManifest;
let showDialog;
let filterInput;
const filterTypes = {
  extension: {
    label: "扩展",
    checked: true,
    qc: {}
  },
  theme: {
    label: "主题",
    checked: true,
    qc: {}
  },
  framework: {
    label: "框架",
    checked: true,
    qc: {}
  }
};
function onSettingWindowCreated(view) {
  initConfig();
  localFetch("/assets/view.html").then((e) => e.text()).then(async (res) => {
    const doms = domParser.parseFromString(res, "text/html");
    filterInput = doms.querySelector("#list-search");
    const typeFilterEl = doms.querySelector(".list-filter-type-checkbox");
    typeFilterEl.replaceChildren(
      ...Object.keys(filterTypes).map((e1) => {
        const e = filterTypes[e1];
        const qc = new QCheck({
          label: e.label,
          checked: e.checked,
          type: "checkbox"
        });
        qc.inputEl.addEventListener("change", () => {
          e.checked = qc.inputEl.checked;
        });
        e.qc = qc;
        return qc.labelEl;
      })
    );
    const refreshBtn = doms.querySelector(".refresh-btn");
    const totalEl = doms.querySelector(".total-text");
    const dialogInstall = doms.querySelector(".list-dialog-install");
    const dialogInstallClose = doms.querySelector(".list-dialog-install-btn-close");
    const scrollToTopBtn = doms.querySelector(".scroll-to-top-btn");
    scrollToTopBtn.addEventListener("click", () => {
      view.parentElement.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
    const versionEl = doms.querySelector(".version-text");
    const versionA = doms.createElement("a");
    versionA.onclick = () => {
      LiteLoader.api.openExternal("https://github.com/" + LiteLoader.plugins[thisSlug].manifest.repository.repo);
    };
    versionA.innerText = LiteLoader.plugins[thisSlug].manifest.version;
    versionEl.append(versionA);
    const listRepoA = doms.querySelector("a.list-repo");
    listRepoA.onclick = () => {
      LiteLoader.api.openExternal(`https://github.com/${listUrl.repo}/tree/${listUrl.branch}`);
    };
    let resFunc;
    dialogInstallClose.addEventListener("click", () => {
      dialogInstall.close();
      resFunc();
    });
    const useRepo = doms.querySelector(".list-dialog-btn-repo");
    useRepo.addEventListener("click", () => {
      dialogInstall.close();
      resFunc(false);
    });
    const useRelease = doms.querySelector(".list-dialog-btn-release");
    useRelease.addEventListener("click", () => {
      dialogInstall.close();
      resFunc(true);
    });
    let dialogResolve;
    const dialog = doms.querySelector(".list-dialog");
    const dialogClose = doms.querySelector(".list-dialog-btn-close");
    dialogClose.addEventListener("click", () => {
      dialog.close();
      dialogResolve();
    });
    const dialogTitle = doms.querySelector(".list-dialog-title");
    const dialogContent = doms.querySelector(".list-dialog-content");
    const dialogConfirm = doms.querySelector(".list-dialog-btn-confirm");
    dialogConfirm.addEventListener("click", () => {
      dialog.close();
      dialogResolve(true);
    });
    const dialogCancel = doms.querySelector(".list-dialog-btn-cancel");
    dialogCancel.addEventListener("click", () => {
      dialog.close();
      dialogResolve(false);
    });
    showDialog = (option) => {
      let dialogInput;
      dialogTitle.innerText = option.title;
      config.debug && console.log("showDialog", JSON.parse(JSON.stringify(option)));
      dialogCancel.style.removeProperty("display");
      if (option.type === "confirm" || option.type === "message") {
        dialogContent.innerText = option.message || "";
        if (option.content) {
          if (typeof option.content === "string") {
            dialogContent.innerHTML = option.content;
          } else {
            dialogContent.replaceChildren(option.content);
          }
        }
        if (option.type === "message") {
          dialogCancel.style.display = "none";
        }
      } else if (option.type === "prompt") {
        dialogInput = option.textarea ? document.createElement("textarea") : document.createElement("input");
        dialogInput.placeholder = option.placeholder ?? "请输入内容";
        dialogInput.value = option.default ?? "";
        dialogInput.style.width = "100%";
        dialogInput.style.background = "var(--background_02)";
        dialogInput.style.color = "var(--bg_white_light)";
        dialogInput.style.marginTop = "10px";
        dialogContent.replaceChildren(option.message || "", dialogInput);
      }
      dialogConfirm.innerText = option.confirm || "确定";
      dialogCancel.innerText = option.cancel || "取消";
      return new Promise((resolve) => {
        dialog.showModal();
        dialogResolve = (bool) => {
          if (option.type === "prompt") {
            config.debug && console.log("prompt result:", bool ? dialogInput.value : void 0);
            resolve(bool ? dialogInput.value : void 0);
          } else {
            config.debug && console.log("dialog result:", bool);
            resolve(bool);
          }
        };
      });
    };
    const timeoutInput = doms.querySelector(".timeout-input");
    const timeoutInput1 = new QInput({
      type: "number",
      placeholder: "超时时间（ms）",
      value: config.requestTimeout + ""
    });
    timeoutInput.appendChild(timeoutInput1.element);
    timeoutInput1.inputEl.addEventListener("change", () => {
      config.requestTimeout = Math.max(3e3, parseInt(timeoutInput1.inputEl.value));
    });
    const mirrorSwitch = doms.querySelector(".mirror-switch");
    mirrorSwitch.toggleAttribute("is-active", config.useMirror);
    mirrorSwitch.onclick = () => {
      const isActive = mirrorSwitch.hasAttribute("is-active");
      mirrorSwitch.toggleAttribute("is-active", !isActive);
      config.useMirror = !isActive;
      if (!isActive && githubIOBtn.hasAttribute("is-active")) {
        githubIOBtn.click();
      }
    };
    const mirrorAddBtn = doms.querySelector(".mirror-add-btn");
    mirrorAddBtn.onclick = () => {
      showDialog({
        title: "添加镜像",
        type: "prompt",
        placeholder: "请输入镜像地址，每行一个",
        message: `请输入镜像地址，每行一个，如果代理方式是完整url在地址后面，比如
https://mirror/https://github.com/xx/xx，则需要写
https://mirror/https://github.com/
如果代理方式是 path在地址后面，比如
https://mirror/xx/xx，则需要写https://mirror
jsdelivr镜像直接按默认那个写就行
内置三个镜像'https://mirror.ghproxy.com', 'https://ghproxy.net', 'https://github.moeyy.xyz'
使用时默认优先使用第一个，如果没有响应才会使用其他镜像`,
        textarea: true,
        default: config.mirrors.downloadUrl.join("\n")
      }).then((res2) => {
        if (typeof res2 === "string") {
          config.mirrors.downloadUrl = res2.split("\n");
        }
      });
    };
    const githubIOBtn = doms.querySelector(".github-io-switch");
    githubIOBtn.toggleAttribute("is-active", config.useGithubIO);
    githubIOBtn.onclick = () => {
      const isActive = githubIOBtn.hasAttribute("is-active");
      githubIOBtn.toggleAttribute("is-active", !isActive);
      config.useGithubIO = !isActive;
      console.log(!isActive, mirrorSwitch.hasAttribute("is-active"));
      if (!isActive && mirrorSwitch.hasAttribute("is-active")) {
        mirrorSwitch.click();
      }
    };
    const proxySwitch = doms.querySelector(".proxy-switch");
    proxySwitch.toggleAttribute("is-active", config.proxy.enabled);
    proxySwitch.onclick = () => {
      const isActive = proxySwitch.hasAttribute("is-active");
      proxySwitch.toggleAttribute("is-active", !isActive);
      config.proxy.enabled = !isActive;
    };
    const proxySetBtn = doms.querySelector(".proxy-set-btn");
    proxySetBtn.onclick = () => {
      showDialog({
        title: "设置代理",
        type: "prompt",
        placeholder: "请输入代理地址",
        message: `请输入代理地址，支持 http、socks，比如 socks://127.0.0.1:10808`,
        default: config.proxy.url
      }).then((res2) => {
        if (typeof res2 === "string") {
          config.proxy.url = res2;
        }
      });
    };
    const githubtokenSetBtn = doms.querySelector(".githubtoken-set-btn");
    githubtokenSetBtn.onclick = () => {
      showDialog({
        title: "设置GithubToken",
        type: "prompt",
        placeholder: "请输入GithubToken",
        message: `请输入GithubToken，如果没有请留空，设置了GithubToken可以减少出现请求速领限制的问题
前往 https://github.com/settings/tokens 获取，scope 选择 repo > public_repo`,
        default: config.githubToken
      }).then((res2) => {
        if (typeof res2 === "string") {
          config.githubToken = res2;
        }
      });
    };
    const sortListFunc = (type) => {
      listLoadingPromise.then(() => {
        config.debug && console.log("开始排序", type);
        switch (type) {
          case "default":
            pluginListDom.replaceChildren(...Array.from(pluginListDom.children).sort((a, b) => (Number(a.dataset.index) || 0) - (Number(b.dataset.index) || 0)));
            break;
          case "installed":
            pluginListDom.replaceChildren(...Array.from(pluginListDom.children).sort((a, b) => (Number(b.dataset.installed) || 0) - (Number(a.dataset.installed) || 0)));
            break;
          case "outdated":
            pluginListDom.replaceChildren(...Array.from(pluginListDom.children).sort((a, b) => (Number(b.dataset.update) || 0) - (Number(a.dataset.update) || 0)));
            break;
        }
      });
    };
    const sortSelect = doms.querySelector(".sort-select");
    doms.querySelector(`[data-value="${config.listSortType}"]`)?.setAttribute("is-selected", "");
    sortSelect.addEventListener("selected", (e) => {
      config.debug && console.log("列表排序方式改变", e.detail);
      if (config.listSortType !== e.detail.value) {
        sortListFunc(e.detail.value);
      }
      config.listSortType = e.detail.value;
    });
    doms.body.childNodes.forEach((dom) => {
      view.appendChild(dom);
    });
    const showInstallDialog = () => new Promise((resolve) => {
      dialogInstall.showModal();
      resFunc = resolve;
    });
    createItemComponent(await localFetch("/assets/list-item.html").then((e) => e.text()), showInstallDialog);
    const pluginListDom = view.querySelector("#plugin-list");
    const getList1 = (noCache = false) => {
      refreshBtn.setAttribute("is-disabled", "");
      sortSelect.setAttribute("is-disabled", "");
      if (!noCache && !isSameDay(config.listLastForceUpdate)) {
        noCache = true;
      }
      if (config.useGithubIO) {
        listLoadingPromise = getListGithubIO(noCache).then(async (records) => {
          if (noCache) {
            config.listLastForceUpdate = +/* @__PURE__ */ new Date();
          }
          if (typeof records === "string") {
            showDialog({
              title: "获取列表失败",
              type: "message",
              message: records
            });
            return;
          }
          listIconsPromise = getIconsGithubIO(noCache).then((icons) => {
            if (typeof icons === "string") {
              showDialog({
                title: "获取图标失败",
                type: "message",
                message: icons
              });
              return;
            }
            listIcons = icons;
          });
          pluginList = records;
          totalEl.innerText = records.length.toString();
          records.forEach((plugin, i) => {
            const dom = document.createElement("plugin-item");
            dom.dataset.name = plugin.repo;
            dom.dataset.description = plugin.branch;
            pluginListDom.appendChild(dom);
            const manifest = plugin.manifest;
            dom.dataset.index = i + "";
            config.debug && console.log(plugin, manifest);
            updateElProp(dom, manifest, plugin.repo);
          });
        });
      } else {
        listLoadingPromise = getList(noCache).then(async (list) => {
          if (noCache) {
            config.listLastForceUpdate = +/* @__PURE__ */ new Date();
          }
          if (typeof list === "string") {
            showDialog({
              title: "获取列表失败",
              type: "message",
              message: list
            });
            return;
          }
          pluginList = list;
          totalEl.innerText = list.length.toString();
          const promArr = [];
          const limit = pLimit(3);
          list.forEach((plugin, i) => {
            const dom = document.createElement("plugin-item");
            dom.dataset.name = plugin.repo;
            dom.dataset.description = plugin.branch;
            pluginListDom.appendChild(dom);
            promArr.push(
              limit(async () => {
                const manifest = await getManifest(plugin, noCache);
                dom.dataset.index = i + "";
                config.debug && console.log(plugin, manifest);
                updateElProp(dom, manifest, plugin.repo);
              })
            );
          });
          return Promise.all(promArr);
        });
      }
      listLoadingPromise.finally(() => {
        refreshBtn.removeAttribute("is-disabled");
        sortSelect.removeAttribute("is-disabled");
      });
    };
    refreshBtn.addEventListener("click", () => {
      pluginListDom.replaceChildren();
      getList1(true);
      sortListFunc(config.listSortType);
    });
    getList1();
    sortListFunc(config.listSortType);
  }).catch(console.error);
}
function createItemComponent(innerHtml, showInstallDialog) {
  class PluginListClass extends HTMLElement {
    titleEl;
    descriptionEl;
    versionEl;
    authorsEl;
    manipulateEl;
    iconEl;
    updateBtnEl;
    installBtnEl;
    uninstallBtnEl;
    detailBtnEl;
    retryBtnEl;
    typeEl;
    dependenciesItemsEl;
    platformsEl;
    manifest = null;
    #initPromise;
    #initPromiseResolve;
    #initialized = false;
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = innerHtml;
      this.#initPromise = new Promise((resolve) => {
        this.#initPromiseResolve = resolve;
        if (this.#initialized) resolve();
      });
    }
    connectedCallback() {
      config.debug && console.log("组件创建", this);
      if (this.#initialized) return;
      this.titleEl = this.shadowRoot.querySelector(".title");
      this.descriptionEl = this.shadowRoot.querySelector(".description");
      this.versionEl = this.shadowRoot.querySelector(".version");
      this.authorsEl = this.shadowRoot.querySelector(".authors");
      this.manipulateEl = this.shadowRoot.querySelector(".manipulate");
      this.iconEl = this.shadowRoot.querySelector(".icon");
      this.typeEl = this.shadowRoot.querySelector(".type");
      this.dependenciesItemsEl = this.shadowRoot.querySelector(".dependencies>.items");
      this.platformsEl = this.shadowRoot.querySelector(".platforms");
      this.updateBtnEl = this.shadowRoot.querySelector(".update");
      const installEvent = async (update = false) => {
        currentItem = pluginList[Number(this.dataset.index)];
        currentManifest = this.manifest;
        showInstallDialog().then((res) => {
          if (res !== void 0) {
            if (update) {
              this.updateBtnEl.setAttribute("is-disabled", "");
              this.updateBtnEl.innerText = "安装中...";
            } else {
              this.installBtnEl.setAttribute("is-disabled", "");
              this.installBtnEl.innerText = "安装中...";
            }
            install(res).then((res2) => {
              console.log("安装成功", res2);
              if (res2.success) {
                this.dataset.installed = "1";
                this.dataset.inactive = "1";
                if (update) {
                  delete this.dataset.update;
                  if (res2.data?.isManual) {
                    this.dataset.manualUpdate = "1";
                    showDialog({
                      title: "手动更新",
                      message: '请手动更新插件，在退出 qq 后，删除原文件夹，重命名带"[list-viewer-updated]"的新文件夹，',
                      type: "confirm",
                      confirm: "打开插件文件夹",
                      cancel: "稍后再去"
                    }).then((e) => {
                      if (e) {
                        LiteLoader.api.openPath(LiteLoader.path.plugins);
                      }
                    });
                  }
                }
                config.inactivePlugins.push(this.manifest.slug);
                this.updateOpenDirEvent();
              } else if (res2.message) {
                showDialog({ title: "安装失败", message: res2.message, type: "message" });
              }
            }).catch((e) => {
              console.log("安装失败", e);
              showDialog({ title: "安装失败", message: e.message, type: "message" });
            }).finally(() => {
              console.log("安装结束");
              if (update) {
                this.updateBtnEl.removeAttribute("is-disabled");
                this.updateBtnEl.innerText = "更新";
              } else {
                this.installBtnEl.removeAttribute("is-disabled");
                this.installBtnEl.innerText = "安装";
              }
            });
          }
        });
      };
      this.updateBtnEl.addEventListener("click", () => installEvent(true));
      this.installBtnEl = this.shadowRoot.querySelector(".install");
      this.installBtnEl.addEventListener("click", () => installEvent());
      this.uninstallBtnEl = this.shadowRoot.querySelector(".uninstall");
      this.uninstallBtnEl.addEventListener("click", async () => {
        config.debug && console.log("uninstall", this.manifest.name);
        currentItem = pluginList[Number(this.dataset.index)];
        currentManifest = this.manifest;
        showDialog({ title: "卸载", message: `确定要卸载插件 ${this.manifest.name} 吗？`, type: "confirm" }).then((e) => {
          if (e) {
            this.uninstallBtnEl.innerText = "卸载中...";
            this.uninstallBtnEl.setAttribute("is-disabled", "");
            uninstall().then((res) => {
              if (res.success) {
                this.uninstallBtnEl.innerText = "卸载";
                this.uninstallBtnEl.removeAttribute("is-disabled");
                delete this.dataset.installed;
                if (config.inactivePlugins.includes(this.manifest.slug)) {
                  this.dataset.inactive = "0";
                  config.inactivePlugins = config.inactivePlugins.filter((e2) => e2 !== this.manifest.slug);
                }
                this.updateOpenDirEvent();
              } else {
                showDialog({ title: "卸载失败", message: res.message, type: "message" });
              }
            });
          }
        });
      });
      this.retryBtnEl = this.shadowRoot.querySelector(".retry");
      this.retryBtnEl.addEventListener("click", async () => {
        this.retryBtnEl.innerText = "重试中...";
        this.retryBtnEl.setAttribute("is-disabled", "");
        const manifest = await getManifest(pluginList[Number(this.dataset.index)]);
        if (manifest !== 404) {
          this.manifest = manifest;
        }
        updateElProp(this, manifest, this.dataset.failed);
        this.retryBtnEl.innerText = "重试";
        this.retryBtnEl.removeAttribute("is-disabled");
      });
      this.detailBtnEl = this.shadowRoot.querySelector(".detail");
      this.detailBtnEl.addEventListener("click", async () => {
        LiteLoader.api.openExternal(`https://github.com/${pluginList[Number(this.dataset.index)].repo}/tree/${pluginList[Number(this.dataset.index)].branch}`);
      });
      filterInput.addEventListener("input", () => this.updateHidden());
      for (const key in filterTypes) {
        const item = filterTypes[key];
        item.qc.inputEl.addEventListener("change", () => this.updateHidden());
      }
      this.updateHidden();
      this.updateOpenDirEvent();
      this.#initialized = true;
      this.#initPromiseResolve?.();
    }
    static get observedAttributes() {
      return ["data-name", "data-version", "data-description", "data-authors", "data-icon", "data-failed", "data-type", "data-dependencies", "data-platforms"];
    }
    attributeChangedCallback(name, _oldValue, newValue) {
      config.debug && console.log("attributeChangedCallback", name, newValue ? newValue.slice(0, 100) : null);
      this.#initPromise.then(() => {
        try {
          switch (name) {
            case "data-failed":
              if (newValue) {
                this.titleEl.innerText = newValue;
                this.titleEl.style.color = "red";
                this.descriptionEl.innerText = "获取失败";
              } else {
                this.titleEl.style.removeProperty("color");
              }
              break;
            case "data-name":
              this.titleEl.innerText = newValue || "插件名";
              this.titleEl.title = newValue || "";
              break;
            case "data-version":
              this.versionEl.innerText = newValue || "版本";
              this.versionEl.title = newValue || "";
              break;
            case "data-description":
              this.descriptionEl.innerText = newValue || "插件描述";
              this.descriptionEl.title = newValue || "";
              break;
            case "data-authors": {
              const arr = newValue === "1" ? this.manifest.authors : [];
              this.authorsEl.append(
                ...arr.map((author) => {
                  const a = document.createElement("a");
                  a.title = author.link;
                  a.innerText = author.name;
                  a.onclick = () => LiteLoader.api.openExternal(author.link);
                  return a;
                }).reduce((p, v, i) => {
                  p[i * 2] = v;
                  if (i) p[i * 2 - 1] = " | ";
                  return p;
                }, [])
              );
              break;
            }
            case "data-type":
              this.typeEl.innerText = typeMap[newValue + ""] || "unknown";
              break;
            case "data-platforms":
              this.platformsEl.title = this.platformsEl.innerText = newValue || "";
              break;
            case "data-dependencies": {
              const arr = newValue === "1" ? this.manifest.dependencies : [];
              this.dependenciesItemsEl.append(
                ...arr.map((e) => {
                  const a = document.createElement("a");
                  a.title = e;
                  a.innerText = e;
                  a.onclick = () => {
                    const item = document.getElementById(`item-${e}`);
                    if (item) {
                      item.scrollIntoView?.();
                      item.classList.add("highlight-item");
                      setTimeout(() => {
                        item.classList.remove("highlight-item");
                      }, 2e3);
                    }
                  };
                  return a;
                }).reduce((p, v, i) => {
                  p[i * 2] = v;
                  if (i) p[i * 2 - 1] = " | ";
                  return p;
                }, [])
              );
              break;
            }
            case "data-icon": {
              let src, src1;
              if (newValue?.startsWith?.("data:image")) {
                src = newValue;
              } else {
                ;
                [src, src1] = (newValue || "").split(",");
              }
              this.iconEl.src = src || defaultIcon;
              let num = 0;
              this.iconEl.addEventListener("error", () => {
                if (this.iconEl.src === defaultIcon) {
                  return;
                }
                if (src1 && num < 3) {
                  const iconPath = this.manifest.icon.replace(/^\.?\//, "");
                  switch (num) {
                    case 0:
                      this.iconEl.src = src.replace(iconPath, `src/${iconPath}`);
                      break;
                    case 1:
                      this.iconEl.src = src1;
                      break;
                    case 2:
                      this.iconEl.src = src1.replace(iconPath, `src/${iconPath}`);
                      break;
                  }
                } else {
                  this.iconEl.src = defaultIcon;
                }
                num++;
              });
              break;
            }
            default:
              break;
          }
        } catch (error) {
          console.error(this.dataset.name || this.dataset.failed, error);
        }
      });
    }
    updateOpenDirEvent() {
      if (this.manifest && LiteLoader.plugins[this.manifest.slug] && this.dataset.installed === "1") {
        this.titleEl.title = "点击打开插件所在目录";
        this.titleEl.addEventListener("click", () => {
          LiteLoader.api.openPath(LiteLoader.plugins[this.manifest.slug].path.plugin);
        });
        this.titleEl.style.cursor = "pointer";
      }
    }
    /**
     * 过滤用，判断是否应该隐藏
     */
    updateHidden() {
      try {
        const authors = this.dataset.authors === "1" ? this.manifest.authors : [];
        const str = (this.dataset.name || "") + (this.dataset.version || "") + (this.dataset.description || "") + (this.dataset.version || "") + authors.map((e) => e.name).join("");
        if ((!filterInput.value || str.toLowerCase().includes(filterInput.value.toLowerCase())) && (filterTypes[this.dataset.type]?.checked ?? true)) {
          this.hidden = false;
        } else {
          this.hidden = true;
        }
      } catch (error) {
        console.error(this.manifest?.slug || this.dataset.name, error);
      }
    }
  }
  customElements.define("plugin-item", PluginListClass);
  return {};
}
function updateElProp(el, manifest, repo) {
  if (manifest !== 404 && manifest !== null) {
    el.id = `item-${manifest.slug}`;
    el.dataset.name = manifest.name;
    el.manifest = manifest;
    el.updateOpenDirEvent();
    el.dataset.description = manifest.description;
    el.dataset.lower4 = Number(manifest.manifest_version) >= 4 ? "" : "1";
    el.dataset.authors = manifest.authors ? "1" : "";
    el.dataset.platforms = manifest.platform.join(" | ");
    el.dataset.installed = LiteLoader.plugins[manifest.slug] ? "1" : "";
    el.dataset.slug = manifest.slug;
    const icon = getIconUrls(pluginList[Number(el.dataset.index)], manifest);
    if (Array.isArray(icon)) {
      el.dataset.icon = icon.toString();
    } else {
      icon.then((icon2) => {
        el.dataset.icon = icon2.toString();
      });
    }
    el.dataset.defaultIcon = defaultIcon;
    el.dataset.type = manifest.type;
    el.dataset.dependencies = manifest.dependencies?.length ? "1" : "";
    delete el.dataset.failed;
    if (LiteLoader.plugins[manifest.slug]) {
      el.dataset.version = LiteLoader.plugins[manifest.slug].manifest.version;
      config.debug && console.log(manifest.slug, LiteLoader.plugins[manifest.slug], manifest);
      el.dataset.update = compare(manifest.version, LiteLoader.plugins[manifest.slug]?.manifest?.version ?? manifest.version, ">") ? "1" : "";
      el.shadowRoot.querySelector(".newer-version").innerText = `-> ${manifest.version}`;
    } else {
      el.dataset.version = manifest.version;
    }
    if (config.inactivePlugins.includes(manifest.slug)) {
      if (!LiteLoader.plugins[manifest.slug]) {
        el.dataset.inactive = "1";
      } else {
        config.inactivePlugins = config.inactivePlugins.filter((v) => v !== manifest.slug);
      }
    }
  } else {
    el.dataset.failed = repo;
    if (manifest === 404) {
      el.dataset.run = "1";
    }
  }
}
async function getList(noCache = false, again = false) {
  let url = "";
  if (config.useMirror) {
    const m = getGithubMirror(!again);
    url = useMirror(getRawUrl(listUrl, listUrl.file), m || getRandomItem(originMirrors), !!m);
  } else {
    url = getRawUrl(listUrl, listUrl.file);
  }
  return await fetchWithTimeout(url, {
    cache: noCache ? "no-cache" : "default"
  }).then((res) => {
    if (res.status === 200) {
      return JSON.parse(res.str);
    } else {
      throw new Error(JSON.stringify(res));
    }
  }).catch((err) => {
    if (again) {
      console.error(`getList ${url}`, err);
      return String(err);
    } else {
      console.warn(`getList ${url}`, err);
      return getList(noCache, true);
    }
  });
}
async function getListGithubIO(noCache = false) {
  const url = "https://ltxhhz.github.io/LL-plugin-list-viewer/all-manifest.json";
  return await fetchWithTimeout(url, {
    cache: noCache ? "no-cache" : "default"
  }).then((res) => {
    if (res.status === 200) {
      return JSON.parse(res.str);
    } else {
      throw new Error(JSON.stringify(res));
    }
  }).catch((err) => {
    console.error(`getListGithubIO ${url}`, err);
    return String(err);
  });
}
async function getManifest(item, noCache = false, again = false) {
  let url;
  let m = getGithubMirror(!again);
  if (config.useMirror) {
    url = useMirror(getRawUrl(item, "manifest.json"), m || getRandomItem(originMirrors), !!m);
  } else {
    url = getRawUrl(item, "manifest.json");
  }
  return await fetchWithTimeout(url, {
    cache: noCache ? "no-cache" : "default"
  }).then((res) => {
    if (res.status === 200) {
      return JSON.parse(res.str);
    } else {
      m = getGithubMirror(!again);
      if (config.useMirror) {
        url = useMirror(getRawUrl(item, "package.json"), m || getRandomItem(originMirrors), !!m);
      } else {
        url = getRawUrl(item, "package.json");
      }
      return fetchWithTimeout(url, {
        cache: noCache ? "no-cache" : "default"
      }).then(async (res1) => {
        if (res1.status === 200) {
          const pkg = JSON.parse(res1.str);
          const obj = pkg.liteloader_manifest;
          if (obj) {
            obj.version = pkg.version;
            obj.description = pkg.description;
            obj.authors = typeof pkg.author === "string" ? [{ name: pkg.author, link: `https://github.com/${pkg.author}` }] : [pkg.author];
            return obj;
          }
        } else {
          if (res.status === 404 || res1.status === 404) {
            return 404;
          }
        }
        return null;
      });
    }
  }).catch((err) => {
    if (again) {
      console.error(`getManifest ${url}`, err);
      return null;
    } else {
      console.warn(`getManifest ${url}`, err);
      return getManifest(item, noCache, true);
    }
  });
}
async function install(release = false) {
  let url;
  config.debug && console.log("install", currentItem);
  if (release) {
    const urlObj = await getLatestReleaseUrl(currentItem, currentManifest);
    if (urlObj.zip) {
      url = urlObj.zip;
    } else if (urlObj.message) {
      return {
        success: false,
        message: `github api 获取资产包失败

${urlObj.message}`
      };
    } else {
      const res = await showDialog({
        title: "未发现zip资产包",
        message: "是否使用源代码包安装？",
        type: "confirm"
      });
      if (res) {
        url = urlObj.ball;
      } else {
        url = "";
      }
    }
    if (url === "") {
      return {
        success: false,
        message: ""
      };
    }
    if (!url) {
      return {
        success: false,
        message: "获取release包失败"
      };
    }
  } else {
    url = getArchiveUrl(currentItem);
  }
  if (config.useMirror) {
    const m = getGithubMirror();
    return ListViewer.getPkg(currentManifest.slug, useMirror(url, m || getRandomItem(originMirrors), !!m));
  } else {
    return ListViewer.getPkg(currentManifest.slug, url);
  }
}
function getIconUrls(item, manifest) {
  if (config.useGithubIO && listIconsPromise) {
    return listIconsPromise.then(() => [listIcons[manifest.slug]]);
  } else if (manifest.icon) {
    const iconPath = manifest.icon.replace(/^\.?\//, "");
    const m = getGithubMirror(true);
    const m1 = getGithubMirror();
    if (config.useMirror) {
      return [useMirror(getRawUrl(item, iconPath), m || getRandomItem(originMirrors), !!m), useMirror(getRawUrl(item, iconPath), m1 || getRandomItem(originMirrors), !!m1)];
    } else {
      return [getRawUrl(item, iconPath)];
    }
  }
  return [];
}
async function getIconsGithubIO(noCache = false) {
  return fetchWithTimeout("https://ltxhhz.github.io/LL-plugin-list-viewer/all-icons.json", {
    cache: noCache ? "no-cache" : "default"
  }).then((res) => {
    if (res.status === 200) {
      return JSON.parse(res.str);
    } else {
      throw new Error(JSON.stringify(res));
    }
  }).catch((err) => {
    console.error(`getIconsGithubIO`, err);
    return String(err);
  });
}
function uninstall() {
  return ListViewer.removePkg(currentManifest.slug);
}
function getGithubMirror(first = false) {
  if (first) {
    return config.mirrors.downloadUrl[0];
  }
  return getRandomItem(config.mirrors.downloadUrl.splice(1));
}
function getRawUrl(item, file) {
  return `https://github.com/${item.repo}/raw/refs/heads/${item.branch}/${file}`;
}
function getArchiveUrl(item) {
  return `https://github.com/${item.repo}/archive/refs/heads/${item.branch}.zip`;
}
async function getLatestReleaseUrl(item, manifest) {
  const url = `https://api.github.com/repos/${item.repo}/releases/latest`;
  const headers = {};
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }
  const body = await fetchWithTimeout(url, {
    headers
  }).then((e) => JSON.parse(e.str)).catch((err) => {
    throw new Error(`${err.message} 
${url}`);
  });
  const zipFile = body.assets?.find?.((asset) => asset.name === `${manifest.slug}.zip`) ?? body.assets?.find?.((asset) => asset.name === `${manifest.name}.zip`) ?? body.assets?.find?.((asset) => asset.name.endsWith(".zip"));
  return {
    zip: zipFile?.browser_download_url,
    ball: `https://github.com/${item.repo}/archive/refs/tags/${body.tag_name}.zip`,
    //body.zipball_url
    message: body.message
  };
}
export {
  onSettingWindowCreated
};
