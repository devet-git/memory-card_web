import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// B2: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const B2: GrammarTopic[] = [
  {
    id: "past-perfect",
    level: "B2",
    title: "Past perfect",
    titleVi: "Quá khứ hoàn thành",
    summary: "Quá khứ hoàn thành (had + V3) cho biết việc nào xảy ra TRƯỚC một việc khác hoặc một mốc trong quá khứ.",
    rules: [
      {
        title: "Hình thức",
        points: ["had + quá khứ phân từ, cho mọi chủ ngữ: She had left. Phủ định hadn’t + V3. Hỏi: Had you met him?"]
      },
      {
        title: "Cách dùng",
        points: ["Việc xảy ra trước một việc khác trong quá khứ: When I arrived, the film had already started.", "Dùng với by the time, before, after, already, just, never ... before: By the time we got there, they had left.", "Trong lời kể gián tiếp: She said she had never seen the sea."]
      },
      {
        title: "Lưu ý",
        points: ["Nếu các việc kể theo đúng thứ tự thì chỉ cần quá khứ đơn: I got up, had breakfast and left.", "Chỉ dùng quá khứ hoàn thành khi cần làm rõ việc nào xảy ra trước."]
      }
    ],
    examples: [
      { en: "When I arrived, the film had already started.", vi: "Khi tôi đến, bộ phim đã bắt đầu rồi." },
      { en: "She said she had never seen the sea.", vi: "Cô ấy nói cô ấy chưa bao giờ thấy biển." },
      { en: "By the time we got there, they had left.", vi: "Lúc chúng tôi đến nơi thì họ đã đi rồi." },
      { en: "I was tired because I had worked all day.", vi: "Tôi mệt vì đã làm việc cả ngày." },
      { en: "Had you met him before the party?", vi: "Bạn đã gặp anh ấy trước bữa tiệc chưa?" }
    ],
    mistakes: [
      { wrong: "When I arrived, the film already started.", right: "When I arrived, the film had already started.", why: "Bộ phim bắt đầu trước khi tôi đến nên cần quá khứ hoàn thành." },
      { wrong: "She had went home.", right: "She had gone home.", why: "Sau had dùng quá khứ phân từ: gone." },
      { wrong: "After I had finished, I had gone home.", right: "After I had finished, I went home.", why: "Chỉ việc xảy ra trước mới cần had; việc sau dùng quá khứ đơn." }
    ],
    exercises: [
      c("When we arrived, the film ___ already.", ["started", "had started", "has started", "starts"], 1, "Phim bắt đầu trước khi chúng tôi đến nên dùng had started."),
      c("By the time we got to the station, the train ___.", ["left", "had left", "has left", "was leaving"], 1, "By the time + quá khứ đơn, việc xảy ra trước dùng quá khứ hoàn thành."),
      c("She told me she ___ never seen the sea before.", ["has", "had", "was", "did"], 1, "Had never seen: quá khứ hoàn thành."),
      c("He ___ already gone home before I called.", ["has", "had", "was", "did"], 1, "Đi về trước khi tôi gọi nên dùng had gone."),
      c("___ you met him before the party?", ["Had", "Have", "Did", "Were"], 0, "Hỏi về việc xảy ra trước mốc quá khứ: Had you met ...?"),
      f("When he called, she ___ her work already. (finish)", ["had finished", "'d finished"], "Việc xong trước lúc anh ấy gọi nên dùng had finished.", "finish"),
      f("They ___ when I arrived, so I cooked. (not / eat)", ["hadn't eaten", "had not eaten"], "Phủ định quá khứ hoàn thành: hadn’t + V3.", "not / eat"),
      f("I realised that I ___ my wallet at home. (leave)", ["had left", "'d left"], "Để quên ví xảy ra trước lúc tôi nhận ra: had left.", "leave"),
      o("Khi tôi đến, bộ phim đã bắt đầu rồi.", "When I arrived, the film had already started.", "Việc xảy ra trước dùng had + V3.", ["The film had already started when I arrived."]),
      o("Cô ấy nói cô ấy chưa bao giờ nhìn thấy biển.", "She said she had never seen the sea.", "said + had never + V3.")
    ]
  },
  {
    id: "third-conditional-wishes",
    level: "B2",
    title: "Third conditional and wishes",
    titleVi: "Câu điều kiện loại 3 và câu ước",
    summary: "Loại 3 nói về điều không xảy ra trong quá khứ và kết quả giả định của nó. Wish nói về điều ước trái với thực tế.",
    rules: [
      {
        title: "Điều kiện loại 3",
        points: ["If + quá khứ hoàn thành, would have + V3: If I had studied harder, I would have passed.", "Phủ định: If she hadn’t been late, we wouldn’t have missed the train.", "Có thể dùng might have / could have để diễn tả khả năng."]
      },
      {
        title: "Wish và If only",
        points: ["wish + quá khứ đơn: ước điều không có thật ở hiện tại. I wish I had a bigger flat. I wish I were taller.", "wish + quá khứ hoàn thành: tiếc về quá khứ. I wish I had listened to you.", "If only mạnh hơn wish: If only I knew the answer!"]
      },
      {
        title: "Lưu ý",
        points: ["Không dùng would trong mệnh đề if. Với wish, khi người ước và người thực hiện điều ước là cùng một người thì không dùng would: nói I wish I had a car, không nói I wish I would have a car. (Với người khác thì được: I wish you would stop.)"]
      }
    ],
    examples: [
      { en: "If I had studied harder, I would have passed.", vi: "Giá tôi học chăm hơn thì tôi đã đậu." },
      { en: "If she hadn't been late, we wouldn't have missed the train.", vi: "Nếu cô ấy không đến muộn thì chúng tôi đã không lỡ tàu." },
      { en: "I wish I had a bigger flat.", vi: "Giá mà tôi có một căn hộ lớn hơn." },
      { en: "I wish I had listened to you.", vi: "Giá mà tôi đã nghe lời bạn." },
      { en: "If only I knew the answer!", vi: "Giá mà tôi biết đáp án!" }
    ],
    mistakes: [
      { wrong: "If I would have studied, I would have passed.", right: "If I had studied, I would have passed.", why: "Mệnh đề if dùng quá khứ hoàn thành, không dùng would." },
      { wrong: "If I had studied, I would passed.", right: "If I had studied, I would have passed.", why: "Mệnh đề chính cần would have + V3." },
      { wrong: "I wish I would have a car.", right: "I wish I had a car.", why: "Wish về hiện tại dùng quá khứ đơn." }
    ],
    exercises: [
      c("If I ___ harder, I would have passed the exam.", ["studied", "had studied", "would study", "have studied"], 1, "Loại 3: if + quá khứ hoàn thành."),
      c("If she hadn't been late, we ___ the train.", ["wouldn't miss", "wouldn't have missed", "didn't miss", "hadn't missed"], 1, "Mệnh đề chính: would have + V3."),
      c("I wish I ___ a bigger flat.", ["have", "had", "would have", "will have"], 1, "Wish về hiện tại dùng quá khứ đơn."),
      c("I wish I ___ to you. Now it's too late.", ["listened", "had listened", "listen", "would listen"], 1, "Tiếc về quá khứ dùng wish + quá khứ hoàn thành."),
      c("If only I ___ the answer! (bây giờ tôi không biết)", ["know", "knew", "had known", "would know"], 1, "Điều ước về hiện tại dùng quá khứ đơn."),
      f("If he ___ earlier, he would have caught the bus. (leave)", ["had left", "'d left"], "Loại 3: had + V3.", "leave"),
      f("We ___ wet if we had taken an umbrella. (not / get)", ["wouldn't have got", "wouldn't have gotten", "would not have got", "would not have gotten"], "Mệnh đề chính phủ định: wouldn’t have + V3.", "not / get"),
      f("I wish I ___ taller. (be)", ["were", "was"], "Ước điều không có thật ở hiện tại dùng were (hoặc was).", "be"),
      o("Nếu tôi đã học chăm hơn, tôi đã đậu.", "If I had studied harder, I would have passed.", "If + had + V3, would have + V3.", ["I would have passed if I had studied harder."]),
      o("Tôi ước tôi đã nghe lời bạn.", "I wish I had listened to you.", "wish + had + V3 để tiếc về quá khứ.")
    ]
  },
  {
    id: "reported-speech",
    level: "B2",
    title: "Reported speech",
    titleVi: "Câu tường thuật",
    summary: "Tường thuật lại lời người khác: thường lùi thì, đổi đại từ và trạng từ chỉ thời gian, nơi chốn.",
    rules: [
      {
        title: "Lùi thì",
        points: ["hiện tại đơn → quá khứ đơn: “I am tired” → He said he was tired.", "hiện tại tiếp diễn → quá khứ tiếp diễn.", "quá khứ đơn / hiện tại hoàn thành → quá khứ hoàn thành: “We ate lunch” → She said they had eaten lunch.", "will → would, can → could, must → had to.", "Nếu lời nói vẫn còn đúng ở hiện tại hoặc vừa mới được nói, người ta có thể không lùi thì (He said he is tired). Các bài tập dưới đây áp dụng quy tắc lùi thì."]
      },
      {
        title: "Đổi từ chỉ thời gian, nơi chốn",
        points: ["today → that day, tomorrow → the next day, yesterday → the day before, now → then, here → there."]
      },
      {
        title: "Câu hỏi và mệnh lệnh",
        points: ["Câu hỏi có từ hỏi: giữ từ hỏi, đưa về trật tự câu kể, không đảo: “Where do you live?” → He asked me where I lived.", "Yes / No: dùng if hoặc whether: She asked if I was ready.", "Mệnh lệnh: told / asked + người + to + động từ: The teacher told us to be quiet. Phủ định: not to."]
      },
      {
        title: "Say và tell",
        points: ["said (that) ...; told + người + (that) ...: She told me that she had finished."]
      }
    ],
    examples: [
      { en: "He said he was working.", vi: "Anh ấy nói anh ấy đang làm việc." },
      { en: "She told me she had finished.", vi: "Cô ấy nói với tôi là cô ấy đã xong." },
      { en: "He asked me where I lived.", vi: "Anh ấy hỏi tôi sống ở đâu." },
      { en: "She asked if I was ready.", vi: "Cô ấy hỏi tôi đã sẵn sàng chưa." },
      { en: "The teacher told us to be quiet.", vi: "Cô giáo bảo chúng tôi giữ yên lặng." }
    ],
    mistakes: [
      { wrong: "She said me that she was busy.", right: "She told me that she was busy. / She said that she was busy.", why: "Said không đi trực tiếp với người nghe; tell thì có." },
      { wrong: "He asked me where did I live.", right: "He asked me where I lived.", why: "Câu hỏi tường thuật không đảo trợ động từ, và lùi thì." },
      { wrong: "She asked me that I was ready.", right: "She asked me if I was ready.", why: "Câu hỏi Yes / No dùng if hoặc whether." }
    ],
    exercises: [
      c("“I am tired,” he said. → He said he ___ tired. (lùi thì)", ["is", "was", "were", "has been"], 1, "Lùi thì: am → was."),
      c("“I will call you,” she said. → She said she ___ call me. (lùi thì)", ["will", "would", "can", "did"], 1, "Will lùi thành would."),
      c("She ___ me that she had finished.", ["said", "told", "asked", "spoke"], 1, "Tell + người nghe + that."),
      c("“Where do you live?” he asked. → He asked me where I ___. (lùi thì)", ["live", "lived", "do live", "am living"], 1, "Lùi thì và không đảo: where I lived."),
      c("“Are you ready?” she asked. → She asked ___ I was ready.", ["that", "if", "what", "do"], 1, "Câu hỏi Yes / No dùng if hoặc whether."),
      f("“I can swim,” he said. → He said he ___ swim. (lùi thì)", ["could"], "Can lùi thành could.", "can"),
      f("“Don't be late,” the teacher said. → The teacher told us ___ late.", ["not to be"], "Mệnh lệnh phủ định: told + người + not to + động từ.", "not to be"),
      f("“We ate lunch,” she said. → She said they ___ lunch. (eat / lùi thì)", ["had eaten", "'d eaten"], "Quá khứ đơn lùi thành quá khứ hoàn thành.", "eat"),
      o("Anh ấy nói anh ấy đang làm việc.", "He said he was working.", "Hiện tại tiếp diễn lùi thành quá khứ tiếp diễn."),
      o("Cô ấy hỏi tôi sống ở đâu.", "She asked me where I lived.", "asked + người + từ hỏi + chủ ngữ + động từ lùi thì.")
    ]
  },
  {
    id: "passive-advanced-causative",
    level: "B2",
    title: "Passive in other tenses; have something done",
    titleVi: "Bị động ở các thì khác và cấu trúc nhờ làm hộ (have something done)",
    summary: "Bị động dùng được với mọi thì và động từ khuyết thiếu. Have something done nói về việc nhờ người khác làm giúp.",
    rules: [
      {
        title: "Bị động ở các thì khác",
        points: ["Hiện tại hoàn thành: has / have been + V3: The room has been cleaned.", "Đang diễn ra: is / are being + V3: The road is being repaired.", "Tương lai: will be + V3: The windows will be cleaned tomorrow.", "Động từ khuyết thiếu: can / must / should be + V3: The report must be finished by Friday."]
      },
      {
        title: "Have / get something done",
        points: ["have + vật + V3: nhờ người khác làm. I had my car repaired. She is having her hair cut.", "get cũng dùng được, thân mật hơn: I got my phone fixed.", "Khác với tự làm: I cut my hair (tôi tự cắt) và I had my hair cut (tôi đi cắt)."]
      },
      {
        title: "Bị động tường thuật",
        points: ["It is said that he is rich = He is said to be rich."]
      }
    ],
    examples: [
      { en: "The room has been cleaned.", vi: "Căn phòng đã được dọn." },
      { en: "The report must be finished by Friday.", vi: "Báo cáo phải được hoàn thành trước thứ Sáu." },
      { en: "The road is being repaired.", vi: "Con đường đang được sửa." },
      { en: "I had my car repaired yesterday.", vi: "Hôm qua tôi đã nhờ người sửa xe." },
      { en: "He is said to be very rich.", vi: "Người ta nói anh ấy rất giàu." }
    ],
    mistakes: [
      { wrong: "I cut my hair at the salon yesterday.", right: "I had my hair cut at the salon yesterday.", why: "Nếu thợ cắt cho bạn thì dùng have + vật + V3." },
      { wrong: "The work must finished.", right: "The work must be finished.", why: "Bị động sau must cần be + V3." },
      { wrong: "The house is building.", right: "The house is being built.", why: "Bị động đang diễn ra: is being + V3." }
    ],
    exercises: [
      c("The room ___ been cleaned.", ["has", "have", "is", "did"], 0, "Room số ít: has been cleaned."),
      c("The report must ___ by Friday.", ["finish", "be finished", "finished", "being finished"], 1, "Must + be + V3."),
      c("The new bridge ___ at the moment.", ["is building", "is being built", "is built", "builds"], 1, "Đang diễn ra: is being built."),
      c("I ___ my car repaired yesterday.", ["had", "did", "have", "made"], 0, "Had + vật + V3: nhờ người sửa xe."),
      c("He is said ___ very rich.", ["be", "to be", "being", "is"], 1, "Bị động tường thuật: is said to be."),
      f("She ___ her hair cut every month. (have / get)", ["has", "gets"], "Nhờ người khác cắt: has / gets her hair cut.", "have / get"),
      f("The windows ___ tomorrow. (will / clean)", ["will be cleaned", "'ll be cleaned"], "Tương lai bị động: will be + V3.", "will / clean"),
      f("We're ___ our house painted next week. (have / get)", ["having", "getting"], "Đang có kế hoạch nhờ người sơn nhà: having / getting.", "have / get"),
      o("Con đường đang được sửa chữa.", "The road is being repaired.", "is being + V3."),
      o("Tôi đã nhờ người sửa xe.", "I had my car repaired.", "had + vật + V3.")
    ]
  },
  {
    id: "non-defining-relative-clauses",
    level: "B2",
    title: "Non-defining relative clauses",
    titleVi: "Mệnh đề quan hệ không xác định",
    summary: "Mệnh đề này chỉ cho thêm thông tin, đặt giữa hai dấu phẩy. Bỏ đi thì câu vẫn đủ nghĩa.",
    rules: [
      {
        title: "Đặc điểm",
        points: ["Có dấu phẩy: My brother, who lives in Hue, is a doctor.", "Dùng who (người), which (vật), whose (sở hữu), where (nơi chốn).", "Không dùng that và không được bỏ đại từ quan hệ."]
      },
      {
        title: "Which cho cả mệnh đề",
        points: ["which có thể thay cho cả ý ở trước: He passed the test, which surprised everyone."]
      },
      {
        title: "So sánh với mệnh đề xác định",
        points: ["Xác định (không dấu phẩy) giúp biết là người nào, vật nào: The man who lives next door is kind.", "Không xác định (có dấu phẩy) chỉ bổ sung: Mr Nam, who lives next door, is kind."]
      }
    ],
    examples: [
      { en: "My brother, who lives in Hue, is a doctor.", vi: "Anh tôi, người sống ở Huế, là bác sĩ." },
      { en: "Hanoi, which is the capital, has a long history.", vi: "Hà Nội, thủ đô, có lịch sử lâu đời." },
      { en: "Mr Nam, whose son is a pilot, lives next door.", vi: "Ông Nam, người có con trai là phi công, sống cạnh nhà." },
      { en: "We stayed in Da Lat, where we met Tom.", vi: "Chúng tôi ở Đà Lạt, nơi chúng tôi gặp Tom." },
      { en: "He passed the test, which surprised everyone.", vi: "Anh ấy đã vượt qua bài kiểm tra, điều khiến mọi người ngạc nhiên." }
    ],
    mistakes: [
      { wrong: "My mother, that is a nurse, works at night.", right: "My mother, who is a nurse, works at night.", why: "Mệnh đề không xác định không dùng that." },
      { wrong: "Hue which is beautiful is a city.", right: "Hue, which is beautiful, is a city.", why: "Mệnh đề không xác định cần hai dấu phẩy." },
      { wrong: "Da Lat, which we met Tom, is cold.", right: "Da Lat, where we met Tom, is cold.", why: "Nơi chốn dùng where." }
    ],
    exercises: [
      c("My brother, ___ lives in Hue, is a doctor.", ["that", "who", "which", "where"], 1, "Chỉ người, mệnh đề không xác định: who."),
      c("Hanoi, ___ is the capital, has a long history.", ["that", "who", "which", "where"], 2, "Chỉ vật hoặc địa danh: which."),
      c("We stayed in Da Lat, ___ we met Tom.", ["which", "who", "where", "whose"], 2, "Chỉ nơi chốn: where."),
      c("Mr Nam, ___ son is a pilot, lives next door.", ["who", "whose", "which", "that"], 1, "Chỉ sở hữu: whose."),
      c("He passed the test, ___ surprised everyone.", ["that", "what", "which", "who"], 2, "Which thay cho cả mệnh đề trước."),
      f("Her husband, ___ works in a bank, is very kind. (who / that)", ["who"], "Không xác định không dùng that nên dùng who.", "who / that"),
      f("The museum, ___ is near my house, is free on Sundays. (which / that)", ["which"], "Không xác định không dùng that nên dùng which.", "which / that"),
      f("Hue, ___ I was born, is a beautiful city. (where / which)", ["where"], "Chỉ nơi chốn nên dùng where.", "where / which"),
      o("Anh tôi, người sống ở Huế, là bác sĩ.", "My brother, who lives in Hue, is a doctor.", "Mệnh đề không xác định nằm giữa hai dấu phẩy."),
      o("Hà Nội, thủ đô, có lịch sử lâu đời.", "Hanoi, which is the capital, has a long history.", "which + động từ, đặt giữa hai dấu phẩy.")
    ]
  },
  {
    id: "present-perfect-continuous",
    level: "B2",
    title: "Present perfect continuous",
    titleVi: "Hiện tại hoàn thành tiếp diễn",
    summary: "Have / has been + V-ing nhấn vào quá trình đang kéo dài hoặc vừa kết thúc, còn hiện tại hoàn thành đơn nhấn vào kết quả và số lượng.",
    rules: [
      {
        title: "Cách dùng",
        points: ["Việc bắt đầu từ quá khứ và còn tiếp diễn, nhấn độ dài: I’ve been waiting for an hour. She has been learning English since 2020.", "Việc vừa dừng lại, còn thấy dấu vết: You’re wet. Have you been running?"]
      },
      {
        title: "Tiếp diễn và đơn",
        points: ["Nhấn quá trình: I’ve been writing emails all morning.", "Nhấn kết quả hoặc số lượng: I’ve written five emails this morning.", "Động từ trạng thái dùng dạng đơn: I’ve known him for ten years (không nói I’ve been knowing)."]
      },
      {
        title: "For và since",
        points: ["How long ...? For two hours. Since morning."]
      }
    ],
    examples: [
      { en: "I have been waiting for an hour.", vi: "Tôi đã đợi một tiếng rồi." },
      { en: "She has been learning English since 2020.", vi: "Cô ấy học tiếng Anh từ năm 2020." },
      { en: "You look tired. Have you been working hard?", vi: "Trông bạn mệt. Bạn đã làm việc vất vả à?" },
      { en: "It has been raining all day.", vi: "Trời mưa suốt cả ngày." },
      { en: "I've written five emails this morning.", vi: "Sáng nay tôi đã viết năm email." }
    ],
    mistakes: [
      { wrong: "I am waiting for an hour.", right: "I have been waiting for an hour.", why: "Việc kéo dài từ trước đến nay cần hiện tại hoàn thành tiếp diễn." },
      { wrong: "I have been knowing him for years.", right: "I have known him for years.", why: "Know là động từ trạng thái, không dùng tiếp diễn." },
      { wrong: "I've been writing three emails.", right: "I've written three emails.", why: "Có số lượng cụ thể thì nhấn kết quả: dùng dạng đơn." }
    ],
    exercises: [
      c("I ___ for you for an hour!", ["wait", "am waiting", "have been waiting", "waited"], 2, "Kéo dài đến bây giờ: have been waiting."),
      c("She ___ English since 2020.", ["learns", "has been learning", "is learning", "learned"], 1, "Since 2020 và còn tiếp tục: has been learning."),
      c("I ___ him for ten years.", ["have been knowing", "know", "have known", "am knowing"], 2, "Know là động từ trạng thái: have known."),
      c("She has ___ three emails this morning.", ["been writing", "written", "been written", "write"], 1, "Có số lượng (three emails) nên dùng dạng đơn: has written."),
      c("It ___ since morning. The streets are wet.", ["rains", "has been raining", "is rain", "rained"], 1, "Since morning, còn dấu vết ở hiện tại: has been raining."),
      f("They ___ the bridge since January. (build)", ["have been building", "'ve been building"], "Since January, còn đang tiếp diễn: have been building.", "build"),
      f("He ___ the guitar for two hours. (play)", ["has been playing", "'s been playing"], "Nhấn khoảng thời gian: has been playing.", "play"),
      f("It ___ all night. Everything is white. (snow)", ["has been snowing", "'s been snowing"], "Việc kéo dài và còn thấy kết quả: has been snowing.", "snow"),
      o("Tôi đã đợi bạn một tiếng rồi.", "I have been waiting for you for an hour.", "have been + V-ing + for + khoảng thời gian."),
      o("Cô ấy học tiếng Anh từ năm 2020.", "She has been learning English since 2020.", "has been + V-ing + since + mốc thời gian.")
    ]
  },
  {
    id: "linking-words-contrast",
    level: "B2",
    title: "Linking words: although, despite, however, because of",
    titleVi: "Từ nối: although, despite, however, because of",
    summary: "Những từ nối giúp diễn đạt đối lập, nguyên nhân và mục đích. Quan trọng là biết từ nào đi với mệnh đề, từ nào đi với danh từ.",
    rules: [
      {
        title: "Đối lập",
        points: ["although / though / even though + mệnh đề: Although it rained, we went out.", "despite / in spite of + danh từ hoặc V-ing: Despite the rain, we went out. Despite being tired, he kept working.", "however đứng đầu câu mới, theo sau là dấu phẩy: It rained. However, we went out.", "Không dùng although cùng but trong một câu."]
      },
      {
        title: "Nguyên nhân và mục đích",
        points: ["because + mệnh đề; because of + danh từ: We stayed in because of the weather.", "so that + mệnh đề: He studied hard so that he could pass.", "in order to + động từ: She left early in order to catch the bus."]
      },
      {
        title: "Lỗi hay gặp",
        points: ["Không nói despite of (đúng là despite hoặc in spite of).", "Despite the fact that + mệnh đề nếu muốn đi với mệnh đề."]
      }
    ],
    examples: [
      { en: "Although it was raining, we went for a walk.", vi: "Mặc dù trời mưa, chúng tôi vẫn đi dạo." },
      { en: "Despite the rain, we went for a walk.", vi: "Bất chấp cơn mưa, chúng tôi vẫn đi dạo." },
      { en: "She is rich. However, she isn't happy.", vi: "Cô ấy giàu. Tuy nhiên, cô ấy không hạnh phúc." },
      { en: "We stayed at home because of the weather.", vi: "Chúng tôi ở nhà vì thời tiết." },
      { en: "He studied hard so that he could pass.", vi: "Anh ấy học chăm để có thể đậu." }
    ],
    mistakes: [
      { wrong: "Although it rained, but we went out.", right: "Although it rained, we went out.", why: "Although và but không dùng chung trong một câu." },
      { wrong: "Despite of the rain, we went out.", right: "Despite the rain, we went out.", why: "Despite không đi với of; in spite of mới có of." },
      { wrong: "Because the rain, we stayed at home.", right: "Because of the rain, we stayed at home.", why: "Sau because of là danh từ." }
    ],
    exercises: [
      c("___ it was cold, we went swimming.", ["Despite", "Although", "However", "Because of"], 1, "Sau chỗ trống là một mệnh đề nên dùng Although."),
      c("___ the rain, we went for a walk.", ["Although", "Despite", "However", "Because"], 1, "Sau chỗ trống là danh từ (the rain) nên dùng Despite."),
      c("He is very rich. ___, he isn't happy.", ["Although", "Despite", "However", "Because"], 2, "However đứng đầu câu mới, có dấu phẩy phía sau."),
      c("We stayed at home ___ the weather.", ["because", "because of", "although", "despite of"], 1, "Sau chỗ trống là danh từ nên dùng because of."),
      c("Chọn câu đúng.", ["Although he was tired, but he kept working.", "Although he was tired, he kept working.", "Despite of being tired, he kept working.", "Despite he was tired, he kept working."], 1, "Although không đi cùng but."),
      f("She went to work ___ she was ill. (although / because)", ["although", "even though", "though"], "Đi làm dù bị ốm: although.", "although / because"),
      f("___ spending a lot of money, he wasn't happy. (Despite / Although)", ["Despite", "In spite of"], "Sau chỗ trống là V-ing nên dùng Despite hoặc In spite of.", "Despite / Although"),
      f("He studied hard ___ he could pass the exam. (so that / because)", ["so that"], "Chỉ mục đích: so that.", "so that / because"),
      o("Mặc dù trời mưa, chúng tôi vẫn đi dạo.", "Although it was raining, we went for a walk.", "Although + mệnh đề, mệnh đề chính.", ["We went for a walk although it was raining."]),
      o("Cô ấy giàu. Tuy nhiên, cô ấy không hạnh phúc.", "She is rich. However, she isn't happy.", "However đứng đầu câu mới, có dấu phẩy.")
    ]
  }
];
