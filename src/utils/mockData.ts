import { CollectionItem } from "types";

export const initialCollections: CollectionItem[] = [
  {
    id: "coll-daily-english",
    name: "Tiếng Anh Giao Tiếp Hàng Ngày",
    pathname: "tieng-anh-giao-tiep-hang-ngay",
    description: "Các mẫu câu và từ vựng thông dụng nhất trong giao tiếp đời sống hàng ngày.",
    category: "Giao tiếp",
    color: "#3b82f6",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    words: [
      {
        id: "w-1",
        source: "Long time no see!",
        target: "Lâu rồi không gặp bạn!",
        phonetic: "/lɔːŋ taɪm noʊ siː/",
        example: "Hey John! Long time no see, how have you been?",
        status: "mastered",
        starred: true,
        reviewCount: 4,
        lastReviewed: Date.now() - 3600000 * 12
      },
      {
        id: "w-2",
        source: "Could you do me a favor?",
        target: "Bạn có thể giúp tôi một việc được không?",
        phonetic: "/kʊd juː duː miː ə ˈfeɪvər/",
        example: "Excuse me, could you do me a favor and hold the elevator?",
        status: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewed: Date.now() - 3600000 * 5
      },
      {
        id: "w-3",
        source: "Make yourself at home",
        target: "Cứ tự nhiên như ở nhà nhé",
        phonetic: "/meɪk jʊərˈsɛlf æt hoʊm/",
        example: "Welcome to my apartment! Come in and make yourself at home.",
        status: "mastered",
        starred: false,
        reviewCount: 3,
        lastReviewed: Date.now() - 3600000 * 20
      },
      {
        id: "w-4",
        source: "It's on the tip of my tongue",
        target: "Tôi nhớ mang máng nhưng chưa kịp nhớ ra ngay",
        phonetic: "/ɪts ɑːn ðə tɪp əv maɪ tʌŋ/",
        example: "Her name is on the tip of my tongue, give me a second!",
        status: "learning",
        starred: true,
        reviewCount: 1,
        lastReviewed: Date.now() - 3600000 * 48
      },
      {
        id: "w-5",
        source: "Never mind",
        target: "Đừng bận tâm / Không sao đâu",
        phonetic: "/ˈnɛvər maɪnd/",
        example: "I found my keys already, so never mind!",
        status: "new",
        starred: false,
        reviewCount: 0
      },
      {
        id: "w-6",
        source: "Catch you later!",
        target: "Hẹn gặp lại bạn sau nhé!",
        phonetic: "/kætʃ juː ˈleɪtər/",
        example: "I have to rush to the meeting now. Catch you later!",
        status: "new",
        starred: false,
        reviewCount: 0
      }
    ]
  },
  {
    id: "coll-tech-dev",
    name: "Từ Vựng Lập Trình & CNTT",
    pathname: "tu-vung-lap-trinh-cntt",
    description: "Thuật ngữ chuyên ngành khoa học máy tính, frontend, backend và thuật toán.",
    category: "Công nghệ",
    color: "#10b981",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now(),
    words: [
      {
        id: "tech-1",
        source: "Asynchronous",
        target: "Bất đồng bộ (không chặn luồng thực thi chính)",
        phonetic: "/eɪˈsɪŋkrənəs/",
        example: "JavaScript uses asynchronous operations to handle network requests efficiently.",
        status: "mastered",
        starred: true,
        reviewCount: 5,
        lastReviewed: Date.now() - 3600000 * 6
      },
      {
        id: "tech-2",
        source: "Idempotent",
        target: "Tính lũy đẳng (thực hiện nhiều lần cho kết quả giống hệt lần đầu)",
        phonetic: "/ˌaɪdəmˈpoʊtənt/",
        example: "HTTP GET and PUT methods are designed to be idempotent.",
        status: "learning",
        starred: true,
        reviewCount: 2,
        lastReviewed: Date.now() - 3600000 * 18
      },
      {
        id: "tech-3",
        source: "Memoization",
        target: "Kỹ thuật ghi nhớ kết quả hàm đã tính toán để tránh tính lại",
        phonetic: "/ˌmɛmoʊaɪˈzeɪʃən/",
        example: "React's useMemo hook utilizes memoization to avoid expensive recalculations.",
        status: "learning",
        starred: false,
        reviewCount: 2,
        lastReviewed: Date.now() - 3600000 * 24
      },
      {
        id: "tech-4",
        source: "Polymorphism",
        target: "Tính đa hình trong lập trình hướng đối tượng (OOP)",
        phonetic: "/ˌpɑːliˈmɔːrfɪzəm/",
        example: "Polymorphism allows objects of different classes to respond to the same method call.",
        status: "new",
        starred: false,
        reviewCount: 0
      },
      {
        id: "tech-5",
        source: "Concurrency",
        target: "Tính đồng thời (xử lý nhiều tác vụ cùng một khoảng thời gian)",
        phonetic: "/kənˈkɜːrənsi/",
        example: "Go language is renowned for its lightweight concurrency model with goroutines.",
        status: "new",
        starred: false,
        reviewCount: 0
      }
    ]
  },
  {
    id: "coll-idioms",
    name: "Thành Ngữ & Cụm Từ Hay",
    pathname: "thanh-ngu-cum-tu-hay",
    description: "Các idioms tiếng Anh thú vị giúp nói chuyện tự nhiên như người bản xứ.",
    category: "Thành ngữ",
    color: "#8b5cf6",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    words: [
      {
        id: "idm-1",
        source: "Piece of cake",
        target: "Dễ như ăn kẹo / Dễ như trở bàn tay",
        phonetic: "/piːs əv keɪk/",
        example: "Don't worry about the driving test, it's a piece of cake!",
        status: "mastered",
        starred: false,
        reviewCount: 4,
        lastReviewed: Date.now() - 3600000 * 8
      },
      {
        id: "idm-2",
        source: "Bite the bullet",
        target: "Cắn răng chịu đựng / Can đảm đối mặt với thử thách khó khăn",
        phonetic: "/baɪt ðə ˈbʊlɪt/",
        example: "I decided to bite the bullet and talk to my manager about a raise.",
        status: "learning",
        starred: true,
        reviewCount: 1,
        lastReviewed: Date.now() - 3600000 * 30
      },
      {
        id: "idm-3",
        source: "Once in a blue moon",
        target: "Hiếm khi / Năm thì mười họa mới xảy ra",
        phonetic: "/wʌns ɪn ə bluː muːn/",
        example: "My brother lives abroad, so I only get to see him once in a blue moon.",
        status: "new",
        starred: true,
        reviewCount: 0
      },
      {
        id: "idm-4",
        source: "Break the ice",
        target: "Phá vỡ bầu không khí ngượng ngùng lúc ban đầu",
        phonetic: "/breɪk ði aɪs/",
        example: "He told a joke to break the ice at the start of the presentation.",
        status: "new",
        starred: false,
        reviewCount: 0
      }
    ]
  }
];

export default initialCollections;
