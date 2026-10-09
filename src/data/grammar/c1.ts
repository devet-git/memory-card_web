import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// C1: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const C1: GrammarTopic[] = [
  {
    id: "inversion-negative-adverbs",
    level: "C1",
    title: "Inversion after negative adverbs",
    titleVi: "Đảo ngữ sau trạng từ phủ định",
    summary: "Khi đặt một trạng từ phủ định hoặc hạn chế ở đầu câu để nhấn mạnh, trợ động từ đứng trước chủ ngữ như trong câu hỏi. Đây là văn phong trang trọng hoặc văn viết.",
    rules: [
      {
        title: "Cấu trúc",
        points: ["Trạng từ phủ định + trợ động từ + chủ ngữ + động từ chính: Never have I seen such a view.", "Ở hiện tại đơn và quá khứ đơn không có trợ động từ thì mượn do / does / did: Rarely does he complain. Little did she know.", "Động từ chính sau trợ động từ ở dạng nguyên mẫu hoặc V3 như bình thường."]
      },
      {
        title: "Những trạng từ hay gặp",
        points: ["never, rarely, seldom, little, nowhere, not only ... but also.", "hardly ... when (hoặc before) / no sooner ... than: Hardly had she arrived when the phone rang. No sooner had she arrived than the phone rang (vế đảo dùng quá khứ hoàn thành).", "only when / only after / only then: Only when I got home did I realise I had lost my keys (đảo ở mệnh đề chính)."]
      },
      {
        title: "Lưu ý",
        points: ["Chỉ đảo trong mệnh đề có trạng từ đó. Không đảo ở mệnh đề còn lại: Not only did he lose his job, but he also lost his house.", "Không đảo khi trạng từ không đứng đầu câu: He has never seen such a view."]
      }
    ],
    examples: [
      { en: "Never have I seen such a beautiful view.", vi: "Chưa bao giờ tôi thấy cảnh đẹp như vậy." },
      { en: "Rarely does he complain about work.", vi: "Hiếm khi anh ấy phàn nàn về công việc." },
      { en: "Hardly had she arrived when the phone rang.", vi: "Cô ấy vừa đến thì điện thoại reo." },
      { en: "No sooner had we left than it started to rain.", vi: "Chúng tôi vừa đi thì trời bắt đầu mưa." },
      { en: "Not only did he lose his job, but he also lost his house.", vi: "Anh ấy không chỉ mất việc mà còn mất nhà." },
      { en: "Only when I got home did I realise I had lost my keys.", vi: "Mãi đến khi về nhà tôi mới nhận ra mình làm mất chìa khóa." }
    ],
    mistakes: [
      { wrong: "Never I have seen such a view.", right: "Never have I seen such a view.", why: "Sau trạng từ phủ định ở đầu câu, trợ động từ đứng trước chủ ngữ." },
      { wrong: "Rarely he complains.", right: "Rarely does he complain.", why: "Hiện tại đơn mượn does khi đảo ngữ, động từ chính về nguyên mẫu." },
      { wrong: "No sooner had she arrived when the phone rang.", right: "No sooner had she arrived than the phone rang.", why: "Chuẩn mực: no sooner ... than; hardly ... when (hoặc before). No sooner ... when thường bị coi là không chuẩn." }
    ],
    exercises: [
      c("Never ___ such a beautiful view.", ["I have seen", "have I seen", "I saw", "did I saw"], 1, "Trạng từ phủ định ở đầu câu thì trợ động từ have đứng trước chủ ngữ."),
      c("Rarely ___ about his job.", ["he complains", "does he complain", "he does complain", "does he complains"], 1, "Đảo ngữ ở hiện tại đơn mượn does, động từ chính nguyên mẫu."),
      c("No sooner had we left ___ it started to rain.", ["when", "than", "that", "as"], 1, "Chuẩn mực là no sooner ... than (when thường bị coi là không chuẩn)."),
      c("Not only ___ his job, but he also lost his house.", ["he lost", "did he lose", "lost he", "he did lose"], 1, "Not only ở đầu câu thì đảo: did he lose."),
      c("Only when I got home ___ I had lost my keys.", ["I realised", "did I realise", "I did realise", "realised I"], 1, "Only when ở đầu câu thì đảo ở mệnh đề chính: did I realise."),
      f("Little ___ he know that the meeting had been cancelled.", ["did"], "Little ở đầu câu đảo ngữ, quá khứ đơn mượn did."),
      f("Seldom ___ she eat out.", ["does", "did"], "Seldom ở đầu câu đảo ngữ: hiện tại đơn mượn does, quá khứ đơn mượn did."),
      f("Hardly had he sat down ___ the lights went out.", ["when", "before"], "Hardly had ... when (hoặc before)."),
      o("Chưa bao giờ tôi thấy cảnh đẹp như vậy.", "Never have I seen such a beautiful view.", "Never + have + chủ ngữ + V3."),
      o("Hiếm khi anh ấy phàn nàn về công việc.", "Rarely does he complain about work.", "Rarely + does + chủ ngữ + động từ nguyên mẫu."),
      o("Chúng tôi vừa đi thì trời bắt đầu mưa.", "No sooner had we left than it started to rain.", "No sooner + had + chủ ngữ + V3 + than + quá khứ đơn.")
    ]
  },
  {
    id: "mixed-inverted-conditionals",
    level: "C1",
    title: "Mixed and inverted conditionals",
    titleVi: "Câu điều kiện hỗn hợp và câu điều kiện đảo ngữ",
    summary: "Điều kiện hỗn hợp nối quá khứ với hiện tại. Đảo ngữ bỏ if, đưa had, were hoặc should lên đầu câu, tạo văn phong trang trọng.",
    rules: [
      {
        title: "Điều kiện hỗn hợp",
        points: ["Điều kiện trong quá khứ, kết quả ở hiện tại: If + quá khứ hoàn thành, would + động từ: If I had taken that job, I would be rich now.", "Điều kiện ở hiện tại (một đặc điểm lâu dài), kết quả trong quá khứ: If + quá khứ đơn, would have + V3: If he were more careful, he wouldn’t have made that mistake."]
      },
      {
        title: "Đảo ngữ thay cho if",
        points: ["Had + chủ ngữ + V3 (loại 3): Had I known, I would have called you.", "Were + chủ ngữ (+ to + động từ) (loại 2): Were I you, I would accept the offer.", "Should + chủ ngữ + động từ nguyên mẫu (khả năng nhỏ, trang trọng): Should you need any help, please let me know."]
      },
      {
        title: "Phủ định và but for",
        points: ["Phủ định đặt not sau chủ ngữ: Had it not been for your help, I would have failed. Were it not for the rain, we would go out.", "Had it not been for / But for + danh từ = nếu không nhờ."]
      }
    ],
    examples: [
      { en: "If I had taken that job, I would be rich now.", vi: "Nếu tôi đã nhận công việc đó thì giờ tôi giàu rồi." },
      { en: "If he were more careful, he wouldn't have made that mistake.", vi: "Nếu anh ấy cẩn thận hơn thì anh ấy đã không mắc lỗi đó." },
      { en: "Had I known, I would have called you.", vi: "Giá tôi biết thì tôi đã gọi cho bạn." },
      { en: "Were I you, I would accept the offer.", vi: "Nếu tôi là bạn, tôi sẽ nhận lời đề nghị đó." },
      { en: "Should you need any help, please let me know.", vi: "Nếu bạn cần giúp đỡ, xin cho tôi biết." },
      { en: "Had it not been for your help, I would have failed.", vi: "Nếu không nhờ bạn giúp thì tôi đã trượt." }
    ],
    mistakes: [
      { wrong: "Had I knew, I would have called.", right: "Had I known, I would have called.", why: "Sau had đảo ngữ dùng quá khứ phân từ: known." },
      { wrong: "Should you will need help, call me.", right: "Should you need help, call me.", why: "Sau should trong cấu trúc này dùng động từ nguyên mẫu, không dùng will." },
      { wrong: "Hadn't it been for your help, I would have failed.", right: "Had it not been for your help, I would have failed.", why: "Khi đảo ngữ phủ định, not đứng sau chủ ngữ và không rút gọn thành hadn’t." }
    ],
    exercises: [
      c("If I had taken that job, I ___ rich now.", ["would be", "would have been", "will be", "am"], 0, "Điều kiện ở quá khứ, kết quả ở hiện tại: would + động từ."),
      c("If he were more careful, he ___ that mistake.", ["wouldn't make", "wouldn't have made", "won't have made", "hadn't made"], 1, "Điều kiện ở hiện tại, kết quả đã xảy ra trong quá khứ: would have + V3."),
      c("___ I known, I would have called you.", ["If", "Had", "Have", "Did"], 1, "Đảo ngữ loại 3 bắt đầu bằng Had."),
      c("___ I you, I would accept the offer.", ["Was", "Were", "Am", "Had"], 1, "Đảo ngữ loại 2 bắt đầu bằng Were."),
      c("___ you need any help, please let me know.", ["Should", "Would", "Did", "Had"], 0, "Đảo ngữ trang trọng cho khả năng nhỏ dùng Should."),
      f("___ it not been for your help, I would have failed.", ["Had"], "Nếu không nhờ ... (loại 3) dùng Had it not been for."),
      f("If I ___ so tired yesterday, I would be at the party now. (not / be)", ["hadn't been", "had not been"], "Điều kiện trong quá khứ: had + V3.", "not / be"),
      f("Were he ___ ask me, I would say yes.", ["to"], "Were + chủ ngữ + to + động từ.", "to"),
      o("Giá tôi biết thì tôi đã gọi cho bạn.", "Had I known, I would have called you.", "Had + chủ ngữ + V3, would have + V3.", ["I would have called you had I known."]),
      o("Nếu tôi là bạn, tôi sẽ nhận lời đề nghị đó.", "Were I you, I would accept the offer.", "Were + chủ ngữ ..., would + động từ.", ["I would accept the offer were I you."]),
      o("Nếu bạn cần giúp đỡ, xin hãy cho tôi biết.", "Should you need any help, please let me know.", "Should + chủ ngữ + động từ nguyên mẫu.", ["Please let me know should you need any help."])
    ]
  },
  {
    id: "cleft-sentences",
    level: "C1",
    title: "Cleft sentences",
    titleVi: "Câu nhấn mạnh (cleft sentences)",
    summary: "Câu chẻ tách một câu thành hai phần để nhấn mạnh một thông tin: người làm, nơi chốn, thời gian, lý do hoặc điều quan trọng nhất.",
    rules: [
      {
        title: "It-cleft: It + be + phần nhấn mạnh + that / who",
        points: ["Nhấn mạnh người: It was John who broke the window.", "Nhấn mạnh nơi chốn, thời gian, lý do hoặc vật: It was in Paris that they first met. It was the window that John broke.", "Sau phần nhấn mạnh dùng who (người) hoặc that."]
      },
      {
        title: "Wh-cleft: What + mệnh đề + be + phần nhấn mạnh",
        points: ["What I need is a holiday. What annoys me is his attitude.", "All I want is some peace and quiet. The thing that matters is honesty.", "Có thể đảo: A holiday is what I need."]
      },
      {
        title: "Lưu ý",
        points: ["Phần được nhấn mạnh đã nằm sau be, nên không nhắc lại nó trong mệnh đề sau.", "Be hòa hợp với phần nhấn mạnh trong wh-cleft: What I need is a holiday; What I need are new shoes."]
      }
    ],
    examples: [
      { en: "It was John who broke the window.", vi: "Chính John đã làm vỡ cửa sổ." },
      { en: "It was in Paris that they first met.", vi: "Chính ở Paris họ gặp nhau lần đầu." },
      { en: "What I need is a holiday.", vi: "Điều tôi cần là một kỳ nghỉ." },
      { en: "What annoys me is his attitude.", vi: "Điều làm tôi bực là thái độ của anh ta." },
      { en: "All I want is some peace and quiet.", vi: "Tất cả những gì tôi muốn là chút yên tĩnh." }
    ],
    mistakes: [
      { wrong: "It was the window John broke it.", right: "It was the window that John broke.", why: "Phần nhấn mạnh the window đã thay cho tân ngữ, không nhắc lại it." },
      { wrong: "What I need it is a holiday.", right: "What I need is a holiday.", why: "Mệnh đề what đóng vai trò chủ ngữ, không thêm đại từ it." },
      { wrong: "It was John what broke the window.", right: "It was John who broke the window.", why: "Nhấn mạnh người dùng who hoặc that, không dùng what." }
    ],
    exercises: [
      c("It was Maria ___ called the police.", ["who", "whom", "what", "which"], 0, "Nhấn mạnh người làm chủ ngữ dùng who."),
      c("___ I need is a long holiday.", ["That", "What", "Which", "It"], 1, "Wh-cleft bắt đầu bằng What."),
      c("It was in 2015 ___ they moved to Hanoi.", ["which", "that", "what", "whose"], 1, "It-cleft dùng that sau phần nhấn mạnh về thời gian."),
      c("All I want ___ some peace and quiet.", ["are", "is", "were", "be"], 1, "Be hòa hợp với phần đứng sau nó: some peace and quiet được xem là một khối nên dùng is."),
      c("What annoys me ___ his attitude.", ["are", "is", "that", "does"], 1, "Wh-cleft: What ... + is + phần nhấn mạnh."),
      f("It was the manager ___ made the final decision. (who / which)", ["who", "that"], "Nhấn mạnh người dùng who hoặc that.", "who / which"),
      f("___ she wanted was a quiet weekend. (What / All)", ["What", "All"], "Wh-cleft bắt đầu bằng What (hoặc All).", "What / All"),
      f("It was then ___ I realised I was wrong.", ["that"], "It-cleft nhấn mạnh thời điểm dùng that."),
      o("Chính John đã làm vỡ cửa sổ.", "It was John who broke the window.", "It was + phần nhấn mạnh + who + động từ."),
      o("Điều tôi cần là một kỳ nghỉ.", "What I need is a holiday.", "What + mệnh đề + is + phần nhấn mạnh.", ["A holiday is what I need."])
    ]
  },
  {
    id: "subjunctive-formal",
    level: "C1",
    title: "Subjunctive, would rather and it's time",
    titleVi: "Giả định cách, would rather và it's time",
    summary: "Một nhóm cấu trúc dùng để đề nghị, đòi hỏi, nói về sở thích và đòi hỏi đã đến lúc làm gì. Động từ thường ở dạng nguyên mẫu hoặc dạng quá khứ nhưng nghĩa không phải quá khứ.",
    rules: [
      {
        title: "Giả định cách sau động từ và tính từ đòi hỏi",
        points: ["suggest, recommend, insist, demand, propose, require + that + chủ ngữ + động từ nguyên mẫu (kể cả với he / she): The doctor insisted that he take more rest.", "Chỉ áp dụng khi nghĩa là đề nghị hoặc đòi hỏi. Khi suggest = cho thấy, insist = khăng khăng một sự thật thì dùng thì thường: His silence suggests that he is guilty. He insisted that she was innocent.", "It is essential / vital / important that + chủ ngữ + động từ nguyên mẫu: It is essential that she be on time.", "Tiếng Anh Anh thường dùng should: ... that he should take more rest."]
      },
      {
        title: "Would rather và it's time",
        points: ["would rather + động từ (chính mình): I’d rather stay.", "would rather + chủ ngữ khác + quá khứ đơn (hiện tại hoặc tương lai): I’d rather you stayed at home tonight.", "would rather + chủ ngữ + had + V3 (quá khứ): I’d rather you hadn’t told him.", "It’s (high) time + chủ ngữ + quá khứ đơn: It’s time we left (đã đến lúc, hơi muộn)."]
      },
      {
        title: "As if / as though",
        points: ["Thường dùng quá khứ khi điều đó không có thật: He talks as if he knew everything (thực ra anh ta không biết). Trong lời nói tự nhiên vẫn gặp hiện tại (as if he knows everything).", "Với be thường dùng were: as if he were the boss."]
      }
    ],
    examples: [
      { en: "She suggested that he see a doctor.", vi: "Cô ấy đề nghị anh ấy đi khám bác sĩ." },
      { en: "It is essential that everyone be on time.", vi: "Điều thiết yếu là mọi người phải đúng giờ." },
      { en: "I'd rather you stayed at home.", vi: "Tôi muốn bạn ở nhà hơn." },
      { en: "I'd rather you hadn't told him.", vi: "Giá mà bạn đừng nói với anh ấy." },
      { en: "It's time we left.", vi: "Đã đến lúc chúng ta đi." },
      { en: "He talks as if he were the boss.", vi: "Anh ta nói cứ như thể anh ta là sếp." }
    ],
    mistakes: [
      { wrong: "I'd rather you to stay.", right: "I'd rather you stayed.", why: "Sau would rather + người khác dùng quá khứ đơn, không dùng to." },
      { wrong: "It's time we leave.", right: "It's time we left.", why: "Cấu trúc chuẩn của it’s time + chủ ngữ dùng quá khứ đơn." },
      { wrong: "He insisted that she goes to the meeting.", right: "He insisted that she go to the meeting.", why: "Với nghĩa đòi hỏi, dùng nguyên mẫu (she go). Chỉ khi insist nghĩa là khăng khăng một sự thật mới dùng thì thường: He insisted that she was innocent." }
    ],
    exercises: [
      c("The doctor insisted that he ___ more rest. (giả định cách)", ["takes", "take", "took", "taking"], 1, "Sau insist trong nghĩa đòi hỏi, giả định cách dùng động từ nguyên mẫu."),
      c("It is essential that she ___ on time. (giả định cách)", ["is", "be", "will be", "was"], 1, "Giả định cách sau it is essential that dùng nguyên mẫu: be."),
      c("I'd rather you ___ at home tonight.", ["stays", "stayed", "to stay", "staying"], 1, "Would rather + chủ ngữ khác + quá khứ đơn."),
      c("It's time we ___. We're late.", ["leave", "left", "leaving", "to leave"], 1, "It’s time + chủ ngữ + quá khứ đơn."),
      c("He looks at me as if I ___ a ghost. (không có thật)", ["am", "were", "have been", "will be"], 1, "Điều không có thật dùng quá khứ sau as if, với be thường dùng were."),
      f("I'd rather you ___ told him. It was a secret.", ["hadn't", "had not"], "Tiếc về quá khứ: would rather + chủ ngữ + had + V3."),
      f("The manager demanded that every employee ___ the form by Friday. (submit)", ["submit", "should submit"], "Sau demand dùng động từ nguyên mẫu.", "submit"),
      f("It's high time the government ___ something about pollution. (do)", ["did"], "It’s high time + quá khứ đơn.", "do"),
      o("Đã đến lúc chúng ta đi.", "It's time we left.", "It’s time + chủ ngữ + quá khứ đơn."),
      o("Cô ấy đề nghị anh ấy đi khám bác sĩ.", "She suggested that he see a doctor.", "suggest + that + chủ ngữ + động từ nguyên mẫu.")
    ]
  },
  {
    id: "participle-clauses",
    level: "C1",
    title: "Participle clauses",
    titleVi: "Mệnh đề phân từ",
    summary: "Mệnh đề phân từ rút gọn câu bằng cách dùng V-ing, having + V3 hoặc V3 thay cho một mệnh đề đầy đủ. Thông thường chủ ngữ của nó trùng với chủ ngữ của mệnh đề chính.",
    rules: [
      {
        title: "Ba dạng chính",
        points: ["V-ing (chủ động, cùng lúc hoặc là nguyên nhân): Walking down the street, I saw an old friend. Feeling tired, she went to bed.", "Having + V3 (chủ động, xảy ra trước): Having finished his work, he went home.", "V3 (bị động): Written in 1900, the book is still popular. Trapped by the rain, we stayed inside."]
      },
      {
        title: "Phủ định và liên từ",
        points: ["Not + V-ing: Not knowing what to say, she kept quiet.", "Giữ liên từ để rõ nghĩa: Before leaving, check the lights. While waiting, we played cards."]
      },
      {
        title: "Chủ ngữ phải trùng",
        points: ["Người hoặc vật thực hiện hành động phân từ chính là chủ ngữ của mệnh đề chính. Sai (treo): Walking down the street, a car hit me. Đúng: Walking down the street, I was hit by a car.", "Ngoại lệ: cấu trúc tuyệt đối (Weather permitting, we will go) và cụm cố định (Generally speaking, Judging by his accent)."]
      }
    ],
    examples: [
      { en: "Walking down the street, I saw an old friend.", vi: "Đang đi trên phố, tôi thấy một người bạn cũ." },
      { en: "Having finished his work, he went home.", vi: "Làm xong việc, anh ấy về nhà." },
      { en: "Written in 1900, the book is still popular.", vi: "Được viết năm 1900, cuốn sách vẫn được ưa chuộng." },
      { en: "Not knowing what to say, she kept quiet.", vi: "Không biết nói gì, cô ấy im lặng." },
      { en: "Before leaving, please turn off the lights.", vi: "Trước khi đi, hãy tắt đèn." }
    ],
    mistakes: [
      { wrong: "Walking down the street, a car hit me.", right: "Walking down the street, I was hit by a car.", why: "Chiếc xe không đi bộ; chủ ngữ của mệnh đề chính phải là người đang đi." },
      { wrong: "Finished his work, he went home.", right: "Having finished his work, he went home.", why: "Hành động chủ động và xảy ra trước dùng having + V3." },
      { wrong: "Knowing not what to say, she kept quiet.", right: "Not knowing what to say, she kept quiet.", why: "Phủ định đặt not trước dạng phân từ." }
    ],
    exercises: [
      c("___ down the street, I met an old friend.", ["Walk", "Walking", "Walked", "To walk"], 1, "Chủ động và đồng thời: V-ing."),
      c("___ his homework, he went out to play.", ["Finish", "Having finished", "Finished", "Having finishing"], 1, "Chủ động và xảy ra trước: having + V3."),
      c("___ in 1998, the bridge is now a tourist attraction.", ["Building", "Built", "Having built", "To build"], 1, "Bị động: V3."),
      c("___ what to say, she kept quiet.", ["Not knowing", "Knowing not", "Don't knowing", "Not known"], 0, "Phủ định: Not + V-ing."),
      c("Chọn câu đúng.", ["Walking down the street, a car hit me.", "Walking down the street, I was hit by a car.", "Walked down the street, I was hit by a car.", "Having walking down the street, I was hit."], 1, "Chủ ngữ của mệnh đề chính phải là người đang đi."),
      f("Before ___ the house, he locked the door. (leave)", ["leaving"], "Sau before dùng V-ing.", "leave"),
      f("___ by the rain, we stayed inside. (trap)", ["Trapped", "Being trapped", "Having been trapped"], "Bị động: quá khứ phân từ của trap là trapped.", "trap"),
      f("___ to be late, she took a taxi. (not / want)", ["Not wanting"], "Phủ định: Not + V-ing.", "not / want"),
      o("Đang đi trên phố, tôi thấy một người bạn cũ.", "Walking down the street, I saw an old friend.", "V-ing + ..., chủ ngữ + động từ."),
      o("Làm xong việc, anh ấy về nhà.", "Having finished his work, he went home.", "Having + V3 cho việc xảy ra trước.", ["He went home having finished his work."])
    ]
  },
  {
    id: "future-perfect-continuous",
    level: "C1",
    title: "Future continuous, future perfect and future perfect continuous",
    titleVi: "Tương lai tiếp diễn, tương lai hoàn thành và tương lai hoàn thành tiếp diễn",
    summary: "Ba thì tương lai nâng cao dùng để nói về việc đang diễn ra, đã hoàn thành hoặc đã kéo dài tới một mốc trong tương lai.",
    rules: [
      {
        title: "Tương lai tiếp diễn: will be + V-ing",
        points: ["Việc đang diễn ra tại một thời điểm tương lai: This time tomorrow I will be flying to Paris.", "Hỏi lịch sự về kế hoạch của người khác: Will you be using the car tonight?"]
      },
      {
        title: "Tương lai hoàn thành: will have + V3",
        points: ["Việc sẽ xong trước một mốc trong tương lai: By next June I will have finished my degree.", "Hay đi với by + mốc thời gian, by the time, before."]
      },
      {
        title: "Tương lai hoàn thành tiếp diễn: will have been + V-ing",
        points: ["Nhấn độ dài tính đến một mốc tương lai: By May I will have been working here for ten years."]
      },
      {
        title: "Lưu ý",
        points: ["Sau by the time, when, before, after dùng hiện tại, không dùng will: By the time you arrive, I will have left."]
      }
    ],
    examples: [
      { en: "This time tomorrow I will be flying to Paris.", vi: "Giờ này ngày mai tôi sẽ đang trên chuyến bay tới Paris." },
      { en: "By next June I will have finished my degree.", vi: "Đến tháng Sáu tới tôi sẽ học xong đại học." },
      { en: "By May I will have been working here for ten years.", vi: "Đến tháng Năm tôi sẽ làm việc ở đây được mười năm." },
      { en: "Will you be using the car tonight?", vi: "Tối nay bạn có dùng xe không?" },
      { en: "By the time you arrive, I will have left.", vi: "Lúc bạn đến thì tôi đã đi rồi." }
    ],
    mistakes: [
      { wrong: "By the time you will arrive, I will have left.", right: "By the time you arrive, I will have left.", why: "Sau by the time không dùng will." },
      { wrong: "By May I will work here for ten years.", right: "By May I will have been working here for ten years.", why: "Nhấn độ dài tính đến một mốc tương lai cần will have been + V-ing." },
      { wrong: "I will have been finished my work by six.", right: "I will have finished my work by six.", why: "Tương lai hoàn thành: will have + V3, không có been + V3 ở đây." }
    ],
    exercises: [
      c("This time tomorrow I ___ to Paris. (đang trên chuyến bay)", ["will fly", "will be flying", "will have flown", "fly"], 1, "Việc đang diễn ra tại một thời điểm tương lai: will be flying."),
      c("By next June I ___ my degree. (đã xong trước thời điểm đó)", ["will finish", "will have finished", "will be finishing", "finish"], 1, "Xong trước một mốc tương lai: will have finished."),
      c("By May I ___ here for ten years.", ["will work", "will be working", "will have been working", "am working"], 2, "Nhấn độ dài tính đến một mốc: will have been working."),
      c("By the time you arrive, I ___. (đã đi rồi)", ["will leave", "will have left", "leave", "am leaving"], 1, "Xong trước lúc bạn đến: will have left."),
      c("Don't call at eight. I ___ dinner then. (đang ăn)", ["will have", "will be having", "will have had", "have"], 1, "Việc đang diễn ra lúc đó: will be having."),
      f("By 2030, scientists ___ a cure. (find; đã tìm ra trước năm đó)", ["will have found", "'ll have found"], "Xong trước một mốc: will have + V3.", "find"),
      f("In June she ___ here for twenty years. (teach; nhấn độ dài)", ["will have been teaching", "'ll have been teaching", "will have taught", "'ll have taught"], "Độ dài tính đến một mốc: will have been teaching.", "teach"),
      f("By the time she ___ home, we will have eaten. (get)", ["gets"], "Sau by the time dùng hiện tại đơn.", "get"),
      o("Giờ này ngày mai tôi sẽ đang bay tới Paris.", "This time tomorrow I will be flying to Paris.", "will be + V-ing.", ["I will be flying to Paris this time tomorrow."]),
      o("Đến tháng Sáu tới tôi sẽ học xong đại học.", "By next June I will have finished my degree.", "will have + V3.", ["I will have finished my degree by next June."])
    ]
  },
  {
    id: "past-modals",
    level: "C1",
    title: "Modal verbs in the past",
    titleVi: "Động từ khuyết thiếu ở quá khứ",
    summary: "Modal + have + V3 dùng để nói về điều lẽ ra nên làm, điều đã có thể xảy ra, hoặc để suy đoán về quá khứ.",
    rules: [
      {
        title: "Phê bình và tiếc nuối",
        points: ["should have / ought to have + V3: lẽ ra đã nên (nhưng không làm): You should have called me.", "shouldn’t have + V3: lẽ ra không nên (nhưng đã làm): I shouldn’t have eaten so much.", "could have + V3: đã có thể (nhưng không xảy ra): We could have won the match."]
      },
      {
        title: "Suy đoán về quá khứ",
        points: ["must have + V3: chắc chắn đã. He must have missed the bus.", "might / may / could have + V3: có thể đã. She might have forgotten.", "can’t / couldn’t have + V3: chắc chắn không. She can’t have forgotten."]
      },
      {
        title: "Needn't have và didn't need to",
        points: ["needn’t have + V3: đã làm nhưng không cần thiết. I needn’t have bought bread; there was plenty at home.", "didn’t need to + động từ: không cần làm, và câu này không cho biết việc đó có được làm hay không."]
      }
    ],
    examples: [
      { en: "You should have called me.", vi: "Lẽ ra bạn nên gọi cho tôi." },
      { en: "I shouldn't have eaten so much.", vi: "Lẽ ra tôi không nên ăn nhiều như vậy." },
      { en: "We could have won the match.", vi: "Chúng ta đã có thể thắng trận đấu." },
      { en: "He must have missed the bus.", vi: "Chắc là anh ấy đã lỡ xe buýt." },
      { en: "She can't have forgotten.", vi: "Chắc chắn cô ấy không quên." }
    ],
    mistakes: [
      { wrong: "You should called me.", right: "You should have called me.", why: "Cần have + quá khứ phân từ." },
      { wrong: "I should have went home.", right: "I should have gone home.", why: "Sau have dùng quá khứ phân từ: gone." },
      { wrong: "She can't forget it yesterday.", right: "She can't have forgotten it.", why: "Suy đoán chắc chắn về quá khứ dùng can’t have + V3." }
    ],
    exercises: [
      c("You ___ me. I was worried. (lẽ ra nên gọi)", ["should call", "should have called", "should called", "must have called"], 1, "Lẽ ra nên làm: should have + V3."),
      c("I ___ so much cake. I feel sick.", ["shouldn't eat", "shouldn't have eaten", "mustn't have eaten", "can't have eaten"], 1, "Lẽ ra không nên làm: shouldn’t have + V3."),
      c("He isn't answering. He ___ the bus. (chắc chắn đã lỡ)", ["must have missed", "can't have missed", "should have missed", "needn't have missed"], 0, "Suy đoán chắc chắn: must have + V3."),
      c("She ___ forgotten; she wrote it in her diary. (không thể nào)", ["must have", "can't have", "should have", "needn't have"], 1, "Suy đoán chắc chắn là không: can’t have + V3."),
      c("The test was cancelled, so we ___ studied so hard. (đã học nhưng uổng công)", ["needn't have", "needn't", "mustn't have", "didn't need"], 0, "Đã làm nhưng không cần thiết: needn’t have + V3."),
      f("You ___ to the doctor earlier. (should / go)", ["should have gone", "ought to have gone", "should've gone", "ought to've gone"], "Lẽ ra nên đi: should have gone.", "should / go"),
      f("They ___ the game, but they played badly. (could / win)", ["could have won", "could've won", "might have won", "might've won"], "Đã có thể thắng: could have + V3.", "could / win"),
      f("He ___ our meeting. He's usually very reliable. (might / forget)", ["might have forgotten", "may have forgotten", "could have forgotten", "might've forgotten", "may've forgotten", "could've forgotten"], "Có thể đã quên: might have + V3.", "might / forget"),
      o("Lẽ ra bạn nên gọi cho tôi.", "You should have called me.", "should have + V3."),
      o("Chắc là anh ấy đã lỡ xe buýt.", "He must have missed the bus.", "must have + V3.")
    ]
  },
  {
    id: "gradable-ungradable",
    level: "C1",
    title: "Gradable and ungradable adjectives; intensifiers",
    titleVi: "Tính từ có mức độ và không có mức độ; từ nhấn mạnh",
    summary: "Mỗi loại tính từ đi với một nhóm từ nhấn mạnh riêng. Dùng sai (very fantastic, absolutely tired) nghe thiếu tự nhiên.",
    rules: [
      {
        title: "Tính từ có mức độ (gradable)",
        points: ["good, cold, tired, interesting, big, hot: có thể rất ít hoặc rất nhiều.", "Đi với very, extremely, quite, fairly, rather, really, a bit: very interesting, extremely cold."]
      },
      {
        title: "Tính từ cực đoan (ungradable)",
        points: ["fantastic, freezing, exhausted, terrible, huge, enormous, perfect, impossible, hilarious: nghĩa đã ở mức cao nhất.", "Đi với absolutely, completely, totally, utterly, really: absolutely fantastic. Không dùng very hoặc extremely."]
      },
      {
        title: "Cặp tính từ thường gặp",
        points: ["cold → freezing, tired → exhausted, big → huge, good → excellent, bad → terrible, small → tiny, funny → hilarious, surprised → astonished."]
      },
      {
        title: "Kết hợp từ cố định",
        points: ["highly unlikely / successful, deeply sorry / concerned, bitterly cold / disappointed, fully aware.", "Really dùng được với cả hai loại: really good, really fantastic."]
      }
    ],
    examples: [
      { en: "The film was very interesting.", vi: "Bộ phim rất thú vị." },
      { en: "The film was absolutely fantastic.", vi: "Bộ phim thật sự tuyệt vời." },
      { en: "I'm utterly exhausted.", vi: "Tôi kiệt sức hoàn toàn." },
      { en: "It's extremely cold today.", vi: "Hôm nay cực kỳ lạnh." },
      { en: "It is highly unlikely that he will come.", vi: "Rất khó có khả năng anh ấy sẽ đến." },
      { en: "I'm deeply sorry for the delay.", vi: "Tôi vô cùng xin lỗi vì sự chậm trễ." }
    ],
    mistakes: [
      { wrong: "The room was very enormous.", right: "The room was absolutely enormous.", why: "Enormous đã mang nghĩa rất lớn nên đi với absolutely, không đi với very." },
      { wrong: "I'm absolutely tired.", right: "I'm very tired. / I'm absolutely exhausted.", why: "Tired có mức độ nên đi với very; exhausted mới đi với absolutely." },
      { wrong: "It's very impossible.", right: "It's absolutely impossible.", why: "Impossible là tính từ cực đoan." }
    ],
    exercises: [
      c("The film was ___ fantastic.", ["very", "absolutely", "rather", "a bit"], 1, "Fantastic là tính từ cực đoan nên đi với absolutely."),
      c("I'm ___ tired after the long journey.", ["absolutely", "utterly", "very", "perfectly"], 2, "Tired có mức độ nên đi với very."),
      c("It was ___ freezing last night.", ["very", "fairly", "absolutely", "rather"], 2, "Freezing là tính từ cực đoan nên đi với absolutely."),
      c("It's ___ unlikely that she will come.", ["highly", "deeply", "bitterly", "fully"], 0, "Highly unlikely là cách kết hợp cố định."),
      c("I was ___ sorry to hear the news.", ["highly", "deeply", "bitterly", "wholly"], 1, "Deeply sorry là cách kết hợp cố định."),
      f("The room was ___ enormous. (absolutely / very)", ["absolutely", "completely", "utterly", "totally", "really", "quite", "truly", "positively"], "Enormous là tính từ cực đoan nên không đi với very.", "absolutely / very"),
      f("She was ___ exhausted after the marathon. (very / absolutely)", ["absolutely", "completely", "utterly", "totally", "really", "quite", "truly", "positively"], "Exhausted là tính từ cực đoan.", "very / absolutely"),
      f("The soup is ___ hot. Be careful! (very / absolutely)", ["very", "extremely", "really", "so", "too", "pretty", "quite"], "Hot có mức độ nên đi với very hoặc extremely.", "very / absolutely"),
      o("Bộ phim thật sự tuyệt vời.", "The film was absolutely fantastic.", "absolutely + tính từ cực đoan."),
      o("Rất khó có khả năng anh ấy sẽ đến.", "It is highly unlikely that he will come.", "highly unlikely là cách kết hợp cố định.")
    ]
  }
];
