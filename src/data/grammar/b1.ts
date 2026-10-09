import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// B1: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const B1: GrammarTopic[] = [
  {
    id: "present-perfect-vs-past-simple",
    level: "B1",
    title: "Present perfect vs past simple; for and since",
    titleVi: "Hiện tại hoàn thành và quá khứ đơn; for và since",
    summary: "Hiện tại hoàn thành nói về việc kéo dài đến bây giờ hoặc còn liên quan đến hiện tại. Quá khứ đơn nói về việc đã kết thúc ở thời điểm xác định.",
    rules: [
      {
        title: "Hiện tại hoàn thành với for và since",
        points: ["Việc bắt đầu trong quá khứ và còn tiếp diễn đến nay: I have lived here for five years. She has worked here since 2019.", "for + khoảng thời gian (for three years, for a week); since + mốc thời gian (since 2019, since Monday).", "Hỏi: How long have you known him?"]
      },
      {
        title: "Quá khứ đơn",
        points: ["Việc đã kết thúc và có thời điểm xác định: I lived in Hue for five years (bây giờ không sống ở đó nữa).", "Đi với yesterday, last week, in 2010, two days ago, when ...: không dùng hiện tại hoàn thành với các cụm này."]
      },
      {
        title: "Chọn thì nào",
        points: ["Thời gian chưa kết thúc (today, this week, this year): có thể dùng hiện tại hoàn thành. I’ve seen him today.", "Nhấn kết quả ở hiện tại: I’ve lost my phone (và bây giờ chưa tìm thấy)."]
      }
    ],
    examples: [
      { en: "I have lived here for five years.", vi: "Tôi đã sống ở đây được năm năm (và vẫn sống)." },
      { en: "She has worked here since 2019.", vi: "Cô ấy làm việc ở đây từ năm 2019." },
      { en: "How long have you known him?", vi: "Bạn biết anh ấy bao lâu rồi?" },
      { en: "I lived in Hue for five years.", vi: "Tôi từng sống ở Huế năm năm (giờ không còn)." },
      { en: "I lost my phone yesterday.", vi: "Hôm qua tôi làm mất điện thoại." }
    ],
    mistakes: [
      { wrong: "I live here since 2019.", right: "I have lived here since 2019.", why: "Việc kéo dài từ quá khứ đến nay dùng hiện tại hoàn thành." },
      { wrong: "I have known him since three years.", right: "I have known him for three years.", why: "Khoảng thời gian dùng for, mốc thời gian mới dùng since." },
      { wrong: "I have lost my keys yesterday.", right: "I lost my keys yesterday.", why: "Có yesterday thì dùng quá khứ đơn." }
    ],
    exercises: [
      c("I have lived here ___ 2018.", ["for", "since", "from", "during"], 1, "2018 là mốc thời gian nên dùng since."),
      c("She has worked at the bank ___ three years.", ["for", "since", "ago", "during"], 0, "Three years là khoảng thời gian nên dùng for."),
      c("How long ___ you known him?", ["did", "have", "do", "are"], 1, "Hỏi việc kéo dài đến nay dùng have you known."),
      c("I ___ my phone yesterday. I bought a new one.", ["lost", "have lost", "lose", "am losing"], 0, "Có yesterday nên dùng quá khứ đơn."),
      c("We ___ in Hue for five years, but now we live in Hanoi.", ["have lived", "lived", "live", "are living"], 1, "Việc đã kết thúc nên dùng quá khứ đơn."),
      f("He ___ ill since Monday. (be)", ["has been", "'s been"], "Since + mốc thời gian đi với hiện tại hoàn thành.", "be"),
      f("I haven't seen her ___ last week. (for / since)", ["since"], "Last week là mốc thời gian nên dùng since.", "for / since"),
      f("They ___ to Hanoi in 2015. (move)", ["moved"], "In 2015 là thời điểm xác định nên dùng quá khứ đơn.", "move"),
      o("Tôi đã sống ở đây được năm năm.", "I have lived here for five years.", "have + V3 + for + khoảng thời gian.", ["For five years I have lived here."]),
      o("Cô ấy làm việc ở đây từ năm 2019.", "She has worked here since 2019.", "has + V3 + since + mốc thời gian.", ["Since 2019 she has worked here."])
    ]
  },
  {
    id: "past-continuous",
    level: "B1",
    title: "Past continuous and past simple",
    titleVi: "Quá khứ tiếp diễn và quá khứ đơn",
    summary: "Quá khứ tiếp diễn miêu tả việc đang diễn ra tại một thời điểm trong quá khứ, thường làm nền cho một việc ngắn hơn bị xen vào.",
    rules: [
      {
        title: "Hình thức và cách dùng",
        points: ["was / were + V-ing: At eight last night I was watching TV.", "Phủ định: wasn’t / weren’t + V-ing. Hỏi: What were you doing?"]
      },
      {
        title: "Việc dài và việc ngắn",
        points: ["Việc đang diễn ra (quá khứ tiếp diễn) bị việc ngắn (quá khứ đơn) xen vào: I was cooking when she called.", "when thường đi với việc ngắn, while thường đi với việc đang diễn ra: While I was studying, the lights went out.", "Hai việc diễn ra song song: While I was cooking, he was playing games."]
      },
      {
        title: "Lưu ý",
        points: ["Động từ trạng thái (know, like, want) vẫn dùng quá khứ đơn."]
      }
    ],
    examples: [
      { en: "At 8 p.m. I was watching TV.", vi: "Lúc 8 giờ tối tôi đang xem tivi." },
      { en: "I was cooking when she called.", vi: "Tôi đang nấu ăn thì cô ấy gọi." },
      { en: "While I was studying, the lights went out.", vi: "Trong lúc tôi đang học thì mất điện." },
      { en: "They were playing football when it started to rain.", vi: "Họ đang chơi bóng thì trời bắt đầu mưa." },
      { en: "What were you doing at ten?", vi: "Lúc mười giờ bạn đang làm gì?" }
    ],
    mistakes: [
      { wrong: "While I watched TV, the phone rang.", right: "While I was watching TV, the phone rang.", why: "Việc đang diễn ra khi bị cắt ngang thường dùng quá khứ tiếp diễn (was watching); watched nghe như việc đã xong." },
      { wrong: "I was go to school when I met him.", right: "I was going to school when I met him.", why: "Sau was / were động từ thêm -ing." },
      { wrong: "I was knowing the answer.", right: "I knew the answer.", why: "Know là động từ trạng thái, không dùng tiếp diễn." }
    ],
    exercises: [
      c("I ___ TV when the phone rang. (đang xem)", ["watched", "was watching", "am watching", "have watched"], 1, "Việc đang diễn ra bị cắt ngang dùng quá khứ tiếp diễn."),
      c("While she ___, I was cooking. (đang học)", ["studied", "was studying", "studies", "study"], 1, "Hai việc song song cùng dùng quá khứ tiếp diễn."),
      c("What ___ you doing at 9 o'clock last night?", ["did", "were", "are", "do"], 1, "You đi với were trong quá khứ tiếp diễn."),
      c("I ___ down the street when I saw an old friend. (đang đi)", ["walked", "was walking", "walk", "have walked"], 1, "Việc nền đang diễn ra dùng quá khứ tiếp diễn, việc ngắn saw dùng quá khứ đơn."),
      c("The lights went out while we ___ dinner. (đang ăn)", ["had", "were having", "have", "are having"], 1, "Dinner đang diễn ra thì mất điện nên dùng were having."),
      f("When I arrived, they ___ dinner. (have)", ["were having"], "Khi tôi đến, họ đang ăn: were having.", "have"),
      f("She ___ when the teacher asked a question. (not / listen)", ["wasn't listening", "was not listening"], "Phủ định: wasn’t + V-ing.", "not / listen"),
      f("I ___ when the earthquake started. (sleep)", ["was sleeping"], "Việc đang diễn ra bị xen vào: was sleeping.", "sleep"),
      o("Khi tôi gọi, anh ấy đang ngủ.", "He was sleeping when I called.", "Việc dài: was + V-ing; việc ngắn: quá khứ đơn.", ["When I called he was sleeping."]),
      o("Chúng tôi đang chơi bóng thì trời bắt đầu mưa.", "We were playing football when it started to rain.", "were + V-ing + when + quá khứ đơn.", ["When it started to rain we were playing football."])
    ]
  },
  {
    id: "conditionals-zero-first",
    level: "B1",
    title: "Zero and first conditional",
    titleVi: "Câu điều kiện loại 0 và loại 1",
    summary: "Loại 0 nói về sự thật luôn đúng. Loại 1 nói về điều có thể xảy ra ở tương lai. Cả hai dùng thì hiện tại trong mệnh đề if.",
    rules: [
      {
        title: "Loại 0: sự thật chung",
        points: ["If + hiện tại đơn, hiện tại đơn: If you heat ice, it melts."]
      },
      {
        title: "Loại 1: khả năng thật ở tương lai",
        points: ["If + hiện tại đơn, will + động từ nguyên mẫu: If it rains tomorrow, we will stay at home.", "Không dùng will trong mệnh đề if.", "Có thể đảo vế: We will stay home if it rains (không cần dấu phẩy)."]
      },
      {
        title: "Unless",
        points: ["Unless = if ... not: Unless you hurry, you will miss the bus = If you don’t hurry, you will miss the bus."]
      }
    ],
    examples: [
      { en: "If you heat ice, it melts.", vi: "Nếu bạn đun nóng đá, nó tan chảy." },
      { en: "If it rains tomorrow, we will stay at home.", vi: "Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà." },
      { en: "I will call you if I have time.", vi: "Tôi sẽ gọi bạn nếu tôi có thời gian." },
      { en: "If you don't hurry, you will miss the bus.", vi: "Nếu bạn không nhanh lên, bạn sẽ lỡ xe buýt." },
      { en: "Unless you study, you won't pass.", vi: "Nếu bạn không học, bạn sẽ không đậu." }
    ],
    mistakes: [
      { wrong: "If it will rain, we stay home.", right: "If it rains, we will stay home.", why: "Mệnh đề if dùng hiện tại đơn, will nằm ở mệnh đề chính." },
      { wrong: "If I will see her, I will tell her.", right: "If I see her, I will tell her.", why: "Không dùng will sau if." },
      { wrong: "Unless you don't hurry, you will be late.", right: "Unless you hurry, you will be late.", why: "Unless đã mang nghĩa phủ định, không thêm not." }
    ],
    exercises: [
      c("If it ___ tomorrow, we will stay at home.", ["rains", "will rain", "rained", "would rain"], 0, "Mệnh đề if dùng hiện tại đơn."),
      c("If you heat ice, it ___.", ["melts", "melted", "would melt", "is melt"], 0, "Sự thật chung dùng hiện tại đơn ở cả hai vế."),
      c("I ___ you tomorrow if I have time.", ["call", "will call", "called", "am calling"], 1, "Mệnh đề chính của loại 1 dùng will + động từ."),
      c("If you ___ hard, you will pass the exam.", ["study", "will study", "studied", "would study"], 0, "Mệnh đề if dùng hiện tại đơn."),
      c("___ you hurry, you will miss the bus.", ["Unless", "If", "When not", "Until not"], 0, "Unless = if not, nên Unless you hurry nghĩa là nếu bạn không nhanh lên."),
      f("If she ___, we will start the meeting. (come)", ["comes"], "Mệnh đề if dùng hiện tại đơn, she thêm -s.", "come"),
      f("If you ___, you will be late. (not / hurry)", ["don't hurry", "do not hurry"], "Phủ định hiện tại đơn trong mệnh đề if.", "not / hurry"),
      f("We ___ to the beach if the weather is nice. (go)", ["will go", "'ll go"], "Mệnh đề chính của loại 1: will + động từ.", "go"),
      o("Nếu trời mưa, chúng tôi sẽ ở nhà.", "If it rains, we will stay at home.", "If + hiện tại đơn, will + động từ.", ["We will stay at home if it rains."]),
      o("Tôi sẽ gọi cho bạn nếu tôi có thời gian.", "I will call you if I have time.", "Mệnh đề chính trước, if + hiện tại đơn sau.", ["If I have time I will call you."])
    ]
  },
  {
    id: "second-conditional",
    level: "B1",
    title: "Second conditional",
    titleVi: "Câu điều kiện loại 2",
    summary: "Loại 2 nói về tình huống không có thật hoặc khó xảy ra ở hiện tại và tương lai, và dùng để khuyên bảo.",
    rules: [
      {
        title: "Hình thức",
        points: ["If + quá khứ đơn, would + động từ nguyên mẫu: If I had a million dollars, I would travel the world.", "Dạng quá khứ ở đây KHÔNG nói về quá khứ, mà cho thấy điều đó không có thật hiện nay."]
      },
      {
        title: "Với be",
        points: ["Dùng were cho mọi chủ ngữ trong văn viết: If I were rich, ... If he were here, ...", "If I were you, I would ... là cách khuyên thông dụng."]
      },
      {
        title: "Lưu ý",
        points: ["Không dùng would trong mệnh đề if: nói If I had time, không nói If I would have time.", "Câu hỏi: What would you do if you won the lottery?"]
      }
    ],
    examples: [
      { en: "If I had a million dollars, I would travel the world.", vi: "Nếu tôi có một triệu đô, tôi sẽ đi du lịch khắp thế giới." },
      { en: "If she studied more, she would pass.", vi: "Nếu cô ấy học nhiều hơn, cô ấy sẽ đậu." },
      { en: "What would you do if you won the lottery?", vi: "Bạn sẽ làm gì nếu trúng xổ số?" },
      { en: "If I were you, I would talk to him.", vi: "Nếu tôi là bạn, tôi sẽ nói chuyện với anh ấy." },
      { en: "I would buy a house if I had more money.", vi: "Tôi sẽ mua nhà nếu tôi có nhiều tiền hơn." }
    ],
    mistakes: [
      { wrong: "If I would have time, I would help you.", right: "If I had time, I would help you.", why: "Mệnh đề if dùng quá khứ đơn, không dùng would." },
      { wrong: "If I was a bird, I will fly.", right: "If I were a bird, I would fly.", why: "Loại 2 dùng would ở mệnh đề chính, và được phép dùng were." },
      { wrong: "If I have a million, I would travel.", right: "If I had a million, I would travel.", why: "Phải khớp: quá khứ đơn với would." }
    ],
    exercises: [
      c("If I ___ rich, I would buy a big house.", ["am", "were", "will be", "would be"], 1, "Điều không có thật dùng were."),
      c("If she ___ more, she would pass the exam.", ["studies", "studied", "will study", "would study"], 1, "Mệnh đề if của loại 2 dùng quá khứ đơn."),
      c("What ___ you do if you won the lottery?", ["will", "would", "do", "did"], 1, "Mệnh đề chính của loại 2 dùng would."),
      c("If I ___ you, I would talk to him.", ["am", "were", "will be", "would be"], 1, "If I were you là cách nói chuẩn để khuyên."),
      c("I ___ travel more if I had more time.", ["will", "would", "did", "am"], 1, "Mệnh đề chính của loại 2 dùng would."),
      f("If I ___ a car, I would drive to work. (have)", ["had"], "Mệnh đề if của loại 2 dùng quá khứ đơn.", "have"),
      f("She ___ a bigger flat if she had more money. (buy)", ["would buy", "'d buy"], "Mệnh đề chính: would + động từ nguyên mẫu.", "buy"),
      f("If he ___ the answer, he would tell us. (know)", ["knew"], "Quá khứ đơn của know là knew.", "know"),
      o("Nếu tôi là bạn, tôi sẽ nói chuyện với anh ấy.", "If I were you, I would talk to him.", "If I were you, I would + động từ.", ["I would talk to him if I were you."]),
      o("Nếu tôi có một triệu đô, tôi sẽ đi du lịch vòng quanh thế giới.", "If I had a million dollars, I would travel the world.", "If + quá khứ đơn, would + động từ.", ["I would travel the world if I had a million dollars."])
    ]
  },
  {
    id: "passive-simple",
    level: "B1",
    title: "Passive voice: present and past simple",
    titleVi: "Câu bị động: hiện tại đơn và quá khứ đơn",
    summary: "Câu bị động nhấn vào đối tượng chịu tác động hoặc khi không biết, không cần nói ai làm. Cấu trúc: be + quá khứ phân từ.",
    rules: [
      {
        title: "Hình thức",
        points: ["Hiện tại đơn: am / is / are + V3: English is spoken in many countries.", "Quá khứ đơn: was / were + V3: This bridge was built in 1998.", "Phủ định và câu hỏi chia be: The rooms aren’t cleaned. Was it made in Japan?"]
      },
      {
        title: "Khi nào dùng",
        points: ["Không biết hoặc không quan trọng ai làm: My bike was stolen.", "Muốn nhấn vào đối tượng: The window was broken by the children (dùng by khi cần nêu người làm).", "Chỉ động từ có tân ngữ mới chuyển sang bị động; happen, arrive, die không có bị động."]
      }
    ],
    examples: [
      { en: "English is spoken in many countries.", vi: "Tiếng Anh được nói ở nhiều nước." },
      { en: "The room is cleaned every day.", vi: "Căn phòng được dọn mỗi ngày." },
      { en: "This bridge was built in 1998.", vi: "Cây cầu này được xây năm 1998." },
      { en: "The thieves were caught yesterday.", vi: "Những tên trộm đã bị bắt hôm qua." },
      { en: "The window was broken by the children.", vi: "Cửa sổ bị lũ trẻ làm vỡ." }
    ],
    mistakes: [
      { wrong: "The house built in 1990.", right: "The house was built in 1990.", why: "Câu bị động cần động từ be." },
      { wrong: "The accident was happened last night.", right: "The accident happened last night.", why: "Happen không có tân ngữ nên không có bị động." },
      { wrong: "The letter is write by Tom.", right: "The letter is written by Tom.", why: "Sau be dùng quá khứ phân từ: written." }
    ],
    exercises: [
      c("English ___ in many countries.", ["speaks", "is spoken", "spoken", "is speaking"], 1, "Bị động hiện tại đơn: is + V3."),
      c("This bridge ___ in 1998.", ["built", "was built", "is built", "built is"], 1, "Có in 1998 nên dùng bị động quá khứ: was built."),
      c("The rooms ___ every day.", ["clean", "are cleaned", "cleaned", "is cleaned"], 1, "Rooms số nhiều nên are cleaned."),
      c("The thief ___ by the police yesterday.", ["caught", "was caught", "is caught", "were caught"], 1, "Thief số ít, yesterday nên was caught."),
      c("Chọn câu đúng.", ["The accident was happened last night.", "The accident happened last night.", "The accident is happen last night.", "The accident has been happen last night."], 1, "Happen không có bị động."),
      f("The letter was ___ by my sister. (write)", ["written"], "Quá khứ phân từ của write là written.", "write"),
      f("Rice ___ by farmers in warm countries. (grow)", ["is grown"], "Hiện tại đơn bị động: is grown.", "grow"),
      f("These cars ___ in Japan every year. (make)", ["are made"], "Cars số nhiều: are made.", "make"),
      o("Căn phòng được dọn mỗi ngày.", "The room is cleaned every day.", "is + V3 cho bị động hiện tại đơn.", ["Every day the room is cleaned."]),
      o("Cây cầu này được xây vào năm 1998.", "This bridge was built in 1998.", "was + V3 cho bị động quá khứ đơn.", ["In 1998 this bridge was built."])
    ]
  },
  {
    id: "relative-clauses",
    level: "B1",
    title: "Defining relative clauses",
    titleVi: "Mệnh đề quan hệ xác định",
    summary: "Mệnh đề quan hệ cho biết thêm thông tin xác định danh từ đứng trước nó, bằng who, which, that, where, whose.",
    rules: [
      {
        title: "Đại từ quan hệ",
        points: ["who / that: người. The woman who lives next door is a doctor.", "which / that: vật. The phone which is on the table is mine.", "where: nơi chốn. The restaurant where we had dinner was expensive.", "whose: sở hữu. I know a man whose daughter is a pilot."]
      },
      {
        title: "Lưu ý",
        points: ["Không có dấu phẩy ở mệnh đề xác định.", "Có thể bỏ who / which / that khi nó làm tân ngữ: The book (that) I bought is great. Không bỏ được khi nó làm chủ ngữ.", "Không nhắc lại đại từ: không nói The book which I bought it."]
      }
    ],
    examples: [
      { en: "The woman who lives next door is a doctor.", vi: "Người phụ nữ sống cạnh nhà là bác sĩ." },
      { en: "This is the book that I told you about.", vi: "Đây là quyển sách mà tôi đã kể với bạn." },
      { en: "The restaurant where we had dinner was expensive.", vi: "Nhà hàng nơi chúng tôi ăn tối rất đắt." },
      { en: "I know a man whose daughter is a pilot.", vi: "Tôi biết một người đàn ông có con gái là phi công." },
      { en: "The phone which is on the table is mine.", vi: "Chiếc điện thoại trên bàn là của tôi." }
    ],
    mistakes: [
      { wrong: "The man who he lives next door is kind.", right: "The man who lives next door is kind.", why: "Who đã thay cho he, không nhắc lại chủ ngữ." },
      { wrong: "The book which I bought it is great.", right: "The book which I bought is great.", why: "Which đã thay cho it, không nhắc lại tân ngữ." },
      { wrong: "The man which lives next door", right: "The man who lives next door", why: "Chỉ người dùng who hoặc that." }
    ],
    exercises: [
      c("The woman ___ lives next door is a doctor.", ["who", "which", "where", "whose"], 0, "Chỉ người làm chủ ngữ dùng who."),
      c("This is the restaurant ___ we had dinner.", ["who", "which", "where", "whose"], 2, "Chỉ nơi chốn dùng where."),
      c("I like the book ___ you gave me.", ["who", "that", "where", "whose"], 1, "Chỉ vật dùng that hoặc which."),
      c("He is a man ___ daughter is a pilot.", ["who", "which", "whose", "where"], 2, "Chỉ sở hữu dùng whose."),
      c("Chọn câu đúng.", ["The book which I bought it is great.", "The book which I bought is great.", "The book what I bought is great.", "The book who I bought is great."], 1, "Không nhắc lại it sau which."),
      f("The people ___ live here are friendly. (who / which)", ["who", "that"], "Chỉ người dùng who hoặc that.", "who / which"),
      f("That is the house ___ I was born. (where / who)", ["where"], "Chỉ nơi chốn dùng where.", "where / who"),
      f("The car ___ is parked outside is mine. (who / which)", ["which", "that"], "Chỉ vật dùng which hoặc that.", "who / which"),
      o("Người phụ nữ sống cạnh nhà là bác sĩ.", "The woman who lives next door is a doctor.", "who + động từ bổ nghĩa cho danh từ chỉ người."),
      o("Đây là quyển sách mà tôi đã kể với bạn.", "This is the book that I told you about.", "that thay cho tân ngữ của told you about.")
    ]
  },
  {
    id: "gerund-infinitive",
    level: "B1",
    title: "Gerunds and infinitives",
    titleVi: "Danh động từ (V-ing) và động từ nguyên mẫu có to",
    summary: "Sau mỗi động từ chính thường chỉ đi với V-ing hoặc to + động từ. Cần học theo nhóm.",
    rules: [
      {
        title: "Động từ + V-ing",
        points: ["enjoy, finish, mind, avoid, keep, suggest, practise, give up: I enjoy reading. She finished doing her homework.", "Sau giới từ luôn dùng V-ing: good at drawing, interested in learning, look forward to seeing.", "V-ing làm chủ ngữ: Swimming is fun."]
      },
      {
        title: "Động từ + to + động từ nguyên mẫu",
        points: ["want, need, hope, decide, plan, promise, would like, learn, agree, refuse, manage: She wants to learn French. I decided to leave.", "Sau tính từ và để chỉ mục đích: happy to help; I went to the shop to buy milk."]
      },
      {
        title: "Lưu ý",
        points: ["like, love, hate, start, begin đi được với cả hai dạng, nghĩa gần như nhau.", "stop doing = ngừng làm; stop to do = dừng lại để làm: We stopped to buy water."]
      }
    ],
    examples: [
      { en: "I enjoy reading.", vi: "Tôi thích đọc sách." },
      { en: "She wants to learn French.", vi: "Cô ấy muốn học tiếng Pháp." },
      { en: "He is good at drawing.", vi: "Anh ấy vẽ giỏi." },
      { en: "I decided to leave early.", vi: "Tôi quyết định về sớm." },
      { en: "We stopped to buy water.", vi: "Chúng tôi dừng lại để mua nước." }
    ],
    mistakes: [
      { wrong: "I enjoy to read.", right: "I enjoy reading.", why: "Enjoy đi với V-ing." },
      { wrong: "I want going home.", right: "I want to go home.", why: "Want đi với to + động từ nguyên mẫu." },
      { wrong: "I look forward to see you.", right: "I look forward to seeing you.", why: "To trong look forward to là giới từ nên theo sau là V-ing." }
    ],
    exercises: [
      c("I enjoy ___ to music.", ["listen", "to listen", "listening", "listened"], 2, "Enjoy + V-ing."),
      c("She wants ___ a new job.", ["find", "finding", "to find", "found"], 2, "Want + to + động từ."),
      c("He is good at ___.", ["cook", "cooking", "to cook", "cooked"], 1, "Sau giới từ at dùng V-ing."),
      c("We decided ___ early.", ["leave", "leaving", "to leave", "left"], 2, "Decide + to + động từ."),
      c("I'm looking forward to ___ you.", ["see", "seeing", "to see", "saw"], 1, "To trong look forward to là giới từ nên dùng V-ing."),
      f("She finished ___ her homework at nine. (do)", ["doing"], "Finish + V-ing.", "do"),
      f("I'd like ___ you a question. (ask)", ["to ask"], "Would like + to + động từ.", "ask"),
      f("He went to the shop ___ some milk. (buy)", ["to buy", "in order to buy"], "Chỉ mục đích dùng to + động từ.", "buy"),
      o("Tôi thích đọc sách.", "I enjoy reading books.", "Enjoy + V-ing."),
      o("Cô ấy quyết định học tiếng Pháp.", "She decided to learn French.", "Decide + to + động từ.")
    ]
  },
  {
    id: "modals-deduction",
    level: "B1",
    title: "Modal verbs of deduction: must, might, can't",
    titleVi: "Động từ khuyết thiếu chỉ suy đoán: must, might, can't",
    summary: "Dùng để đoán một điều có thật hay không dựa trên bằng chứng, từ chắc chắn đúng đến chắc chắn sai.",
    rules: [
      {
        title: "Mức độ chắc chắn",
        points: ["must + be / động từ: gần như chắc chắn đúng. He has worked all day. He must be tired.", "might / may / could: có thể. She might be at the library.", "can’t + be / động từ: gần như chắc chắn không đúng. That can’t be true!"]
      },
      {
        title: "Về quá khứ",
        points: ["must have + V3: chắc là đã. He didn’t come. He must have forgotten.", "might have / could have + V3: có thể đã.", "can’t have + V3: không thể nào đã."]
      },
      {
        title: "Lưu ý",
        points: ["Phủ định suy đoán dùng can’t, không dùng mustn’t: She can’t be at home (không nói must not be).", "Sau modal luôn là động từ nguyên mẫu không to."]
      }
    ],
    examples: [
      { en: "He has worked all day. He must be tired.", vi: "Anh ấy làm cả ngày. Chắc hẳn anh ấy mệt." },
      { en: "She might be at the library.", vi: "Có thể cô ấy đang ở thư viện." },
      { en: "That can't be true.", vi: "Điều đó không thể nào là thật." },
      { en: "They could be on their way.", vi: "Có thể họ đang trên đường." },
      { en: "He must have forgotten.", vi: "Chắc là anh ấy đã quên." }
    ],
    mistakes: [
      { wrong: "He must be not at home.", right: "He can't be at home.", why: "Suy đoán phủ định dùng can’t." },
      { wrong: "She maybe at home.", right: "She may be at home. / Maybe she is at home.", why: "May là động từ (viết rời), maybe là trạng từ và đứng đầu câu." },
      { wrong: "He must to be tired.", right: "He must be tired.", why: "Sau must không dùng to." }
    ],
    exercises: [
      c("He has worked since six. He ___ be tired.", ["must", "can't", "mustn't", "shouldn't"], 0, "Có bằng chứng rõ ràng nên chắc chắn đúng: must."),
      c("She is on holiday in Paris this week. She ___ be at home.", ["must", "can't", "might to", "has to"], 1, "Bằng chứng rõ ràng cho thấy gần như chắc chắn không: can’t."),
      c("I'm not sure. It ___ rain this afternoon.", ["must", "can't", "might", "has"], 2, "Không chắc chắn nên dùng might."),
      c("That ___ be true! I don't believe it.", ["must", "can't", "might to", "should to"], 1, "Không thể nào đúng: can’t be."),
      c("He didn't come. He ___ forgotten.", ["must have", "must has", "must", "should to"], 0, "Suy đoán về quá khứ: must have + V3."),
      f("She's not answering the phone. She ___ be sleeping. (có thể)", ["might", "may", "could"], "Có thể: might, may hoặc could.", "có thể"),
      f("He studies day and night. He ___ be very tired. (chắc chắn)", ["must"], "Suy đoán gần như chắc chắn: must.", "chắc chắn"),
      f("It ___ be Tom. He is in Paris. (không thể)", ["can't", "cannot", "couldn't"], "Suy đoán không thể: can’t.", "không thể"),
      o("Anh ấy chắc hẳn đang mệt.", "He must be tired.", "must + be + tính từ."),
      o("Cô ấy có thể đang ở thư viện.", "She might be at the library.", "might + be + nơi chốn.")
    ]
  }
];
