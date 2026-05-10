# NgocHa-THPTQG-2026

Trang web ôn thi tốt nghiệp THPTQG 2026 cho **Ngọc Hà** — đếm ngược tới ngày thi **11/06/2026**, làm đề trực tuyến giống thi thật, chấm điểm và xuất file kết quả.

🌐 **Live:** https://tinnguyen1997.github.io/NgocHa-THPTQG-2026/

## Tính năng

- ⏱️ **Đếm ngược tới kỳ thi** trên trang chủ.
- 📝 **Làm đề trực tuyến**: bố cục giống đề thi thật, hỗ trợ 3 loại câu (Trắc nghiệm 4 phương án · Đúng/Sai · Trả lời ngắn).
- 🚩 **Đánh dấu** câu chưa chắc, **bảng câu** cho phép nhảy nhanh.
- 💾 **Tự lưu** tiến trình lên trình duyệt — đóng tab vẫn không mất bài.
- 🧮 **Chấm điểm tự động** theo quy chế THPTQG 2025+ (Phần II tính theo số ý đúng: 1=0,1đ · 2=0,25đ · 3=0,5đ · 4=1,0đ).
- 📤 **Xuất file JSON** kết quả để gửi đi chấm chi tiết / phân tích lỗi sai.

## Cấu trúc thư mục

```
.
├── index.html              # Trang chủ
├── exam.html               # Trang làm bài (param ?id=)
├── assets/                 # CSS + JS (vanilla, không build)
│   ├── style.css
│   ├── common.js
│   ├── index.js
│   └── exam.js
├── exams/
│   ├── manifest.json       # Danh sách đề (NGUỒN duy nhất)
│   ├── demo-minh-hoa/
│   │   └── exam.json
│   └── 2026-05-10/         # Folder theo ngày
│       ├── toan/
│       │   ├── exam.json   # Schema chuẩn
│       │   ├── images/     # Ảnh đề / đáp án gốc
│       │   └── README.md
│       └── gdktpl/
├── NOTES.md                # Ghi chú &amp; lưu ý của John (cập nhật mỗi ngày)
└── README.md
```

## Thêm đề mới mỗi ngày — quy trình ngắn

1. Tạo folder `exams/YYYY-MM-DD/<mon>/` (ví dụ `exams/2026-05-11/toan/`).
2. Bỏ ảnh đề + ảnh đáp án vào `images/` (nén dưới ~500 KB/ảnh nếu được).
3. Soạn `exam.json` theo schema (xem `exams/2026-05-10/toan/README.md` hoặc copy file `demo-minh-hoa/exam.json`).
4. Mở `exams/manifest.json`, thêm 1 entry vào `exams[]` với `id`, `subject`, `date`, `duration_minutes`, `path`, `status: "ready"`.
5. Commit + push. GitHub Pages tự cập nhật trong ~1 phút.

> **Quy ước `id`:** `YYYY-MM-DD-<mon>` (ví dụ `2026-05-10-toan`). 3 đoạn đầu là ngày, các đoạn sau là slug môn — exam.js dùng để tự suy ra đường dẫn ảnh.

## Schema `exam.json` (rút gọn)

```jsonc
{
  "id": "2026-05-10-toan",
  "subject": "Toán",
  "date": "2026-05-10",
  "duration_minutes": 90,
  "source": "Đề số ... / Trường ...",
  "scoring": {
    "multiple_choice_per_question": 0.25,
    "true_false_rules": [0, 0.1, 0.25, 0.5, 1.0],
    "short_answer_per_question": 0.5
  },
  "parts": [
    { "id": "I", "type": "multiple_choice", "title": "Phần I. ...",
      "questions": [
        { "id": 1, "stem": "...", "image": "images/cau1.jpg",
          "options": ["...", "...", "...", "..."],
          "answer": "B", "explanation": "..." }
      ] },
    { "id": "II", "type": "true_false", "title": "Phần II. ...",
      "questions": [
        { "id": 1, "stem": "...", "items": [
          { "id": "a", "text": "...", "answer": true,  "explanation": "..." },
          { "id": "b", "text": "...", "answer": false, "explanation": "..." }
        ] }
      ] },
    { "id": "III", "type": "short_answer", "title": "Phần III. ...",
      "questions": [ { "id": 1, "stem": "...", "answer": "0.25", "explanation": "..." } ] }
  ]
}
```

## Bật GitHub Pages

Trong repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` (root)**. URL sẽ là `https://tinnguyen1997.github.io/NgocHa-THPTQG-2026/`.

File `.nojekyll` ở repo gốc đã tắt xử lý Jekyll cho bộ ký tự gốc / đường dẫn có dấu gạch dưới.

## Phát triển local

Site là HTML/CSS/JS thuần, không cần build. Mở:

```bash
python3 -m http.server 8000
# Truy cập http://localhost:8000/
```

(Không nên mở trực tiếp `index.html` qua `file://` vì JS dùng `fetch()` để tải `manifest.json`.)

## Ghi chú

Xem [`NOTES.md`](NOTES.md) cho các yêu cầu &amp; lưu ý cập nhật theo ngày.
