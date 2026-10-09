// The built-in "related apps" list. The owner can replace it for everyone from the admin console (see utils/siteConfig.ts).

export interface RelatedApp {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  description: string;
}

export const defaultApps: RelatedApp[] = [
  {
    id: "app-1",
    name: "Từ Điển Anh - Việt Tra Cứu Nhanh",
    url: "https://dict.laban.vn",
    icon: "📖",
    category: "Học ngoại ngữ",
    description: "Tra cứu từ vựng tiếng Anh, phiên âm chuẩn quốc tế IPA và ví dụ câu phong phú."
  },
  {
    id: "app-2",
    name: "Luyện Phát Âm Với YouGlish",
    url: "https://youglish.com",
    icon: "🎬",
    category: "Học ngoại ngữ",
    description: "Nghe người bản xứ phát âm từ vựng trong hàng triệu video YouTube thực tế."
  },
  {
    id: "app-3",
    name: "Pomodoro Focus Timer",
    url: "https://pomofocus.io",
    icon: "⏱️",
    category: "Năng suất",
    description: "Đồng hồ đếm ngược 25 phút Pomodoro giúp tập trung tối đa khi ôn thẻ từ vựng."
  },
  {
    id: "app-4",
    name: "Google Dịch (Google Translate)",
    url: "https://translate.google.com",
    icon: "🌐",
    category: "Công cụ",
    description: "Dịch nhanh văn bản, đoạn hội thoại và phát âm chuẩn đa ngôn ngữ."
  },
  {
    id: "app-5",
    name: "Notion Ghi Chú Học Tập",
    url: "https://notion.so",
    icon: "📝",
    category: "Năng suất",
    description: "Hệ thống quản lý tài liệu, ngữ pháp và lập kế hoạch mục tiêu học tập cá nhân."
  }
];
