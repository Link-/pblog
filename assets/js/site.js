(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-label]");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (!themeButton) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    themeButton.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeLabel.textContent = `Switch to ${nextTheme} mode`;
  };

  applyTheme(root.dataset.theme);

  themeButton?.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  });

  systemTheme.addEventListener("change", (event) => {
    if (!localStorage.getItem("theme")) applyTheme(event.matches ? "dark" : "light");
  });

  const article = document.querySelector("[data-article-content]");
  const progress = document.querySelector("[data-reading-progress]");

  if (article && progress) {
    const updateProgress = () => {
      const start = article.offsetTop;
      const distance = article.offsetHeight - window.innerHeight;
      const percentage = distance <= 0 ? 100 : Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100));
      progress.style.width = `${percentage}%`;
    };
    updateProgress();
    document.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  document.querySelectorAll(".prose").forEach((prose) => {
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    const textNodes = [];
    const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.includes("http")) return NodeFilter.FILTER_REJECT;
        if (node.parentElement.closest("a, code, pre, script, style, iframe, textarea")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      const matches = [...text.matchAll(urlPattern)];
      if (!matches.length) return;

      const fragment = document.createDocumentFragment();
      let cursor = 0;
      matches.forEach((match) => {
        const rawUrl = match[0];
        const url = rawUrl.replace(/[),.;:!?\]}]+$/, "");
        const trailing = rawUrl.slice(url.length);

        fragment.append(text.slice(cursor, match.index));
        const link = document.createElement("a");
        link.href = url;
        link.textContent = url;
        link.className = "auto-link";
        fragment.append(link, trailing);
        cursor = match.index + rawUrl.length;
      });
      fragment.append(text.slice(cursor));
      textNode.replaceWith(fragment);
    });
  });

  document.querySelectorAll(".prose pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code || code.classList.contains("language-mermaid")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const language = [...code.classList]
      .find((className) => className.startsWith("language-"))
      ?.replace("language-", "");

    if (language) {
      const label = document.createElement("span");
      label.className = "code-language";
      label.textContent = language;
      wrapper.appendChild(label);
    }

    const button = document.createElement("button");
    button.className = "copy-button";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code to clipboard");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
        button.classList.add("is-copied");
        setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("is-copied");
        }, 1800);
      } catch {
        button.textContent = "Select code";
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
    wrapper.appendChild(button);
  });

  const languageNames = {
    bash: "Bash",
    go: "Go",
    javascript: "JavaScript",
    js: "JavaScript",
    python: "Python",
    py: "Python",
    rb: "Ruby",
    ruby: "Ruby",
    rust: "Rust",
    rs: "Rust",
    sh: "Shell",
    ts: "TypeScript",
    typescript: "TypeScript",
  };
  const codeTabsStorageKey = "code-language";

  // Kramdown puts the language-* class on the wrapper div, not on <code>.
  const languageOf = (element) =>
    [...(element.closest('[class*="language-"]')?.classList || [])]
      .find((className) => className.startsWith("language-"))
      ?.replace("language-", "");

  const codeTabGroups = [...document.querySelectorAll(".prose .code-tabs")]
    .map((group, groupIndex) => {
      // Use the group's direct children so kramdown's wrapper divs move into the panels too.
      const blocks = [...group.children].filter((child) => child.querySelector(".code-block"));
      if (blocks.length < 2) return null;

      const tablist = document.createElement("div");
      tablist.className = "code-tabs-list";
      tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", group.dataset.label || "Code language");

      const tabs = blocks.map((block, index) => {
        const language = languageOf(block.querySelector("code")) || `code-${index + 1}`;
        const tabId = `code-tabs-${groupIndex}-tab-${index}`;
        const panelId = `code-tabs-${groupIndex}-panel-${index}`;

        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "code-tab";
        tab.id = tabId;
        tab.dataset.language = language;
        tab.textContent = languageNames[language] || language;
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", panelId);
        tablist.appendChild(tab);

        const panel = document.createElement("div");
        panel.className = "code-tab-panel";
        panel.id = panelId;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tabId);
        panel.tabIndex = 0;
        block.replaceWith(panel);
        panel.appendChild(block);

        return { tab, panel, language };
      });

      group.prepend(tablist);
      group.classList.add("is-enhanced");
      return { tabs };
    })
    .filter(Boolean);

  const selectTab = (group, selected) => {
    group.tabs.forEach(({ tab, panel }) => {
      const isSelected = tab === selected;
      tab.setAttribute("aria-selected", isSelected);
      tab.tabIndex = isSelected ? 0 : -1;
      panel.hidden = !isSelected;
    });
  };

  const selectLanguage = (language) => {
    codeTabGroups.forEach((group) => {
      const match = group.tabs.find((item) => item.language === language);
      if (match) selectTab(group, match.tab);
    });
  };

  if (codeTabGroups.length) {
    let savedLanguage = null;
    try {
      savedLanguage = localStorage.getItem(codeTabsStorageKey);
    } catch {}

    codeTabGroups.forEach((group) => {
      const preferred = group.tabs.find((item) => item.language === savedLanguage) || group.tabs[0];
      selectTab(group, preferred.tab);

      group.tabs.forEach(({ tab, language }, index) => {
        tab.addEventListener("click", () => {
          // Switching every group can change the page height above this one; keep the clicked tab still.
          const before = tab.getBoundingClientRect().top;
          selectLanguage(language);
          window.scrollBy(0, tab.getBoundingClientRect().top - before);
          try {
            localStorage.setItem(codeTabsStorageKey, language);
          } catch {}
        });

        tab.addEventListener("keydown", (event) => {
          const last = group.tabs.length - 1;
          const targets = { ArrowLeft: index === 0 ? last : index - 1, ArrowRight: index === last ? 0 : index + 1, Home: 0, End: last };
          if (!(event.key in targets)) return;
          event.preventDefault();
          const next = group.tabs[targets[event.key]].tab;
          next.focus();
          next.click();
        });
      });
    });
  }

  const mermaidBlocks = document.querySelectorAll("pre > code.language-mermaid");
  if (mermaidBlocks.length) {
    const diagrams = [];

    mermaidBlocks.forEach((block, index) => {
      const frame = document.createElement("figure");
      frame.className = "diagram-frame";

      const toolbar = document.createElement("div");
      toolbar.className = "diagram-toolbar";
      toolbar.setAttribute("role", "group");
      toolbar.setAttribute("aria-label", "Diagram controls");
      toolbar.innerHTML = `
        <button type="button" data-diagram-action="zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
        <output aria-live="polite">100%</output>
        <button type="button" data-diagram-action="zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
        <button type="button" data-diagram-action="reset" aria-label="Reset zoom" title="Reset zoom">Reset</button>
        <button type="button" data-diagram-action="fullscreen" aria-label="View diagram fullscreen" title="View fullscreen">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>
        </button>
      `;

      const viewport = document.createElement("div");
      viewport.className = "diagram-viewport";

      const container = document.createElement("div");
      container.className = "mermaid";
      container.id = `mermaid-${index}`;
      container.textContent = block.textContent;

      viewport.appendChild(container);
      frame.append(toolbar, viewport);
      (block.closest(".highlighter-rouge") || block.parentElement).replaceWith(frame);
      diagrams.push({ frame, container, toolbar, viewport, scale: 1 });
    });

    import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: root.dataset.theme === "dark" ? "dark" : "neutral",
        securityLevel: "strict",
      });

      await mermaid.run({ nodes: diagrams.map(({ container }) => container) });

      diagrams.forEach((diagram) => {
        const svg = diagram.container.querySelector("svg");
        const output = diagram.toolbar.querySelector("output");
        const fullscreenButton = diagram.toolbar.querySelector('[data-diagram-action="fullscreen"]');
        if (!svg) return;

        svg.style.maxWidth = "none";
        svg.style.height = "auto";
        if (!diagram.frame.requestFullscreen) fullscreenButton.hidden = true;

        const setScale = (nextScale) => {
          diagram.scale = Math.min(2.5, Math.max(0.5, nextScale));
          svg.style.width = `${diagram.scale * 100}%`;
          output.value = `${Math.round(diagram.scale * 100)}%`;
        };

        diagram.toolbar.addEventListener("click", async (event) => {
          const button = event.target.closest("[data-diagram-action]");
          if (!button) return;

          switch (button.dataset.diagramAction) {
            case "zoom-in":
              setScale(diagram.scale + 0.25);
              break;
            case "zoom-out":
              setScale(diagram.scale - 0.25);
              break;
            case "reset":
              setScale(1);
              diagram.viewport.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              break;
            case "fullscreen":
              if (document.fullscreenElement === diagram.frame) {
                await document.exitFullscreen();
              } else {
                await diagram.frame.requestFullscreen();
              }
              break;
          }
        });

        document.addEventListener("fullscreenchange", () => {
          const isFullscreen = document.fullscreenElement === diagram.frame;
          fullscreenButton.setAttribute("aria-pressed", isFullscreen);
          fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit diagram fullscreen" : "View diagram fullscreen");
          fullscreenButton.title = isFullscreen ? "Exit fullscreen" : "View fullscreen";
        });

        setScale(1);
      });
    });
  }

  const filterButtons = [...document.querySelectorAll("[data-talk-filter]")];
  const searchInput = document.querySelector("[data-talk-search]");
  const talkCards = [...document.querySelectorAll("[data-talk-card]")];
  const talkStatus = document.querySelector("[data-talk-status]");
  let activeFilter = "all";

  const filterTalks = () => {
    const query = searchInput?.value.trim().toLowerCase() || "";
    let visible = 0;
    talkCards.forEach((card) => {
      const matchesType = activeFilter === "all" || card.dataset.type === activeFilter;
      const matchesSearch = !query || card.dataset.search.includes(query);
      const show = matchesType && matchesSearch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (talkStatus) talkStatus.textContent = `${visible} appearance${visible === 1 ? "" : "s"}`;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.talkFilter;
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", selected);
      });
      filterTalks();
    });
  });
  searchInput?.addEventListener("input", filterTalks);

  const headshotPicker = document.querySelector("[data-headshot-picker]");
  if (headshotPicker) {
    const preview = headshotPicker.querySelector("[data-headshot-preview]");
    const label = headshotPicker.querySelector("[data-headshot-label]");
    const download = document.querySelector("[data-headshot-download]");
    const options = [...headshotPicker.querySelectorAll("[data-headshot-src]")];

    options.forEach((option) => {
      option.addEventListener("click", () => {
        preview.src = option.dataset.headshotSrc;
        preview.alt = option.dataset.headshotAlt;
        label.textContent = option.dataset.headshotLabel;
        download.href = option.dataset.headshotSrc;
        download.download = option.dataset.headshotFilename;

        options.forEach((item) => {
          const selected = item === option;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", selected);
        });
      });
    });
  }
})();
