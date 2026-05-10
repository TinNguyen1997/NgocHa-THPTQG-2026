# NOTES — Ghi chú &amp; Lưu ý

> File này là **bộ nhớ chung** cho dự án ôn thi của Ngọc Hà.
> Mỗi ngày John (anh) bổ sung yêu cầu mới ở mục **Ghi chú theo ngày**, Devin sẽ đọc trước mỗi session để khỏi phải nhắc lại.

---

## 1. Mục tiêu

- Trang web ôn thi nước rút **30 ngày cuối** trước kỳ thi **THPTQG 11/06/2026**.
- Học viên: **Ngọc Hà**.
- Hosting: **GitHub Pages** ở `https://tinnguyen1997.github.io/NgocHa-THPTQG-2026/`.
- Nguyên tắc kỹ thuật: **Nhẹ nhất có thể.** HTML/CSS/JS thuần, không build, không framework nặng. Nội dung đề thi là JSON tĩnh + ảnh tối ưu.

## 2. Yêu cầu đã chốt từ John

- Bố cục **giống một đề thi thật**, hỗ trợ 3 loại câu (TN 4 phương án · Đúng/Sai · Trả lời ngắn) theo chuẩn THPTQG 2025+.
- Có **đếm ngược thời gian**, **đánh dấu câu** chưa chắc.
- **Nộp bài** → chấm tự động + **xuất file kết quả** (JSON) để gửi đi chấm chi tiết.
- Lưu ý các yêu cầu của John ở chính file này, **mỗi ngày bổ sung thêm**.
- Cấu trúc **đơn giản nhưng dễ mở rộng**, ưu tiên hoàn thành sớm hơn là cầu kỳ.

## 3. Quy ước &amp; lưu ý kỹ thuật

### 3.1 Đặt tên &amp; cấu trúc
- Mỗi ngày một folder `exams/YYYY-MM-DD/<mon>/` (slug môn: `toan`, `gdktpl`, `vat-li`, `hoa-hoc`, `sinh-hoc`, `ngu-van`, `tieng-anh`, `lich-su`, `dia-li`, `tin-hoc`, `cong-nghe`).
- `id` đề = `YYYY-MM-DD-<mon>`. Code dùng `id` để suy ra đường dẫn — không đặt id khác cấu trúc này.
- Mỗi đề có `exam.json` + `images/` + `README.md` (tuỳ chọn `analysis.md`).

### 3.2 Tối ưu kích thước repo (giới hạn GitHub free)
- GitHub Pages free: 1 GB lưu trữ + 100 GB băng thông/tháng. Khá thoải mái.
- Hard limit: 100 MB / file, khuyến nghị repo &lt; 1 GB.
- **Ảnh đề**: nén `.webp` hoặc `.jpg` chất lượng ~75%. Mục tiêu &lt; 500 KB/ảnh, lý tưởng &lt; 200 KB.
  - Lệnh nhanh: `cwebp -q 75 input.png -o output.webp` hoặc `jpegoptim --max=80 *.jpg`.
- **Không** commit file PDF hay ảnh quét nguyên gốc nếu &gt; 1 MB. Tách trang &amp; nén trước khi push.
- Khi đề ổn rồi, có thể xoá ảnh gốc, chỉ giữ ảnh đã nén.

### 3.3 Schema `exam.json`
- Xem `README.md` mục Schema. **Không** đổi tên field — code expect đúng tên.
- `answer` của TN ghi bằng chữ in hoa: `"A"`, `"B"`, `"C"`, `"D"`.
- `answer` của Đúng/Sai ghi `true`/`false` (boolean).
- `answer` của Trả lời ngắn ghi string. Code chuẩn hoá: bỏ khoảng trắng, lowercase, đổi `,` → `.`.
- Mỗi câu nên có `explanation` để khi chấm xong Ngọc Hà đọc được.

### 3.4 GitHub Pages
- File `.nojekyll` ở root đã có — đừng xoá.
- Mọi đường dẫn dùng tương đối (không `/foo`, dùng `assets/foo` hoặc `exams/foo`).
- Cập nhật mất 30s–2 phút sau khi push lên `main`.

## 4. Đề xuất nâng cấp (cho John quyết)

Nếu muốn đầu tư mạnh hơn cho 30 ngày nước rút, đây là các option theo thứ tự **tỷ lệ giá trị / chi phí**:

| # | Hạng mục | Chi phí | Giá trị |
|---|---|---|---|
| 1 | **Cloudflare Pages** thay GitHub Pages | Miễn phí | Băng thông không giới hạn, build nhanh hơn, custom domain dễ |
| 2 | **Tích hợp AI chấm bài tự động** (OpenAI/Claude API) | ~$5–20/tháng | Chấm chi tiết phần tự luận, tìm lỗ hổng kiến thức, sinh đề tương tự |
| 3 | **Database lưu tiến độ chéo thiết bị** (Supabase / Firebase free tier) | Miễn phí | Ngọc Hà làm máy này, xem lại máy khác. Hiện chỉ lưu trên trình duyệt |
| 4 | **Nhúng MathJax / KaTeX** để hiển thị công thức Toán đẹp | Miễn phí | Đề Toán có công thức sẽ trông như sách giáo khoa thay vì plain text |
| 5 | **Dashboard phân tích lỗi sai** (sinh từ lịch sử) | Miễn phí | Heatmap dạng câu hay sai, tự đề xuất ôn lại |
| 6 | **Tên miền riêng** (`ngocha-2026.com` hoặc tương tự) | ~200k/năm | Dễ nhớ, share cho bạn cùng ôn |

> Khi John quyết món nào, chỉ cần ghi vào mục **Ghi chú theo ngày** bên dưới, Devin sẽ triển.

## 5. Cách workflow mỗi ngày (suggest)

1. **Sáng**: anh chụp ảnh / scan đề + đáp án, commit lên `exams/YYYY-MM-DD/<mon>/images/`.
2. Mở session Devin: "Hãy tạo đề ngày X môn Y từ ảnh trong folder Z, set status ready".
3. **Devin**: OCR / transcribe đề thành `exam.json`, viết `analysis.md`, cập nhật manifest, push.
4. **Chiều/tối**: Ngọc Hà mở web làm bài, nộp, tải file JSON kết quả gửi lại.
5. **Tối**: anh commit file kết quả vào `results/YYYY-MM-DD/<mon>.json` (sẽ thiết kế folder này khi cần) → session Devin tiếp theo phân tích lỗi sai &amp; sinh dạng tương tự.

## 6. Ghi chú theo ngày

### 2026-05-10 (ngày khởi tạo)

- Khởi tạo repo + trang web (vanilla, không build).
- Tạo placeholder cho 2 đề Toán + GDKT&amp;PL ngày hôm nay (status `pending`, chờ ảnh).
- John sẽ commit ảnh đề + đáp án sau, Devin sẽ chuyển thành `exam.json` ở session kế tiếp.
- TODO: kích hoạt GitHub Pages trong Settings (chỉ cần làm 1 lần).
