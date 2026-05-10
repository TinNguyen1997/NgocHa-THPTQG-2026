/* Homepage logic: countdown, exam list, history. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  NH.startCountdown($('#countdown'));

  function renderList(manifest) {
    var box = $('#exam-list');
    box.innerHTML = '';
    if (!manifest.exams || !manifest.exams.length) {
      box.appendChild(NH.el('p', { class: 'muted', text: 'Chưa có đề nào.' }));
      return;
    }
    // Sort by date desc, subject asc
    var exams = manifest.exams.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.subject.localeCompare(b.subject);
    });
    exams.forEach(function (e) {
      var pill;
      if (e.status === 'pending') pill = NH.el('span', { class: 'pill pending', text: 'Chờ đề' });
      else if (e.status === 'ready') pill = NH.el('span', { class: 'pill', text: 'Sẵn sàng làm' });
      else pill = NH.el('span', { class: 'pill', text: e.status || '' });

      var card;
      if (e.status === 'pending') {
        card = NH.el('div', { class: 'exam-card', title: 'Chưa có đề' }, [
          NH.el('div', { class: 'subject', text: e.subject }),
          NH.el('div', { class: 'date', text: e.date + ' · ' + (e.duration_minutes || '?') + ' phút' }),
          pill
        ]);
      } else {
        card = NH.el('a', { class: 'exam-card', href: 'exam.html?id=' + encodeURIComponent(e.id) }, [
          NH.el('div', { class: 'subject', text: e.subject }),
          NH.el('div', { class: 'date', text: e.date + ' · ' + (e.duration_minutes || '?') + ' phút' }),
          pill
        ]);
      }
      box.appendChild(card);
    });
  }

  function renderHistory() {
    var box = $('#history');
    var h = NH.getHistory();
    box.innerHTML = '';
    if (!h.length) { box.textContent = 'Chưa có lịch sử.'; return; }
    h.slice(0, 20).forEach(function (item) {
      var when = new Date(item.submitted_at).toLocaleString('vi-VN');
      var score = (item.score != null && item.max_score != null)
        ? (item.score + '/' + item.max_score)
        : '—';
      box.appendChild(NH.el('div', { class: 'item' }, [
        NH.el('div', null, [
          NH.el('div', { text: item.subject + ' · ' + item.date }),
          NH.el('div', { class: 'muted small', text: when })
        ]),
        NH.el('div', { class: 'small' }, 'Điểm: ' + score)
      ]));
    });
  }

  $('#export-history').addEventListener('click', function () {
    NH.downloadJSON('lich-su-' + new Date().toISOString().slice(0, 10) + '.json', NH.getHistory());
  });
  $('#clear-history').addEventListener('click', function () {
    if (confirm('Xoá toàn bộ lịch sử trên trình duyệt này?')) {
      NH.clearHistory();
      renderHistory();
    }
  });

  NH.loadManifest().then(renderList).catch(function (err) {
    $('#exam-list').textContent = 'Lỗi tải danh sách: ' + err.message;
  });
  renderHistory();
})();
