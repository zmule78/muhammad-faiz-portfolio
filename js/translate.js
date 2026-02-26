// =====================================================
// Full-Page Translation Engine - ID, EN, JP
// Translates ALL text content on the page (not just nav)
// + Center alignment for sentences with less than 13 words
// =====================================================

(function () {
  "use strict";

  const DEFAULT_LANG = "id";
  const SUPPORTED_LANGS = { id: "id", en: "en", jp: "ja" };
  const originalTexts = new Map();
  let currentLang = localStorage.getItem("siteLang") || DEFAULT_LANG;
  let isTranslating = false;

  // ===== Collect all text nodes from the page =====
  function getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toUpperCase();
        const skipTags = ["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","INPUT","SELECT","CODE","PRE","KBD","VAR"];
        if (skipTags.includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".lang-switcher")) return NodeFilter.FILTER_REJECT;
        if (parent.closest("#translate-loader")) return NodeFilter.FILTER_REJECT;
        if (node.textContent.trim().length > 0) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  // ===== Store original text =====
  function storeOriginalTexts(nodes) {
    nodes.forEach((node) => {
      if (!originalTexts.has(node)) originalTexts.set(node, node.textContent);
    });
  }

  // ===== Translate text via Google Translate API (free) =====
  async function translateText(text, targetLang) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(text);
    try {
      const response = await fetch(url);
      const data = await response.json();
      let translated = "";
      if (data && data[0]) {
        data[0].forEach(function (segment) {
          if (segment[0]) translated += segment[0];
        });
      }
      return translated || text;
    } catch (error) {
      console.warn("Translation error:", error);
      return text;
    }
  }

  // ===== Batch translate for efficiency =====
  async function batchTranslate(texts, targetLang) {
    const BATCH_SIZE = 60;
    const results = [];
    for (var i = 0; i < texts.length; i += BATCH_SIZE) {
      var batch = texts.slice(i, i + BATCH_SIZE);
      var separator = " ||| ";
      var combined = batch.join(separator);
      var translated = await translateText(combined, targetLang);
      var parts = translated.split(/\s*\|\|\|\s*/);
      batch.forEach(function (_, index) {
        results.push(parts[index] !== undefined ? parts[index] : batch[index]);
      });
      if (i + BATCH_SIZE < texts.length) {
        await new Promise(function (resolve) { setTimeout(resolve, 350); });
      }
    }
    return results;
  }

  // ===== Count words in text =====
  function countWords(text) {
    return text.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length;
  }

  // ===== Apply center alignment for sentences < 13 words =====
  function applyCenterAlignment(node, text) {
    var parent = node.parentElement;
    if (!parent) return;
    var wordCount = countWords(text);
    if (wordCount > 0 && wordCount < 13) {
      parent.classList.add("short-text-center");
    } else {
      parent.classList.remove("short-text-center");
    }
  }

  // ===== Loading overlay =====
  function showLoading(show) {
    var loader = document.getElementById("translate-loader");
    if (show) {
      if (!loader) {
        loader = document.createElement("div");
        loader.id = "translate-loader";
        loader.innerHTML =
          '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(2px)">' +
          '<div style="background:#fff;padding:24px 40px;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center;font-family:sans-serif">' +
          '<div style="width:36px;height:36px;border:3px solid #e0e0e0;border-top:3px solid #1B2A4A;border-radius:50%;animation:trSpin .8s linear infinite;margin:0 auto 12px"></div>' +
          '<div style="font-size:14px;color:#333;font-weight:500">Translating page...</div>' +
          '</div></div>' +
          '<style>@keyframes trSpin{to{transform:rotate(360deg)}}</style>';
        document.body.appendChild(loader);
      }
    } else {
      if (loader) loader.remove();
    }
  }

  // ===== Main: Translate entire page =====
  async function translatePage(langKey) {
    if (isTranslating) return;
    isTranslating = true;
    var targetLang = SUPPORTED_LANGS[langKey];
    var textNodes = getTextNodes(document.body);
    storeOriginalTexts(textNodes);
    showLoading(true);

    try {
      if (langKey === DEFAULT_LANG) {
        // Restore to original text
        textNodes.forEach(function (node) {
          var original = originalTexts.get(node);
          if (original) {
            node.textContent = original;
            applyCenterAlignment(node, original);
          }
        });
      } else {
        // Collect texts
        var textsToTranslate = textNodes.map(function (node) {
          return originalTexts.get(node) || node.textContent;
        });
        var nonEmptyIndices = [];
        var nonEmptyTexts = [];
        textsToTranslate.forEach(function (text, i) {
          if (text.trim().length > 1) {
            nonEmptyIndices.push(i);
            nonEmptyTexts.push(text.trim());
          }
        });

        // Batch translate
        var translated = await batchTranslate(nonEmptyTexts, targetLang);

        // Apply translations
        nonEmptyIndices.forEach(function (nodeIndex, resultIndex) {
          var node = textNodes[nodeIndex];
          var translatedText = translated[resultIndex];
          if (translatedText) {
            var originalFull = textsToTranslate[nodeIndex];
            var leadingSpace = originalFull.match(/^\s*/)[0];
            var trailingSpace = originalFull.match(/\s*$/)[0];
            node.textContent = leadingSpace + translatedText + trailingSpace;
            applyCenterAlignment(node, translatedText);
          }
        });
      }
    } catch (error) {
      console.error("Page translation failed:", error);
    }

    showLoading(false);
    isTranslating = false;
    localStorage.setItem("siteLang", langKey);
    currentLang = langKey;
    document.documentElement.lang = targetLang;
  }

  // ===== Init language switcher =====
  function initLangSwitcher() {
    var switcher = document.querySelector(".lang-switcher");
    if (!switcher) return;

    var btn = switcher.querySelector(".lang-btn");
    var dropdown = switcher.querySelector(".lang-dropdown");
    var options = switcher.querySelectorAll(".lang-option");
    var langLabels = { id: "ID", en: "EN", jp: "JP" };

    function updateUI(lang) {
      var label = btn.querySelector(".lang-label");
      if (label) label.textContent = langLabels[lang];
      options.forEach(function (opt) {
        opt.classList.toggle("active", opt.dataset.lang === lang);
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      switcher.classList.toggle("open");
    });

    options.forEach(function (opt) {
      opt.addEventListener("click", function () {
        var lang = opt.dataset.lang;
        if (lang === currentLang && lang !== DEFAULT_LANG) {
          switcher.classList.remove("open");
          return;
        }
        updateUI(lang);
        translatePage(lang);
        switcher.classList.remove("open");
      });
    });

    document.addEventListener("click", function () {
      switcher.classList.remove("open");
    });

    // Set initial UI state
    updateUI(currentLang);

    // Auto-translate if saved language is not default
    if (currentLang !== DEFAULT_LANG) {
      setTimeout(function () { translatePage(currentLang); }, 600);
    }
  }

  // ===== Apply initial center alignment on page load =====
  function applyInitialCenterAlignment() {
    var textNodes = getTextNodes(document.body);
    textNodes.forEach(function (node) {
      applyCenterAlignment(node, node.textContent);
    });
  }

  // ===== MutationObserver for dynamic content =====
  function initObserver() {
    var observer = new MutationObserver(function (mutations) {
      if (isTranslating) return;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (addedNode) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE) return;
          if (addedNode.closest(".lang-switcher")) return;
          if (addedNode.closest("#translate-loader")) return;

          var newTextNodes = getTextNodes(addedNode);
          if (newTextNodes.length === 0) return;

          // Apply center alignment to new content
          newTextNodes.forEach(function (tn) {
            applyCenterAlignment(tn, tn.textContent);
          });

          // Auto-translate new content if not default lang
          if (currentLang !== DEFAULT_LANG) {
            storeOriginalTexts(newTextNodes);
            var texts = newTextNodes.map(function (n) { return n.textContent.trim(); });
            batchTranslate(texts, SUPPORTED_LANGS[currentLang]).then(function (results) {
              newTextNodes.forEach(function (node, i) {
                if (results[i]) {
                  node.textContent = results[i];
                  applyCenterAlignment(node, results[i]);
                }
              });
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ===== DOMContentLoaded =====
  document.addEventListener("DOMContentLoaded", function () {
    initLangSwitcher();
    applyInitialCenterAlignment();
    initObserver();
  });
})();
