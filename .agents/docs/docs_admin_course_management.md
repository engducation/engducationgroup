# Nghiep vu quan ly khoa hoc (Role Admin)

Tai lieu nay chi mo ta nghiep vu. Khong de cap den cong nghe, cong cu, hay ky thuat trien khai.

## Pham vi

- Tao khoa hoc
- Quan ly khoa hoc (day du thong tin)
- Quan ly noi dung tung chuong hoc
- Tao bai hoc: text, video
- Tao quiz cau hoi
- Quan ly tu vung
- Bai tap writing

## Doi tuong su dung

- Admin: quan ly toan bo khoa hoc va noi dung hoc tap

## Dinh nghia ngan

- Khoa hoc: tap hop cac chuong hoc
- Chuong hoc: tap hop cac bai hoc, quiz, tu vung, writing
- Bai hoc: don vi kien thuc (text hoac video)
- Quiz: tap cau hoi kiem tra
- Tu vung: danh sach tu vung theo chuong hoac khoa hoc
- Writing: bai tap tu luan co yeu cau nop bai

---

# 1) Tao khoa hoc

## Chuc nang

- Tao khoa hoc moi
- Luu du thao
- Cong bo khoa hoc

## Thong tin can thiet

- Ten khoa hoc
- Mo ta ngan
- Mo ta chi tiet
- Muc tieu hoc tap
- Doi tuong phu hop
- Cap do
- Ngon ngu
- Anh dai dien
- Gia (neu co)
- Chinh sach/ghi chu
- Trang thai: nhap (draft), cong bo (published), tam dung (paused)

## Normal flow

1. Admin chon tao khoa hoc moi.
2. He thong hien form nhap thong tin.
3. Admin nhap day du thong tin bat buoc.
4. Admin luu du thao.
5. Admin xem truoc noi dung (preview).
6. Admin cong bo khoa hoc.
7. He thong ghi nhan khoa hoc o trang thai cong bo.

## Alternative flow

- A1: Luu du thao nhieu lan truoc khi cong bo.
- A2: Cong bo sau khi da them chuong hoc va noi dung.
- A3: Huy thao tac, khong tao khoa hoc.

## Exception flow

- E1: Thieu thong tin bat buoc -> thong bao loi, khong cho luu.
- E2: Trung ten khoa hoc trong cung pham vi quy dinh -> thong bao de admin doi ten.
- E3: Gia hoac thong tin khong hop le -> thong bao, yeu cau sua.

---

# 2) Quan ly khoa hoc (day du thong tin)

## Chuc nang

- Xem danh sach khoa hoc
- Tim kiem, loc, sap xep
- Xem chi tiet khoa hoc
- Cap nhat thong tin
- Doi trang thai (draft/published/paused)
- Gan danh muc/chu de
- Quan ly hinh anh, tai nguyen
- Xoa khoa hoc

## Normal flow

1. Admin vao danh sach khoa hoc.
2. Admin tim kiem/loc theo tieu chi (cap do, trang thai, chu de).
3. Admin mo chi tiet khoa hoc.
4. Admin cap nhat thong tin can thiet.
5. Admin luu thay doi.
6. He thong cap nhat noi dung va trang thai.

## Alternative flow

- A1: Tam dung khoa hoc trong giai doan cap nhat.
- A2: Sao chep khoa hoc lam ban nhap moi.
- A3: Doi gia/ghi chu/anh dai dien ma khong doi noi dung hoc tap.

## Exception flow

- E1: Khoa hoc dang cong bo co hoc vien dang hoc -> khong cho xoa, chi cho tam dung.
- E2: Thong tin khong hop le -> thong bao va yeu cau sua.
- E3: Khong du quyen thao tac -> thong bao tu choi.

---

# 3) Quan ly chuong hoc trong khoa hoc

## Chuc nang

- Tao, sua, xoa chuong hoc
- Sap xep thu tu chuong
- Cong bo/tam dung rieng tung chuong
- Gan noi dung hoc tap cho chuong

## Thong tin can thiet

- Ten chuong
- Mo ta
- Thu tu
- Trang thai

## Normal flow

1. Admin mo khoa hoc -> quan ly chuong hoc.
2. Admin tao chuong moi va nhap thong tin.
3. Admin luu chuong.
4. Admin sap xep thu tu chuong.
5. Admin gan noi dung hoc tap cho chuong.

## Alternative flow

- A1: Tao chuong rong, them noi dung sau.
- A2: Tao nhieu chuong roi sap xep lai.

## Exception flow

- E1: Chuong chua co ten -> thong bao loi.
- E2: Thu tu khong hop le -> thong bao va tu dong dieu chinh neu co the.

---

# 4) Tao bai hoc dang text

## Chuc nang

- Tao bai text
- Sua bai text
- Preview noi dung text

## Thong tin can thiet

- Tieu de bai hoc
- Noi dung text
- Thu tu trong chuong
- Trang thai

## Normal flow

1. Admin chon chuong hoc.
2. Admin tao bai hoc text.
3. Admin nhap tieu de va noi dung.
4. Admin luu.
5. He thong hien bai trong danh sach bai hoc cua chuong.

## Alternative flow

- A1: Luu nhap, hoan thien sau.
- A2: Chuyen bai hoc sang trang thai tam dung.

## Exception flow

- E1: Noi dung rong -> thong bao loi.
- E2: Tieu de trung trong cung chuong -> canh bao va yeu cau doi tieu de.

---

# 5) Tao bai hoc dang video

## Chuc nang

- Tao bai video
- Sua bai video
- Gan tai nguyen kem theo

## Thong tin can thiet

- Tieu de bai hoc
- Duong dan video hoac tai nguyen video
- Mo ta ngan
- Thu tu trong chuong
- Trang thai

## Normal flow

1. Admin chon chuong hoc.
2. Admin tao bai hoc video.
3. Admin nhap tieu de, mo ta, tai nguyen video.
4. Admin luu.
5. He thong hien bai trong danh sach bai hoc.

## Alternative flow

- A1: Luu nhap, bo sung video sau.
- A2: Gan tai nguyen bo sung (tai lieu, bai tap).

## Exception flow

- E1: Thieu video -> thong bao loi.
- E2: Video khong hop le -> thong bao va yeu cau cap nhat.

---

# 6) Tao quiz cau hoi

## Chuc nang

- Tao quiz cho chuong hoc
- Them cau hoi
- Chinh sua dap an
- Thiet lap tieu chi dat

## Thong tin can thiet

- Ten quiz
- Danh sach cau hoi (noi dung, lua chon, dap an dung)
- Diem dat hoac ti le dat
- Thu tu trong chuong
- Trang thai

## Normal flow

1. Admin chon chuong hoc.
2. Admin tao quiz.
3. Admin them cau hoi va dap an.
4. Admin thiet lap tieu chi dat.
5. Admin luu quiz.
6. He thong ghi nhan quiz trong chuong.

## Alternative flow

- A1: Luu quiz khi chua day du cau hoi (ban nhap).
- A2: Cap nhat tieu chi dat sau khi da co du lieu lam bai.

## Exception flow

- E1: Cau hoi thieu dap an dung -> thong bao loi.
- E2: Khong co cau hoi nao -> khong cho cong bo quiz.

---

# 7) Quan ly tu vung

## Chuc nang

- Tao danh sach tu vung cho chuong
- Cap nhat tu vung
- Sap xep va phan loai

## Thong tin can thiet

- Tu vung
- Nghia
- Vi du su dung
- Tu loai (neu co)
- Thu tu trong chuong
- Trang thai

## Normal flow

1. Admin chon chuong hoc.
2. Admin them tu vung (mot hoac nhieu).
3. Admin nhap thong tin chi tiet.
4. Admin luu danh sach.

## Alternative flow

- A1: Nhap nhanh danh sach tu vung, bo sung chi tiet sau.
- A2: Gan tu vung vao nhieu chuong neu quy dinh cho phep.

## Exception flow

- E1: Thieu tu vung hoac nghia -> thong bao loi.

---

# 8) Bai tap writing

## Chuc nang

- Tao de bai writing
- Thiet lap tieu chi cham
- Quan ly trang thai (mo/ dong nhan bai)

## Thong tin can thiet

- Tieu de bai tap
- De bai (yeu cau)
- Tieu chi cham/huong dan
- Han nop (neu co)
- Thu tu trong chuong
- Trang thai

## Normal flow

1. Admin chon chuong hoc.
2. Admin tao bai tap writing.
3. Admin nhap de bai va tieu chi cham.
4. Admin luu bai tap.
5. He thong hien bai tap trong danh sach chuong.

## Alternative flow

- A1: Khong dat han nop.
- A2: Mo/ dong nhan bai theo dot.

## Exception flow

- E1: De bai trong -> thong bao loi.
- E2: Han nop khong hop le -> thong bao va yeu cau sua.

---

# 9) Quy tac chung va rang buoc

## Chuc nang

- Kiem tra day du thong tin bat buoc
- Kiem soat trang thai noi dung
- Sap xep thu tu

## Normal flow

1. Admin tao noi dung bat ky.
2. He thong kiem tra thong tin bat buoc.
3. He thong luu va hien thi theo thu tu.

## Alternative flow

- A1: Noi dung o trang thai nhap, khong hien thi ra ngoai neu chua cong bo.

## Exception flow

- E1: Xung dot thu tu -> he thong canh bao va de nghi sap xep lai.
- E2: Du lieu khong hop le -> tu choi luu.

