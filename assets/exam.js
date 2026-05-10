/* Exam page: render exam, timer, palette, mark, submit, export. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ---------- Default scoring (THPTQG 2025+) ----------
  var DEFAULT_SCORING = {
    multiple_choice_per_question: 0.25,
    true_false_rules: [0, 0.1, 0.25, 0.5, 1.0], // index = số ý đúng
    short_answer_per_question: 0.25
  };

  var state = {
    exam: null,           // exam JSON
    examId: null,
    questions: [],        // flat list with global numbering: [{ part, q, num }]
    answers: {},          // keyed by partId.qId or partId.qId.itemId for true_false
    flags: {},            // keyed by `${partId}.${qId}` -> true if flagged
    started_at: null,     // ms timestamp
    duration_ms: 0,       // total exam duration
    paused: false,
    paused_at: null,      // ms timestamp when pause began
    paused_total_ms: 0,   // accumulated paused time
    submitted: false,
    timerInterval: null,
    saveTimer: null
  };

  function key(part, q, item) {
    return part.id + '.' + q.id + (item ? '.' + item.id : '');
  }

  function flatQuestions(exam) {
    var list = [], n = 1;
    exam.parts.forEach(function (part) {
      part.questions.forEach(function (q) {
        list.push({ part: part, q: q, num: n++ });
      });
    });
    return list;
  }

  // ---------- Render ----------
  function renderExam() {
    document.title = state.exam.subject + ' · ' + state.exam.date + ' · Ngọc Hà';
    $('#exam-title').textContent = state.exam.subject + ' · ' + state.exam.date;
    var meta = state.exam.source ? ' · ' + state.exam.source : '';
    $('#exam-meta').textContent = 'Thời lượng: ' + state.exam.duration_minutes + ' phút' + meta;

    var qs = $('#questions');
    qs.innerHTML = '';
    state.exam.parts.forEach(function (part) {
      var partEl = NH.el('section', { class: 'part', id: 'part-' + part.id });
      partEl.appendChild(NH.el('h2', { text: part.title || 'Phần ' + part.id }));
      if (part.instructions) partEl.appendChild(NH.el('p', { class: 'instructions', text: part.instructions }));
      part.questions.forEach(function (q) {
        partEl.appendChild(renderQuestion(part, q));
      });
      qs.appendChild(partEl);
    });
    renderPalette();
  }

  function renderQuestion(part, q) {
    var globalNum = state.questions.find(function (x) { return x.part === part && x.q === q; }).num;
    var qEl = NH.el('div', { class: 'q', id: 'q-' + key(part, q) });
    var head = NH.el('div', { class: 'q-head' });
    head.appendChild(NH.el('div', { class: 'q-num', text: 'Câu ' + globalNum + ' (' + part.id + '.' + q.id + ')' }));
    var flagBtn = NH.el('button', { class: 'flag-btn', type: 'button', title: 'Đánh dấu xem lại' }, '⚑ Đánh dấu');
    if (state.flags[key(part, q)]) flagBtn.classList.add('on');
    flagBtn.addEventListener('click', function () {
      state.flags[key(part, q)] = !state.flags[key(part, q)];
      flagBtn.classList.toggle('on', !!state.flags[key(part, q)]);
      saveProgress();
      renderPalette();
    });
    head.appendChild(flagBtn);
    qEl.appendChild(head);

    if (q.stem) qEl.appendChild(NH.el('div', { class: 'stem', html: escapeAndKeepBreaks(q.stem) }));
    if (q.image) {
      var imgPath = resolveAsset(q.image);
      qEl.appendChild(NH.el('div', { class: 'stem' }, NH.el('img', { src: imgPath, alt: 'Hình câu ' + globalNum })));
    }

    if (part.type === 'multiple_choice') qEl.appendChild(renderMC(part, q));
    else if (part.type === 'true_false') qEl.appendChild(renderTF(part, q));
    else if (part.type === 'short_answer') qEl.appendChild(renderSA(part, q));
    else qEl.appendChild(NH.el('div', { class: 'muted', text: '(Loại câu chưa hỗ trợ: ' + part.type + ')' }));

    return qEl;
  }

  function renderMC(part, q) {
    var box = NH.el('div', { class: 'opts' });
    var labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    (q.options || []).forEach(function (opt, i) {
      var letter = labels[i];
      var id = 'opt-' + key(part, q) + '-' + letter;
      var checked = state.answers[key(part, q)] === letter;
      var input = NH.el('input', { type: 'radio', name: key(part, q), value: letter, id: id });
      if (checked) input.checked = true;
      input.addEventListener('change', function () {
        state.answers[key(part, q)] = letter;
        saveProgress(); renderPalette();
      });
      box.appendChild(NH.el('label', { for: id }, [
        input,
        NH.el('span', { html: '<strong>' + letter + '.</strong> ' + escapeAndKeepBreaks(opt) })
      ]));
    });
    return box;
  }

  function renderTF(part, q) {
    var box = NH.el('div', { class: 'tf' });
    (q.items || []).forEach(function (it) {
      var k = key(part, q, it);
      var row = NH.el('div', { class: 'tf-row' });
      row.appendChild(NH.el('div', { html: '<strong>' + it.id + ')</strong> ' + escapeAndKeepBreaks(it.text) }));
      ['T', 'F'].forEach(function (val) {
        var id = 'tf-' + k + '-' + val;
        var input = NH.el('input', { type: 'radio', name: k, value: val, id: id });
        if (state.answers[k] === val) input.checked = true;
        input.addEventListener('change', function () {
          state.answers[k] = val;
          saveProgress(); renderPalette();
        });
        row.appendChild(NH.el('label', { for: id, class: 'small' }, [
          input, NH.el('span', { text: val === 'T' ? ' Đúng' : ' Sai' })
        ]));
      });
      box.appendChild(row);
    });
    return box;
  }

  function renderSA(part, q) {
    var k = key(part, q);
    var input = NH.el('input', {
      type: 'text', class: 'short', placeholder: 'Nhập đáp án ngắn (vd: 0.25, 12, 3/2…)',
      autocomplete: 'off', spellcheck: 'false'
    });
    if (state.answers[k] != null) input.value = state.answers[k];
    input.addEventListener('input', function () {
      state.answers[k] = input.value;
      saveProgress(); renderPalette();
    });
    var box = NH.el('div'); box.appendChild(input); return box;
  }

  function renderPalette() {
    var grid = $('#palette-grid');
    grid.innerHTML = '';
    state.questions.forEach(function (item) {
      var k = key(item.part, item.q);
      var done = isAnswered(item.part, item.q);
      var flagged = !!state.flags[k];
      var cls = 'palette-cell';
      if (done) cls += ' done';
      if (flagged) cls += ' flag';
      var btn = NH.el('button', { class: cls, type: 'button', text: String(item.num) });
      btn.addEventListener('click', function () {
        var qEl = document.getElementById('q-' + k);
        if (qEl) qEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      grid.appendChild(btn);
    });
  }

  function isAnswered(part, q) {
    if (part.type === 'true_false') {
      return (q.items || []).some(function (it) { return state.answers[key(part, q, it)] != null; });
    }
    var v = state.answers[key(part, q)];
    return v != null && v !== '';
  }

  // ---------- Timer ----------
  function startTimer() {
    if (state.timerInterval) return;
    state.timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }

  function updateTimer() {
    var node = $('#timer');
    var remaining = remainingMs();
    if (remaining <= 0) {
      node.textContent = '00:00';
      node.classList.add('danger');
      autoSubmit();
      return;
    }
    var s = Math.floor(remaining / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    node.textContent = (h > 0 ? NH.fmt2(h) + ':' : '') + NH.fmt2(m) + ':' + NH.fmt2(sec);
    node.classList.toggle('warn', remaining < 5 * 60000 && remaining >= 60000);
    node.classList.toggle('danger', remaining < 60000);
  }

  function elapsedMs() {
    var pausedDelta = state.paused && state.paused_at ? (Date.now() - state.paused_at) : 0;
    return Date.now() - state.started_at - state.paused_total_ms - pausedDelta;
  }
  function remainingMs() { return Math.max(0, state.duration_ms - elapsedMs()); }

  function togglePause() {
    if (state.submitted) return;
    if (state.paused) {
      state.paused_total_ms += Date.now() - state.paused_at;
      state.paused_at = null;
      state.paused = false;
      $('#toggle-timer').textContent = 'Tạm dừng';
    } else {
      state.paused = true;
      state.paused_at = Date.now();
      $('#toggle-timer').textContent = 'Tiếp tục';
    }
    saveProgress();
  }

  // ---------- Persistence ----------
  function saveProgress() {
    if (state.submitted) return;
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(function () {
      NH.setProgress(state.examId, {
        answers: state.answers,
        flags: state.flags,
        started_at: state.started_at,
        duration_ms: state.duration_ms,
        paused: state.paused,
        paused_at: state.paused_at,
        paused_total_ms: state.paused_total_ms
      });
    }, 200);
  }

  function loadProgress() {
    var p = NH.getProgress(state.examId);
    if (!p) return false;
    state.answers = p.answers || {};
    state.flags = p.flags || {};
    state.started_at = p.started_at || Date.now();
    state.duration_ms = p.duration_ms || (state.exam.duration_minutes * 60000);
    state.paused = !!p.paused;
    state.paused_at = p.paused_at || null;
    state.paused_total_ms = p.paused_total_ms || 0;
    if (state.paused) $('#toggle-timer').textContent = 'Tiếp tục';
    return true;
  }

  // ---------- Submit & score ----------
  function autoSubmit() {
    if (state.submitted) return;
    submit(true);
  }

  function submit(isAuto) {
    if (state.submitted) return;
    var unanswered = state.questions.filter(function (it) { return !isAnswered(it.part, it.q); }).length;
    if (!isAuto && unanswered > 0) {
      if (!confirm('Còn ' + unanswered + ' câu chưa làm. Vẫn nộp bài?')) return;
    } else if (!isAuto) {
      if (!confirm('Nộp bài và xem kết quả?')) return;
    }
    state.submitted = true;
    if (state.timerInterval) clearInterval(state.timerInterval);
    var result = scoreExam();
    showResult(result, isAuto);
    NH.pushHistory({
      id: state.examId,
      subject: state.exam.subject,
      date: state.exam.date,
      submitted_at: new Date().toISOString(),
      duration_used_ms: Math.min(state.duration_ms, elapsedMs()),
      auto_submitted: !!isAuto,
      score: round2(result.earned),
      max_score: round2(result.max),
      details: result.details
    });
    NH.clearProgress(state.examId);
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function scoreExam() {
    var scoring = Object.assign({}, DEFAULT_SCORING, state.exam.scoring || {});
    var earned = 0, max = 0;
    var details = [];
    state.exam.parts.forEach(function (part) {
      if (part.type === 'multiple_choice') {
        var per = scoring.multiple_choice_per_question;
        part.questions.forEach(function (q) {
          var k = key(part, q);
          var ans = state.answers[k];
          var corr = q.answer != null && ans != null && String(ans).toUpperCase() === String(q.answer).toUpperCase();
          earned += corr ? per : 0;
          max += per;
          details.push({
            ref: k, type: 'mc',
            given: ans || null, correct: q.answer != null ? String(q.answer).toUpperCase() : null,
            ok: corr, points: corr ? per : 0, points_max: per,
            explanation: q.explanation || null
          });
        });
      } else if (part.type === 'true_false') {
        var rules = scoring.true_false_rules;
        part.questions.forEach(function (q) {
          var correctCount = 0, itemDetails = [];
          (q.items || []).forEach(function (it) {
            var k = key(part, q, it);
            var ans = state.answers[k];
            var given = ans === 'T' ? true : ans === 'F' ? false : null;
            var ok = it.answer != null && given !== null && given === !!it.answer;
            if (ok) correctCount++;
            itemDetails.push({
              ref: k, given: given, correct: it.answer != null ? !!it.answer : null,
              ok: ok, explanation: it.explanation || null
            });
          });
          var maxPart = rules[rules.length - 1];
          var earnedPart = rules[Math.min(correctCount, rules.length - 1)] || 0;
          earned += earnedPart; max += maxPart;
          details.push({
            ref: key(part, q), type: 'tf',
            correct_count: correctCount, items: itemDetails,
            points: earnedPart, points_max: maxPart
          });
        });
      } else if (part.type === 'short_answer') {
        var per2 = scoring.short_answer_per_question;
        part.questions.forEach(function (q) {
          var k = key(part, q);
          var ans = (state.answers[k] || '').trim();
          var corr = q.answer != null && norm(ans) === norm(q.answer);
          earned += corr ? per2 : 0;
          max += per2;
          details.push({
            ref: k, type: 'sa',
            given: ans || null, correct: q.answer != null ? String(q.answer) : null,
            ok: corr, points: corr ? per2 : 0, points_max: per2,
            explanation: q.explanation || null
          });
        });
      }
    });
    return { earned: earned, max: max, details: details };
  }

  function norm(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
  }

  function showResult(result, isAuto) {
    var dlg = $('#result-dialog');
    var sum = $('#result-summary');
    var pct = result.max ? Math.round((result.earned / result.max) * 1000) / 10 : 0;
    sum.innerHTML = '';
    sum.appendChild(NH.el('p', { html:
      'Điểm: <strong>' + round2(result.earned) + ' / ' + round2(result.max) + '</strong> (' + pct + '%)' }));
    if (isAuto) sum.appendChild(NH.el('p', { class: 'muted small', text: '⏰ Hết giờ — bài đã được nộp tự động.' }));
    var nFlag = Object.keys(state.flags).filter(function (k) { return state.flags[k]; }).length;
    if (nFlag) sum.appendChild(NH.el('p', { class: 'muted small', text: 'Bạn đã đánh dấu ' + nFlag + ' câu để xem lại.' }));

    var detail = $('#result-detail'); detail.innerHTML = '';
    result.details.forEach(function (d) {
      var node = NH.el('div', { class: 'result-detail-item ' + (d.ok ? 'good' : (d.given == null && d.type !== 'tf' ? 'skip' : 'bad')) });
      if (d.type === 'tf') {
        node.appendChild(NH.el('div', { html: '<strong>' + d.ref + '</strong>: ' + d.correct_count + '/' + d.items.length + ' ý đúng — ' + round2(d.points) + '/' + round2(d.points_max) + ' điểm' }));
        d.items.forEach(function (it) {
          node.appendChild(NH.el('div', { class: 'small ' + (it.ok ? 'good' : 'bad') },
            it.ref + ': bạn ' + (it.given == null ? '(bỏ trống)' : (it.given ? 'Đúng' : 'Sai')) + ' — đáp án: ' + (it.correct == null ? '?' : (it.correct ? 'Đúng' : 'Sai'))));
        });
      } else {
        var line = '<strong>' + d.ref + '</strong>: bạn chọn <em>' + (d.given == null ? '(bỏ trống)' : d.given) + '</em>';
        if (d.correct != null) line += ' · đáp án: <em>' + d.correct + '</em>';
        line += ' · ' + round2(d.points) + '/' + round2(d.points_max) + ' điểm';
        node.appendChild(NH.el('div', { html: line }));
        if (d.explanation) node.appendChild(NH.el('div', { class: 'small muted', text: d.explanation }));
      }
      detail.appendChild(node);
    });

    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');

    $('#download-result').onclick = function () {
      var payload = {
        exam_id: state.examId,
        subject: state.exam.subject,
        date: state.exam.date,
        submitted_at: new Date().toISOString(),
        duration_minutes: state.exam.duration_minutes,
        time_used_seconds: Math.round(Math.min(state.duration_ms, elapsedMs()) / 1000),
        auto_submitted: !!isAuto,
        answers: state.answers,
        flags: state.flags,
        score: round2(result.earned),
        max_score: round2(result.max),
        percentage: pct,
        details: result.details
      };
      var fname = 'ket-qua_' + state.examId + '_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      NH.downloadJSON(fname, payload);
    };
    $('#redo-btn').onclick = function () {
      if (!confirm('Làm lại đề này từ đầu?')) return;
      NH.clearProgress(state.examId);
      location.reload();
    };
  }

  // ---------- Helpers ----------
  function escapeAndKeepBreaks(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function resolveAsset(path) {
    if (/^https?:\/\//.test(path)) return path;
    if (path.charAt(0) === '/') return path;
    // Resolve relative to exam folder.
    var folder = examFolder();
    return folder + '/' + path.replace(/^\.\//, '');
  }

  function examFolder() {
    // exams/<date>/<subjectKey>/
    var parts = state.exam.id.split('-');
    // id like "2026-05-10-toan" — last segment is subject key, first 3 are date
    var subject = parts.slice(3).join('-') || 'unknown';
    var date = parts.slice(0, 3).join('-');
    return 'exams/' + date + '/' + subject;
  }

  // ---------- Init ----------
  function init() {
    state.examId = NH.getQuery('id');
    if (!state.examId) {
      $('#questions').innerHTML = '<p class="muted">Thiếu tham số <code>id</code> trong URL.</p>';
      return;
    }
    NH.loadManifest().then(function (manifest) {
      var entry = (manifest.exams || []).find(function (e) { return e.id === state.examId; });
      if (!entry) throw new Error('Không tìm thấy đề id=' + state.examId);
      if (entry.status === 'pending') {
        $('#questions').innerHTML = '<p class="muted">Đề <strong>' + entry.subject + ' (' + entry.date + ')</strong> chưa có nội dung. Hãy commit ảnh đề + đáp án rồi cập nhật <code>exam.json</code>.</p>';
        return;
      }
      return NH.loadJSON(entry.path).then(function (exam) {
        state.exam = exam;
        state.questions = flatQuestions(exam);
        state.duration_ms = (exam.duration_minutes || 90) * 60000;
        if (!loadProgress()) {
          state.started_at = Date.now();
          state.duration_ms = (exam.duration_minutes || 90) * 60000;
          saveProgress();
        }
        renderExam();
        if (!state.paused) startTimer();
        else updateTimer();
      });
    }).catch(function (err) {
      $('#questions').innerHTML = '<p class="muted">Lỗi: ' + err.message + '</p>';
    });

    $('#submit-btn').addEventListener('click', function () { submit(false); });
    $('#toggle-timer').addEventListener('click', togglePause);

    // Warn before leaving with unsaved progress.
    window.addEventListener('beforeunload', function (e) {
      if (state.submitted) return;
      if (Object.keys(state.answers).length === 0) return;
      e.preventDefault(); e.returnValue = '';
    });
  }

  init();
})();
