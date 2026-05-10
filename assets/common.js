/* Shared helpers: countdown to D-day, manifest loader, history store. */
(function (global) {
  'use strict';

  var EXAM_DATE_ISO = '2026-06-11T07:00:00+07:00'; // Kỳ thi 11/06/2026 sáng
  var STORAGE_HISTORY = 'ngocha.history.v1';
  var STORAGE_PROGRESS_PREFIX = 'ngocha.progress.';

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return n;
  }

  function fmt2(n) { return (n < 10 ? '0' : '') + n; }

  function daysUntilExam() {
    var diff = new Date(EXAM_DATE_ISO).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function startCountdown(node) {
    if (!node) return;
    function tick() {
      var diff = new Date(EXAM_DATE_ISO).getTime() - Date.now();
      if (diff <= 0) { node.textContent = 'Đã đến ngày thi! Cố lên Ngọc Hà 💪'; return; }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      node.innerHTML = 'Còn <span class="num">' + d + '</span> ngày '
        + fmt2(h) + ' giờ ' + fmt2(m) + ' phút đến kỳ thi (11/06/2026)';
    }
    tick();
    setInterval(tick, 30000);
  }

  function loadJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Không tải được ' + url + ' (' + r.status + ')');
      return r.json();
    });
  }

  function loadManifest() { return loadJSON('exams/manifest.json'); }

  // ---------- History (per-browser) ----------
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); }
    catch (_) { return []; }
  }
  function pushHistory(entry) {
    var h = getHistory();
    h.unshift(entry);
    h = h.slice(0, 200);
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(h));
  }
  function clearHistory() { localStorage.removeItem(STORAGE_HISTORY); }

  // ---------- Progress (per exam) ----------
  function progressKey(examId) { return STORAGE_PROGRESS_PREFIX + examId; }
  function getProgress(examId) {
    try { return JSON.parse(localStorage.getItem(progressKey(examId)) || 'null'); }
    catch (_) { return null; }
  }
  function setProgress(examId, data) {
    localStorage.setItem(progressKey(examId), JSON.stringify(data));
  }
  function clearProgress(examId) { localStorage.removeItem(progressKey(examId)); }

  // ---------- File download ----------
  function downloadJSON(filename, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  function getQuery(name) {
    return new URLSearchParams(location.search).get(name);
  }

  global.NH = {
    el: el, fmt2: fmt2,
    daysUntilExam: daysUntilExam, startCountdown: startCountdown,
    loadJSON: loadJSON, loadManifest: loadManifest,
    getHistory: getHistory, pushHistory: pushHistory, clearHistory: clearHistory,
    getProgress: getProgress, setProgress: setProgress, clearProgress: clearProgress,
    downloadJSON: downloadJSON, getQuery: getQuery,
    EXAM_DATE_ISO: EXAM_DATE_ISO
  };
})(window);
