# Dự án: Bể cá 3D (Three.js) — Ghi chú tiến độ

Mục đích: Dự án nghiên cứu/học tập, mô phỏng bể cá 3D chạy trên trình duyệt,
dùng Three.js (CDN miễn phí, không cần đăng ký gói). Xây theo từng bước nhỏ,
mỗi bước là 1 file HTML độc lập, có thể mở trực tiếp bằng trình duyệt để kiểm tra
trước khi làm bước tiếp theo.

## Kế hoạch 6 bước
1. [x] Bể cá cơ bản — hộp kính trong suốt, nền sỏi/cát, ánh sáng xanh nước nhẹ, OrbitControls
2. [x] Trang trí nền — san hô cành, san hô khối tròn gai, vỏ ốc xoắn, đá/sỏi lớn
3. [x] Cá bơi động — 5-8 con cá low-poly, 2 loại (cá vàng cam, cá sọc đen-cam), bơi theo đường cong ngẫu nhiên + vẫy đuôi
4. [x] Hiệu ứng nước — bong bóng khí (particle), caustics hắt sáng, nền tối kiểu đáy đại dương
5. [x] Tương tác — click cá để cá bơi theo chuột, nút thêm/bớt cá, nút ngày/đêm
6. [x] Tối ưu & đóng gói — gộp 1 file HTML, chạy offline bằng cách mở file, CDN miễn phí cho Three.js

## Quy ước
- Mỗi bước lưu thành file riêng: `step1.html`, `step2.html`, ... để dễ so sánh/rollback.
- Dùng Three.js qua CDN (unpkg hoặc jsdelivr) — bản r160+ dùng ES modules (importmap).
- Kiểm tra mỗi bước bằng Node (kiểm tra cú pháp JS) trước khi báo hoàn thành.
- File cuối cùng (bước 6) là bản gộp, chạy được khi mở trực tiếp (double-click), không cần server.

## Nhật ký thay đổi
- 2026-11-22: Tạo dự án, viết kế hoạch 6 bước.
- 2026-11-22: Hoàn thành `step1.html` — bể kính (MeshPhysicalMaterial, transmission),
  nền cát/sỏi nhấp nhô nhẹ (PlaneGeometry biến dạng ngẫu nhiên), ánh sáng xanh nước
  (ambient + directional + point light xanh lam), mặt nước, OrbitControls giới hạn
  góc nhìn (không lật xuống dưới sàn). Đã kiểm tra cú pháp JS bằng `node --check` —
  OK, không lỗi. Dùng Three.js r160 qua CDN jsdelivr (ES module + importmap).
  Lưu ý khi mở: cần có internet để tải Three.js từ CDN (file mở offline hoàn toàn
  sẽ không hiển thị được vì thiếu thư viện).
- 2026-11-22: Hoàn thành `step2.html` (kế thừa toàn bộ step1) — thêm nhóm `decor`:
  * San hô cành (branch coral): hàm đệ quy `buildCoralBranch` dựng cây nhánh từ
    CylinderGeometry thon dần, màu trắng ngà — 2 cụm đặt bên trái bể.
  * San hô khối gai (brain coral): IcosahedronGeometry bậc 3, làm nhăn bề mặt bằng
    hàm sin/cos để tạo rãnh như san hô não, màu xám trắng — 2 khối ở giữa.
  * Vỏ ốc xoắn: dựng từ CatmullRomCurve3 theo công thức xoắn ốc (bán kính giảm
    dần theo chiều cao) + TubeGeometry, thêm chóp nón ở đỉnh — đặt nghiêng bên
    phải-giữa.
  * Đá lớn: IcosahedronGeometry bậc 1 làm méo ngẫu nhiên từng đỉnh (5 tảng, giữa
    và phải) + 18 viên sỏi nhỏ rải ngẫu nhiên toàn nền.
  * Đã kiểm tra không có vật thể nào lòi ra ngoài thành kính (so khớp tọa độ với
    TANK.width/depth) và kiểm tra cú pháp JS bằng `node --check` — OK.
- 2026-11-22: Hoàn thành `step3.html` (kế thừa step1+step2) — thêm 7 con cá bơi động:
  * Thân cá dựng bằng `LatheGeometry` (quay 1 đường profile quanh trục) rồi ép dẹt
    theo trục X — tạo khối bầu thon 2 đầu, low-poly (10 lát cắt), nhẹ cho hiệu năng.
  * 2 loại: `gold` (4 con, màu cam vàng, thân trơn) và `clown` (3 con, màu cam đậm +
    2 vòng sọc trắng viền đen quanh thân bằng CylinderGeometry `openEnded`).
  * Vây: vây đuôi gắn vào 1 `tailPivot` riêng để xoay vẫy (rotation.z dao động theo
    sin, tốc độ vẫy tỉ lệ thuận tốc độ bơi, mỗi con lệch pha ngẫu nhiên); vây lưng +
    2 vây ngực đơn giản bằng ConeGeometry ép phẳng.
  * Class `Fish`: bơi theo kiểu "wander" — chọn 1 điểm đích ngẫu nhiên trong bể, dùng
    `lerp` vào vận tốc mong muốn (easing) nên đường bơi cong mềm mại chứ không gãy
    khúc; khi gần tới đích (<0.35) thì chọn đích mới; hướng thân cá xoay theo vận tốc
    bằng quaternion (`setFromUnitVectors` + `slerp`).
  * Vòng lặp dùng `THREE.Clock` để tính `dt` thực tế (mượt, không phụ thuộc FPS), có
    chặn dt tối đa 0.05s để tránh "nhảy" khi tab bị ẩn rồi mở lại.
  * Đã kiểm tra `SWIM_BOUNDS` (vùng cá được phép bơi) nằm gọn trong lòng bể, không
    chui ra ngoài thành kính; kiểm tra cú pháp JS bằng `node --check` — OK.
- 2026-11-22: Hoàn thành `step4.html` (kế thừa step1+step2+step3) — thêm hiệu ứng nước:
  * Nền tối kiểu đáy đại dương: đổi `scene.background` sang `#020c18` kết hợp
    `THREE.FogExp2(0x020c18, 0.032)` và bổ sung `depthGlow` PointLight xanh ngọc.
  * Caustics hắt sáng: phủ một mesh dùng chung `floorGeo` (nhích cao `0.008`) với
    `ShaderMaterial` (`AdditiveBlending`, `depthWrite: false`) tạo mạng lưới ánh
    sáng khúc xạ chuyển động trên nền cát, dịu dần ở mép kính.
  * Mặt nước gợn sóng nhẹ: tăng phân chia lưới `waterTopGeo` (`28x18`) và cập nhật
    cao độ đỉnh theo hàm sin/cos mỗi frame.
  * Tia sáng xuyên nước (god rays): 3 hình nón trụ hở đầu dùng `AdditiveBlending`
    nhấp nháy opacity nhẹ từ mặt nước xuống.
  * Bong bóng khí: `THREE.Points` (140 hạt) dùng texture vẽ từ Canvas (viền sáng +
    điểm lóe specular), nổi lên từ các cụm nguồn ở đáy (gần san hô, vỏ ốc, đá)
    với dao động lắc ngang theo sin/cos, giới hạn trong `BUBBLE_BOUNDS`.
  * Đã kiểm tra cú pháp JS bằng `node --input-type=module --check` — OK.
- 2026-11-22: Hoàn thành `step5.html` (kế thừa step1..step4) — thêm tương tác:
  * Click cá để cá bơi theo chuột: dùng `THREE.Raycaster` trên sự kiện `pointerup`
    (phân biệt với thao tác kéo xoay camera nếu di chuyển <= 6px). Cá được chọn
    phát sáng nhẹ (`emissive`), tăng tốc và bơi theo vị trí con trỏ chiếu lên
    mặt phẳng vuông góc camera (giới hạn trong `SWIM_BOUNDS`), kèm vòng đánh dấu
    3D `cursorMarker`. Click lại vào chính con cá hoặc click ra ngoài để thả tự do.
  * Nút `+ Thêm cá` / `- Bớt cá`: thêm cá ngẫu nhiên (`gold`/`clown`, tối đa 25
    con) hoặc bớt cá (dọn khỏi `scene`, tự bỏ chọn nếu cá đang được dẫn), cập
    nhật bộ đếm `fish-count`.
  * Nút `Chế độ: Đêm / Ngày`: chuyển đổi màu nền, sương mù, cường độ/màu sắc
    `ambient` + `mainLight` + `rimLight` + `depthGlow` và độ sáng caustics/tia
    sáng giữa đáy đại dương tối (`#020c18`) và bể cá ban ngày sáng (`#4ba8cf`).
  * Đã kiểm tra cú pháp JS bằng `node --input-type=module --check` — OK.
- 2026-11-22: Hoàn thành `step6.html` (bản tối ưu & đóng gói hoàn chỉnh):
  * Tối ưu bộ nhớ GPU & GC: dùng chung `FISH_SHARED` (geometry thân, mắt, vây,
    sọc và các material tĩnh) cho mọi con cá, dùng chung `sharedPebbleGeo` cho 18
    viên sỏi; tái sử dụng vector/quaternion tạm (`_toTarget`, `_desired`, `_dir`,
    `_quat`, `_upAxis`) trong `Fish.update` để tránh cấp phát mỗi frame; giải
    phóng `bodyMat.dispose()` khi bớt cá.
  * Đóng gói 1 file HTML duy nhất: toàn bộ shader, texture bong bóng (Canvas),
    logic và UI nằm gọn trong `step6.html`, mở trực tiếp bằng trình duyệt.
  * Bổ sung phím `H` / nút `Ẩn giao diện (H)` để xem bể cá toàn màn hình và
    `#error-banner` thông báo rõ ràng nếu thiếu WebGL hoặc bị chặn CORS.
  * Đã kiểm tra cú pháp JS bằng `node --input-type=module --check` — OK.
- 2026-11-22: Tải Three.js r160 về cục bộ trong `lib/three/` (`three.module.js`,
  `OrbitControls.js`) và cập nhật `importmap` của `step6.html` trỏ sang
  `./lib/three/` để chạy offline không cần Internet (lưu ý: nếu trình duyệt
  chặn CORS với ES module trên `file://`, mở qua local server như
  `python -m http.server`). Đã kiểm tra cú pháp JS bằng `node --input-type=module --check` — OK.
