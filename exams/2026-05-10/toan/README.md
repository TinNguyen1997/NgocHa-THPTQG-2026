# Toán · 10/05/2026

## Cách hoàn thiện đề này

1. Commit ảnh đề thi + đáp án vào thư mục `images/` (đặt tên `de-1.jpg`, `de-2.jpg`, `dap-an.jpg`, …). Nén ảnh dưới ~500 KB/ảnh nếu có thể (`cwebp`/`jpegoptim`).
2. Mở `exam.json`:
   - Điền các câu vào `parts[].questions[]` theo schema.
   - Cập nhật `manifest.json` ở `exams/manifest.json`: đổi `status` từ `pending` sang `ready`.
3. Tuỳ chọn: tạo `analysis.md` cùng thư mục để phân tích đề (lỗi sai hay gặp, dạng bài, v.v.).

## Schema rút gọn

```jsonc
{
  "parts": [
    {
      "id": "I",
      "type": "multiple_choice",
      "questions": [
        { "id": 1, "stem": "Nội dung câu hỏi…", "image": "images/cau1.jpg",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "answer": "B", "explanation": "Vì …" }
      ]
    },
    {
      "id": "II",
      "type": "true_false",
      "questions": [
        { "id": 1, "stem": "Cho hàm số …",
          "items": [
            { "id": "a", "text": "Mệnh đề a)", "answer": true, "explanation": "..." },
            { "id": "b", "text": "Mệnh đề b)", "answer": false }
          ] }
      ]
    },
    {
      "id": "III",
      "type": "short_answer",
      "questions": [
        { "id": 1, "stem": "Tính …", "answer": "0.25", "explanation": "..." }
      ]
    }
  ]
}
```

> Có thể tham khảo file `exams/demo-minh-hoa/exam.json` để xem ví dụ đầy đủ.
