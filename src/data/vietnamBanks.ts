// Banks that support VietQR (https://vietqr.io). `bin` is the bank's 6-digit identifier, which img.vietqr.io
// accepts as the bank id in the QR image address. Used by the admin console's donation settings.

export interface Bank {
  bin: string;
  code: string; // short code, also accepted by VietQR
  name: string;
}

export const BANKS: Bank[] = [
  { bin: "970436", code: "VCB", name: "Vietcombank (Ngoại thương Việt Nam)" },
  { bin: "970422", code: "MB", name: "MB Bank (Quân Đội)" },
  { bin: "970407", code: "TCB", name: "Techcombank (Kỹ Thương)" },
  { bin: "970418", code: "BIDV", name: "BIDV (Đầu tư và Phát triển)" },
  { bin: "970415", code: "ICB", name: "VietinBank (Công Thương)" },
  { bin: "970405", code: "VBA", name: "Agribank (Nông nghiệp và Phát triển nông thôn)" },
  { bin: "970416", code: "ACB", name: "ACB (Á Châu)" },
  { bin: "970432", code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { bin: "970423", code: "TPB", name: "TPBank (Tiên Phong)" },
  { bin: "970403", code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { bin: "970437", code: "HDB", name: "HDBank (Phát triển TP.HCM)" },
  { bin: "970441", code: "VIB", name: "VIB (Quốc Tế)" },
  { bin: "970443", code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
  { bin: "970448", code: "OCB", name: "OCB (Phương Đông)" },
  { bin: "970426", code: "MSB", name: "MSB (Hàng Hải)" },
  { bin: "970431", code: "EIB", name: "Eximbank (Xuất Nhập Khẩu)" },
  { bin: "970440", code: "SEAB", name: "SeABank (Đông Nam Á)" },
  { bin: "970449", code: "LPB", name: "LPBank (Lộc Phát Việt Nam)" },
  { bin: "970428", code: "NAB", name: "Nam A Bank (Nam Á)" },
  { bin: "970438", code: "BVB", name: "BaoViet Bank (Bảo Việt)" },
  { bin: "970425", code: "ABB", name: "ABBANK (An Bình)" },
  { bin: "970433", code: "VIETBANK", name: "VietBank (Việt Nam Thương Tín)" },
  { bin: "970409", code: "BAB", name: "BacABank (Bắc Á)" },
  { bin: "970430", code: "PGB", name: "PGBank (Xăng dầu Petrolimex)" },
  { bin: "970419", code: "NCB", name: "NCB (Quốc Dân)" },
  { bin: "970429", code: "SCB", name: "SCB (Sài Gòn)" },
  { bin: "970454", code: "VCCB", name: "Viet Capital Bank (Bản Việt)" },
  { bin: "970452", code: "KLB", name: "KienlongBank (Kiên Long)" },
  { bin: "970412", code: "PVCB", name: "PVcomBank (Đại Chúng)" },
  { bin: "970408", code: "GPB", name: "GPBank (Dầu Khí Toàn Cầu)" },
  { bin: "970444", code: "CBB", name: "CBBank (Xây dựng)" },
  { bin: "970414", code: "OCEANBANK", name: "Oceanbank (Đại Dương)" },
  { bin: "970421", code: "VRB", name: "VRB (Liên doanh Việt - Nga)" },
  { bin: "970457", code: "WVN", name: "Woori Bank Việt Nam" },
  { bin: "970424", code: "SHBVN", name: "Shinhan Bank Việt Nam" },
  { bin: "546034", code: "CAKE", name: "CAKE by VPBank" },
  { bin: "546035", code: "UBANK", name: "Ubank by VPBank" },
  { bin: "963388", code: "TIMO", name: "Timo (Ngân hàng số)" },
  { bin: "971005", code: "VIETTELMONEY", name: "Viettel Money" },
  { bin: "971011", code: "VNPTMONEY", name: "VNPT Money" }
];

/** Finds a bank by its BIN or short code (case-insensitive), so settings saved with an older id such as "MB" still match. */
export function findBank(id: string): Bank | undefined {
  const k = id.trim().toLowerCase();
  if (!k) return undefined;
  return BANKS.find((b) => b.bin === k || b.code.toLowerCase() === k);
}
