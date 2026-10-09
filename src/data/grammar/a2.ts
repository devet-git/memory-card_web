import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// A2: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const A2: GrammarTopic[] = [
  {
    id: "past-simple",
    level: "A2",
    title: "Past simple: statements",
    titleVi: "Quá khứ đơn: câu khẳng định",
    summary: "Quá khứ đơn kể việc đã kết thúc ở một thời điểm trong quá khứ. Động từ chỉ có một dạng quá khứ cho mọi chủ ngữ (trừ be: was / were).",
    rules: [
      {
        title: "Dùng khi nào",
        points: ["Việc đã xong, có thời điểm xác định: yesterday, last week, in 2020, two days ago.", "Chuỗi việc trong câu chuyện: I got up, had breakfast and left."]
      },
      {
        title: "Hình thức",
        points: ["Động từ có quy tắc thêm -ed: play → played, like → liked, study → studied, stop → stopped.", "Bất quy tắc phải học thuộc: go → went, have → had, see → saw, buy → bought, eat → ate, take → took, come → came, make → made, write → wrote.", "Be: I / he / she / it was, you / we / they were.", "Dạng quá khứ không đổi theo chủ ngữ, không thêm -s."]
      }
    ],
    examples: [
      { en: "I visited my grandparents last weekend.", vi: "Cuối tuần trước tôi đã thăm ông bà." },
      { en: "She went to Da Lat in 2022.", vi: "Cô ấy đã đi Đà Lạt năm 2022." },
      { en: "We watched a film yesterday.", vi: "Hôm qua chúng tôi đã xem một bộ phim." },
      { en: "He bought a new phone two days ago.", vi: "Hai ngày trước anh ấy đã mua điện thoại mới." },
      { en: "It was a great trip.", vi: "Đó là một chuyến đi tuyệt vời." }
    ],
    mistakes: [
      { wrong: "I go to the cinema yesterday.", right: "I went to the cinema yesterday.", why: "Có yesterday thì động từ phải ở quá khứ." },
      { wrong: "She goed home.", right: "She went home.", why: "Go là động từ bất quy tắc, quá khứ là went." },
      { wrong: "I was go to school.", right: "I went to school.", why: "Không dùng was cùng một động từ thường." }
    ],
    exercises: [
      c("She ___ to Da Lat last year.", ["go", "goes", "went", "goed"], 2, "Quá khứ của go là went."),
      c("We ___ a great film yesterday.", ["see", "saw", "seen", "seed"], 1, "Quá khứ của see là saw."),
      c("He ___ his keys two days ago.", ["lose", "losed", "lost", "loses"], 2, "Quá khứ của lose là lost."),
      c("I ___ at home last night.", ["am", "was", "were", "be"], 1, "I đi với was ở quá khứ."),
      c("They ___ football last Sunday.", ["played", "play", "plays", "playing"], 0, "Last Sunday là thời điểm trong quá khứ nên dùng played."),
      f("My parents ___ a new car last month. (buy)", ["bought"], "Quá khứ của buy là bought.", "buy"),
      f("She ___ hard for the exam yesterday. (study)", ["studied"], "Phụ âm + y đổi thành -ied: studied.", "study"),
      f("We ___ in Hue in 2019. (be)", ["were"], "We đi với were ở quá khứ.", "be"),
      o("Tôi đã gặp cô ấy hôm qua.", "I met her yesterday.", "Quá khứ của meet là met.", ["Yesterday I met her."]),
      o("Họ đã đi biển vào cuối tuần trước.", "They went to the beach last weekend.", "Quá khứ của go là went.", ["Last weekend they went to the beach."])
    ]
  },
  {
    id: "past-simple-questions",
    level: "A2",
    title: "Past simple: negatives and questions",
    titleVi: "Quá khứ đơn: phủ định và câu hỏi",
    summary: "Phủ định và câu hỏi quá khứ dùng did. Giống hiện tại đơn, đã có did thì động từ chính trở về nguyên mẫu.",
    rules: [
      {
        title: "Phủ định và câu hỏi",
        points: ["Phủ định: chủ ngữ + did not (didn’t) + động từ nguyên mẫu: I didn’t see him.", "Câu hỏi Yes / No: Did + chủ ngữ + động từ nguyên mẫu? Did you enjoy the party?", "Từ hỏi: Where did she go? What did you eat?", "Trả lời ngắn: Yes, I did. / No, I didn’t."]
      },
      {
        title: "Với động từ be",
        points: ["Không dùng did: She wasn’t at home. Were you late? Was the film good?"]
      }
    ],
    examples: [
      { en: "I didn't see him yesterday.", vi: "Hôm qua tôi không gặp anh ấy." },
      { en: "Did you enjoy the party?", vi: "Bạn có vui ở bữa tiệc không?" },
      { en: "Where did she go last summer?", vi: "Hè năm ngoái cô ấy đã đi đâu?" },
      { en: "What did you eat for breakfast?", vi: "Bạn đã ăn gì vào bữa sáng?" },
      { en: "Was the film good?", vi: "Bộ phim có hay không?" }
    ],
    mistakes: [
      { wrong: "Did you went there?", right: "Did you go there?", why: "Did đã mang nghĩa quá khứ, động từ chính để nguyên mẫu." },
      { wrong: "I didn't saw him.", right: "I didn't see him.", why: "Sau didn’t động từ để nguyên mẫu." },
      { wrong: "She didn't was at home.", right: "She wasn't at home.", why: "Với be, phủ định là wasn’t / weren’t, không dùng did." }
    ],
    exercises: [
      c("I ___ him yesterday.", ["didn't see", "didn't saw", "not see", "don't saw"], 0, "Didn’t + động từ nguyên mẫu."),
      c("___ you enjoy the party?", ["Do", "Did", "Were", "Are"], 1, "Câu hỏi quá khứ dùng Did."),
      c("Where ___ she go last summer?", ["do", "did", "does", "was"], 1, "Did + chủ ngữ + động từ nguyên mẫu."),
      c("Did he ___ the homework?", ["do", "did", "does", "done"], 0, "Sau did động từ nguyên mẫu: do."),
      c("Was the film good? — No, it ___.", ["wasn't", "didn't", "isn't", "weren't"], 0, "Câu hỏi dùng be thì trả lời cũng dùng be: No, it wasn’t."),
      f("She ___ me last night. (not / call)", ["didn't call", "did not call"], "Phủ định quá khứ: didn’t + động từ nguyên mẫu.", "not / call"),
      f("___ they come to your house yesterday?", ["Did"], "Câu hỏi Yes / No ở quá khứ bắt đầu bằng Did."),
      f("What did you ___ for breakfast? (eat)", ["eat"], "Sau did động từ nguyên mẫu.", "eat"),
      o("Bạn đã đi đâu hôm qua?", "Where did you go yesterday?", "Từ hỏi + did + chủ ngữ + động từ nguyên mẫu."),
      o("Tôi đã không xem bộ phim đó.", "I didn't watch that film.", "Chủ ngữ + didn’t + động từ nguyên mẫu.")
    ]
  },
  {
    id: "comparatives-superlatives",
    level: "A2",
    title: "Comparatives and superlatives",
    titleVi: "So sánh hơn và so sánh nhất",
    summary: "So sánh hai vật dùng dạng so sánh hơn + than. So sánh nhất trong một nhóm dùng the + dạng so sánh nhất.",
    rules: [
      {
        title: "Tính từ ngắn và dài",
        points: ["Tính từ ngắn (một âm tiết): thêm -er / -est: tall → taller → the tallest.", "Tính từ dài (hầu hết tính từ hai âm tiết trở lên): more / the most: more expensive → the most expensive.", "Một số tính từ hai âm tiết cũng dùng được -er / -est: quiet, clever, simple, narrow.", "Tận cùng -y đổi thành -ier / -iest: happy → happier → the happiest."]
      },
      {
        title: "Chính tả và bất quy tắc",
        points: ["Tận cùng e chỉ thêm r / st: nice → nicer → the nicest.", "Gấp đôi phụ âm: big → bigger → the biggest.", "Bất quy tắc: good → better → the best; bad → worse → the worst; far → farther / further."]
      },
      {
        title: "So sánh bằng",
        points: ["as + tính từ + as: He runs as fast as me. Phủ định: not as ... as."]
      }
    ],
    examples: [
      { en: "My brother is taller than me.", vi: "Anh tôi cao hơn tôi." },
      { en: "This book is more interesting than that one.", vi: "Quyển sách này thú vị hơn quyển kia." },
      { en: "She is the best student in the class.", vi: "Cô ấy là học sinh giỏi nhất lớp." },
      { en: "Today is hotter than yesterday.", vi: "Hôm nay nóng hơn hôm qua." },
      { en: "He runs as fast as me.", vi: "Anh ấy chạy nhanh bằng tôi." }
    ],
    mistakes: [
      { wrong: "She is more tall than me.", right: "She is taller than me.", why: "Tính từ ngắn dùng -er, không dùng more." },
      { wrong: "the most big city", right: "the biggest city", why: "Big là tính từ ngắn: the biggest." },
      { wrong: "This is gooder.", right: "This is better.", why: "Good là bất quy tắc: better, best." }
    ],
    exercises: [
      c("My sister is ___ than me.", ["tall", "taller", "more tall", "tallest"], 1, "Tính từ ngắn thêm -er và đi với than."),
      c("This film is ___ than the last one.", ["more interesting", "interestinger", "most interesting", "more interested"], 0, "Interesting là tính từ dài nên dùng more."),
      c("She is the ___ student in our class.", ["good", "better", "best", "most good"], 2, "So sánh nhất của good là the best."),
      c("Today is ___ than yesterday.", ["hot", "hotter", "more hot", "hottest"], 1, "Hot gấp đôi t: hotter."),
      c("It was the ___ day of my life.", ["happiest", "happier", "most happy", "more happy"], 0, "Happy đổi y thành i: the happiest."),
      f("Ho Chi Minh City is ___ than Da Nang. (big)", ["bigger"], "Big gấp đôi g: bigger.", "big"),
      f("This bag is ___ than that one. (expensive)", ["more expensive"], "Expensive là tính từ dài nên dùng more.", "expensive"),
      f("He is the ___ player in the team. (good)", ["best"], "So sánh nhất của good là best.", "good"),
      o("Anh ấy cao hơn tôi.", "He is taller than me.", "Tính từ ngắn + -er + than."),
      o("Đây là quyển sách hay nhất.", "This is the best book.", "The + best là so sánh nhất của good.")
    ]
  },
  {
    id: "countable-uncountable",
    level: "A2",
    title: "Countable and uncountable nouns; some, any, much, many",
    titleVi: "Danh từ đếm được, không đếm được; some, any, much, many",
    summary: "Danh từ đếm được có số nhiều. Danh từ không đếm được như water, money, information không có a / an và không thêm -s.",
    rules: [
      {
        title: "Hai loại danh từ",
        points: ["Đếm được: a book, two books. Dùng many, a few, how many.", "Không đếm được: water, milk, rice, money, information, advice, furniture. Không dùng a / an hay số nhiều. Dùng much, a little, how much.", "A lot of / lots of dùng được với cả hai loại."]
      },
      {
        title: "Some và any",
        points: ["some: câu khẳng định, lời mời, lời đề nghị: I need some milk. Would you like some tea?", "any: câu phủ định và câu hỏi: I don’t have any eggs. Do you have any money?"]
      }
    ],
    examples: [
      { en: "I need some milk.", vi: "Tôi cần một ít sữa." },
      { en: "We don't have any eggs.", vi: "Chúng tôi không có quả trứng nào." },
      { en: "How much money do you have?", vi: "Bạn có bao nhiêu tiền?" },
      { en: "How many students are there?", vi: "Có bao nhiêu học sinh?" },
      { en: "She gave me some advice.", vi: "Cô ấy cho tôi vài lời khuyên." }
    ],
    mistakes: [
      { wrong: "informations", right: "information", why: "Information không đếm được, không thêm -s." },
      { wrong: "an advice", right: "some advice / a piece of advice", why: "Advice không đếm được nên không dùng an." },
      { wrong: "How many water do you drink?", right: "How much water do you drink?", why: "Water không đếm được nên dùng how much." }
    ],
    exercises: [
      c("How ___ rice do you want?", ["many", "much", "a", "any"], 1, "Rice không đếm được nên dùng how much."),
      c("How ___ eggs do we need?", ["many", "much", "a lot", "any"], 0, "Eggs đếm được nên dùng how many."),
      c("There isn't ___ milk in the fridge.", ["some", "any", "many", "a"], 1, "Câu phủ định dùng any."),
      c("Can I have ___ water, please?", ["a", "many", "some", "few"], 2, "Lời đề nghị với danh từ không đếm được dùng some."),
      c("She gave me ___ useful information.", ["a", "an", "some", "many"], 2, "Information không đếm được nên dùng some."),
      f("I don't have ___ money. (some / any)", ["any"], "Câu phủ định dùng any.", "some / any"),
      f("We need to buy ___ bread. (a / some)", ["some"], "Bread không đếm được nên dùng some.", "a / some"),
      f("How ___ students are in your class? (many / much)", ["many"], "Students đếm được nên dùng many.", "many / much"),
      o("Tôi có một ít tiền.", "I have some money.", "Money không đếm được: some money."),
      o("Có bao nhiêu nước trong chai?", "How much water is in the bottle?", "Water không đếm được: how much.")
    ]
  },
  {
    id: "future-going-to-will",
    level: "A2",
    title: "Future: be going to and will",
    titleVi: "Tương lai: be going to và will",
    summary: "Be going to dùng cho kế hoạch đã có hoặc dự đoán có dấu hiệu rõ. Will dùng cho quyết định tại chỗ, lời hứa và ý kiến.",
    rules: [
      {
        title: "Be going to + động từ",
        points: ["Kế hoạch, dự định đã có từ trước: I’m going to visit my grandparents this weekend.", "Dự đoán dựa trên dấu hiệu nhìn thấy: Look at those clouds! It’s going to rain."]
      },
      {
        title: "Will + động từ",
        points: ["Quyết định ngay lúc nói, lời đề nghị: The phone’s ringing. I’ll answer it.", "Lời hứa: I won’t tell anyone.", "Ý kiến, dự đoán chung (thường đi với I think, probably): I think she will pass."]
      },
      {
        title: "Lưu ý",
        points: ["Sau will luôn là động từ nguyên mẫu không to: She will go. Phủ định won’t.", "Với kế hoạch đã chuẩn bị sẵn, ưu tiên be going to."]
      }
    ],
    examples: [
      { en: "I'm going to visit my grandparents this weekend.", vi: "Cuối tuần này tôi định đi thăm ông bà." },
      { en: "Look at the sky! It's going to rain.", vi: "Nhìn trời kìa! Sắp mưa rồi." },
      { en: "The phone is ringing. I'll answer it.", vi: "Điện thoại đang reo. Để tôi nghe." },
      { en: "I think she will pass the exam.", vi: "Tôi nghĩ cô ấy sẽ đậu kỳ thi." },
      { en: "I won't tell anyone.", vi: "Tôi sẽ không nói với ai." }
    ],
    mistakes: [
      { wrong: "She will goes to school.", right: "She will go to school.", why: "Sau will động từ nguyên mẫu." },
      { wrong: "I will to call you.", right: "I will call you.", why: "Sau will không dùng to." },
      { wrong: "Look! It will rain.", right: "Look! It's going to rain.", why: "Khi dự đoán dựa trên dấu hiệu đang nhìn thấy, người bản ngữ dùng be going to; will ở đây nghe kém tự nhiên." }
    ],
    exercises: [
      c("I've bought the tickets. We ___ see a film tonight.", ["will", "are going to", "go to", "are going"], 1, "Đã mua vé, tức là có kế hoạch từ trước nên dùng be going to."),
      c("Look at those clouds! It ___ rain.", ["will", "is going to", "rains", "is raining"], 1, "Có dấu hiệu nhìn thấy nên dùng is going to."),
      c("The phone is ringing. — I ___ answer it.", ["am going to", "will", "am", "do"], 1, "Quyết định ngay lúc nói dùng will."),
      c("I think it ___ be a great party.", ["will", "is going", "goes", "are"], 0, "Ý kiến với I think dùng will."),
      c("I promise I ___ tell anyone.", ["won't", "don't", "am not", "not will"], 0, "Lời hứa dùng will / won’t."),
      f("We ___ visit Da Lat next month. We have booked a hotel. (going to)", ["are going to", "'re going to"], "Đã đặt khách sạn nên là kế hoạch: be going to.", "going to"),
      f("I'm tired. I think I ___ go to bed early. (will)", ["will", "'ll"], "Quyết định tại chỗ dùng will.", "will"),
      f("He ___ late, I promise. (not / be)", ["won't be", "will not be"], "Lời hứa dùng won’t + động từ nguyên mẫu.", "not / be"),
      o("Tôi sẽ đi du lịch vào mùa hè này.", "I am going to travel this summer.", "Kế hoạch dùng be going to + động từ.", ["This summer I am going to travel."]),
      o("Tôi sẽ giúp bạn.", "I will help you.", "Lời đề nghị dùng will + động từ.")
    ]
  },
  {
    id: "present-perfect-basic",
    level: "A2",
    title: "Present perfect: experience and recent events",
    titleVi: "Hiện tại hoàn thành: kinh nghiệm và việc vừa xảy ra",
    summary: "Hiện tại hoàn thành nối quá khứ với hiện tại. Không nói thời điểm cụ thể; nếu có yesterday, last week thì dùng quá khứ đơn.",
    rules: [
      {
        title: "Hình thức",
        points: ["have / has + quá khứ phân từ (V3). Phủ định: haven’t / hasn’t. Hỏi: Have you ...?", "Có quy tắc: V-ed (visited). Bất quy tắc: be → been, go → gone / been, see → seen, do → done, eat → eaten, write → written, take → taken."]
      },
      {
        title: "Cách dùng",
        points: ["Kinh nghiệm: Have you ever been to Japan? I have never eaten sushi.", "Việc vừa xảy ra, kết quả còn đến giờ: She has just left. I have lost my keys.", "already (rồi) trong câu khẳng định, yet (chưa) trong câu phủ định và câu hỏi: I haven’t finished yet."]
      },
      {
        title: "Been và gone",
        points: ["She has been to Paris: đã từng đến và đã về.", "She has gone to Paris: đang ở Paris hoặc đang trên đường đến đó."]
      }
    ],
    examples: [
      { en: "I have visited Japan twice.", vi: "Tôi đã đến Nhật hai lần." },
      { en: "Have you ever eaten sushi?", vi: "Bạn đã bao giờ ăn sushi chưa?" },
      { en: "She has already finished her homework.", vi: "Cô ấy đã làm xong bài tập rồi." },
      { en: "We haven't seen that film yet.", vi: "Chúng tôi vẫn chưa xem bộ phim đó." },
      { en: "He has never been to London.", vi: "Anh ấy chưa bao giờ đến London." }
    ],
    mistakes: [
      { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", why: "Có thời điểm cụ thể như yesterday thì dùng quá khứ đơn." },
      { wrong: "Have you ever went to Japan?", right: "Have you ever been to Japan?", why: "Sau have dùng quá khứ phân từ: been / gone." },
      { wrong: "I have see this film.", right: "I have seen this film.", why: "Cần quá khứ phân từ seen." }
    ],
    exercises: [
      c("I have never ___ sushi.", ["eat", "ate", "eaten", "eating"], 2, "Have + quá khứ phân từ: eaten."),
      c("___ you ever been to Japan?", ["Did", "Have", "Do", "Are"], 1, "Hỏi kinh nghiệm dùng Have you ever ...?"),
      c("She has ___ finished her homework.", ["yet", "already", "ever", "ago"], 1, "Already đứng trong câu khẳng định, nghĩa là “rồi”."),
      c("We haven't seen that film ___.", ["already", "ago", "yet", "never"], 2, "Yet dùng trong câu phủ định, nghĩa là “chưa”."),
      c("Chọn câu đúng.", ["I have seen him yesterday.", "I saw him yesterday.", "I have saw him yesterday.", "I seen him yesterday."], 1, "Có yesterday nên dùng quá khứ đơn."),
      f("He ___ to London. (never / be)", ["has never been", "'s never been"], "Has + never + been.", "never / be"),
      f("I have just ___ my work. (finish)", ["finished"], "Quá khứ phân từ của finish là finished.", "finish"),
      f("Have you ___ this film? (see)", ["seen"], "Quá khứ phân từ của see là seen.", "see"),
      o("Tôi chưa bao giờ ăn sushi.", "I have never eaten sushi.", "have + never + quá khứ phân từ."),
      o("Cô ấy đã làm xong bài tập rồi.", "She has already finished her homework.", "has + already + quá khứ phân từ.", ["She has finished her homework already."])
    ]
  },
  {
    id: "must-have-to-should",
    level: "A2",
    title: "Should, must, have to",
    titleVi: "Should, must, have to (lời khuyên và sự bắt buộc)",
    summary: "Should cho lời khuyên. Must và have to cho sự bắt buộc. Mustn’t và don’t have to khác nghĩa hoàn toàn.",
    rules: [
      {
        title: "Lời khuyên và bắt buộc",
        points: ["should / shouldn’t + động từ nguyên mẫu: lời khuyên. You should see a doctor.", "must + động từ nguyên mẫu: bắt buộc mạnh, thường là ý của người nói. You must wear a seat belt.", "have to + động từ: bắt buộc do quy định, hoàn cảnh. She has to wear a uniform. Quá khứ: had to."]
      },
      {
        title: "Phủ định khác nghĩa",
        points: ["mustn’t = cấm, không được phép: You mustn’t smoke here.", "don’t have to = không cần, không bắt buộc: You don’t have to come (đến cũng được, không đến cũng được)."]
      }
    ],
    examples: [
      { en: "You should see a doctor.", vi: "Bạn nên đi khám bác sĩ." },
      { en: "You must wear a seat belt.", vi: "Bạn phải thắt dây an toàn." },
      { en: "I have to get up at six on weekdays.", vi: "Các ngày trong tuần tôi phải dậy lúc sáu giờ." },
      { en: "You mustn't smoke here.", vi: "Bạn không được hút thuốc ở đây." },
      { en: "You don't have to come.", vi: "Bạn không cần phải đến." }
    ],
    mistakes: [
      { wrong: "You must to go.", right: "You must go.", why: "Sau must không có to." },
      { wrong: "She has to goes.", right: "She has to go.", why: "Has đã mang -s, động từ sau to để nguyên mẫu." },
      { wrong: "You don't must smoke.", right: "You mustn't smoke.", why: "Phủ định của must là mustn’t, không dùng don’t must." }
    ],
    exercises: [
      c("You look tired. You ___ get some rest.", ["should", "must to", "are should", "can to"], 0, "Lời khuyên dùng should + động từ nguyên mẫu."),
      c("You ___ park here. It's not allowed.", ["don't have to", "mustn't", "shouldn't to", "haven't to"], 1, "Bị cấm thì dùng mustn’t."),
      c("Tomorrow is Sunday, so I ___ get up early.", ["mustn't", "don't have to", "doesn't have to", "shouldn't to"], 1, "Không bắt buộc thì dùng don’t have to."),
      c("She ___ wear a uniform at her school.", ["have to", "has to", "must to", "has"], 1, "She đi với has to."),
      c("He ___ study harder if he wants to pass.", ["should", "shoulds", "should to", "is should"], 0, "Should không thêm -s và không có to."),
      f("You ___ smoke in the hospital. (cấm)", ["mustn't", "must not", "can't", "cannot"], "Bị cấm dùng mustn’t.", "cấm"),
      f("We ___ pay to get in. It's free. (không cần)", ["don't have to", "do not have to", "don't need to", "do not need to", "needn't"], "Không cần thiết dùng don’t have to.", "không cần"),
      f("Students ___ wear a helmet on a motorbike. It's the law. (have to / must)", ["have to", "must"], "Luật bắt buộc dùng have to hoặc must.", "have to / must"),
      o("Bạn nên nghỉ ngơi.", "You should get some rest.", "Should + động từ nguyên mẫu."),
      o("Bạn không được dùng điện thoại ở đây.", "You mustn't use your phone here.", "Mustn’t = cấm.", ["Here you mustn't use your phone."])
    ]
  },
  {
    id: "adverbs-of-frequency",
    level: "A2",
    title: "Adverbs of frequency",
    titleVi: "Trạng từ chỉ tần suất",
    summary: "Always, usually, often, sometimes, rarely, never cho biết một việc xảy ra thường xuyên đến đâu. Vị trí trong câu là điểm hay sai.",
    rules: [
      {
        title: "Mức độ",
        points: ["always (100%) > usually > often > sometimes > rarely / seldom > never (0%).", "Cụm chỉ tần suất: every day, once a week, twice a month, three times a year."]
      },
      {
        title: "Vị trí",
        points: ["Trước động từ thường: I always drink tea.", "Sau be: She is usually late.", "Sau trợ động từ đầu tiên: I have never been there. He doesn’t often call me.", "Sometimes, usually có thể đứng đầu câu: Sometimes I walk to work."]
      },
      {
        title: "Never",
        points: ["Never đã mang nghĩa phủ định, không thêm not: I never eat meat (không nói I don’t never eat meat)."]
      }
    ],
    examples: [
      { en: "I always drink coffee in the morning.", vi: "Tôi luôn uống cà phê vào buổi sáng." },
      { en: "She is usually late.", vi: "Cô ấy thường đến muộn." },
      { en: "We rarely eat out.", vi: "Chúng tôi hiếm khi ăn ngoài." },
      { en: "He doesn't often call me.", vi: "Anh ấy không hay gọi cho tôi." },
      { en: "I go swimming twice a week.", vi: "Tôi đi bơi hai lần một tuần." }
    ],
    mistakes: [
      { wrong: "I go always to school by bike.", right: "I always go to school by bike.", why: "Trạng từ tần suất đứng trước động từ thường." },
      { wrong: "She doesn't never eat meat.", right: "She never eats meat.", why: "Never đã là phủ định, không dùng thêm doesn’t." },
      { wrong: "He always is late.", right: "He is always late.", why: "Trạng từ tần suất đứng sau be." }
    ],
    exercises: [
      c("She ___ late for class.", ["is never", "never is", "does never", "never be"], 0, "Trạng từ đứng sau be: is never."),
      c("We ___ go to the cinema on Sundays.", ["go often", "often go", "are often", "often are"], 1, "Trạng từ đứng trước động từ thường."),
      c("He ___ eats meat.", ["doesn't never", "never", "not never", "isn't never"], 1, "Never đã mang nghĩa phủ định."),
      c("How ___ do you go to the gym?", ["many", "much", "often", "far"], 2, "How often hỏi về tần suất."),
      c("They ___ at home on Saturdays. They usually go out.", ["are rarely", "rarely are", "rarely", "do rarely"], 0, "Rarely đứng sau be."),
      f("I ___ go to bed before midnight. (hiếm khi)", ["rarely", "seldom", "hardly ever"], "Hiếm khi: rarely hoặc seldom, đứng trước động từ.", "hiếm khi"),
      f("She ___ late for work. (always)", ["is always", "'s always"], "Always đứng sau be.", "always"),
      f("I go swimming ___ a week. (hai lần)", ["twice", "two times"], "Hai lần là twice (hoặc two times).", "hai lần"),
      o("Tôi luôn uống trà vào buổi sáng.", "I always drink tea in the morning.", "Always đứng trước động từ thường.", ["In the morning I always drink tea."]),
      o("Anh ấy thường đến muộn.", "He is often late.", "Often đứng sau be.")
    ]
  }
];
