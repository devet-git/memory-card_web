import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// C2: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const C2: GrammarTopic[] = [
  {
    id: "emphatic-inversion",
    level: "C2",
    title: "Inversion with so, such and restrictive phrases",
    titleVi: "Đảo ngữ với so, such và các cụm hạn chế",
    summary: "Ngoài never, rarely, còn nhiều cấu trúc đảo ngữ để nhấn mạnh trong văn phong trang trọng: so ... that, such ... that, under no circumstances, not until, only by.",
    rules: [
      {
        title: "So và such",
        points: ["So + tính từ / trạng từ + be / trợ động từ + chủ ngữ + that: So great was his anger that he walked out. So quickly did she run that nobody could catch her.", "Such + be + cụm danh từ + that: Such was the demand that all tickets sold out in an hour."]
      },
      {
        title: "Cụm hạn chế đứng đầu câu",
        points: ["Under no circumstances, on no account, in no way, at no time, nowhere: Under no circumstances should you open this door. On no account must the door be left unlocked. At no time did he mention the problem.", "Sau cụm này, trợ động từ đứng trước chủ ngữ."]
      },
      {
        title: "Not until và only",
        points: ["Not until + thời điểm / mệnh đề, rồi đảo ở mệnh đề chính: Not until midnight did they get home.", "Only by / only in this way / only then: Only by working hard can you succeed."]
      }
    ],
    examples: [
      { en: "So great was his anger that he walked out.", vi: "Cơn giận của anh ấy lớn đến nỗi anh ấy bỏ đi." },
      { en: "Such was the demand that tickets sold out in an hour.", vi: "Nhu cầu cao đến mức vé bán hết sau một giờ." },
      { en: "Under no circumstances should you open this door.", vi: "Trong bất kỳ trường hợp nào bạn cũng không được mở cửa này." },
      { en: "Not until midnight did they get home.", vi: "Mãi đến nửa đêm họ mới về đến nhà." },
      { en: "Only by working hard can you succeed.", vi: "Chỉ bằng cách làm việc chăm chỉ bạn mới thành công." },
      { en: "On no account must the door be left open.", vi: "Tuyệt đối không được để cửa mở." }
    ],
    mistakes: [
      { wrong: "Under no circumstances you should open it.", right: "Under no circumstances should you open it.", why: "Sau cụm hạn chế ở đầu câu, trợ động từ đứng trước chủ ngữ." },
      { wrong: "Not until midnight they arrived.", right: "Not until midnight did they arrive.", why: "Not until ở đầu câu thì đảo ở mệnh đề chính." },
      { wrong: "So great his anger was that he left.", right: "So great was his anger that he left.", why: "Sau so + tính từ ở đầu câu, be đứng trước chủ ngữ." }
    ],
    exercises: [
      c("So great ___ that he walked out.", ["his anger was", "was his anger", "did his anger", "his anger did"], 1, "So + tính từ ở đầu câu thì be đứng trước chủ ngữ."),
      c("Under no circumstances ___ open this door.", ["you should", "should you", "you must to", "do you should"], 1, "Sau cụm hạn chế, trợ động từ đứng trước chủ ngữ."),
      c("Not until midnight ___ home.", ["they got", "did they get", "they did get", "got they"], 1, "Not until ở đầu câu thì đảo ở mệnh đề chính."),
      c("Only by working hard ___ succeed.", ["you can", "can you", "you do", "do you can"], 1, "Only by ở đầu câu thì đảo: can you succeed."),
      c("Such ___ the demand that all tickets sold out in an hour.", ["was", "did", "were", "had"], 0, "Such + be + danh từ số ít: Such was the demand."),
      f("At no time ___ he mention the problem.", ["did", "does", "would"], "Cụm hạn chế ở đầu câu, quá khứ đơn mượn did."),
      f("On no account ___ the door be left unlocked.", ["must", "should", "can", "may", "shall"], "Sau on no account trợ động từ đứng trước chủ ngữ.", "must / should"),
      f("So quickly ___ she run that nobody could catch her.", ["did"], "So + trạng từ ở đầu câu, quá khứ đơn mượn did."),
      o("Mãi đến nửa đêm họ mới về đến nhà.", "Not until midnight did they get home.", "Not until + thời điểm + trợ động từ + chủ ngữ + động từ."),
      o("Trong bất kỳ trường hợp nào bạn cũng không được mở cửa này.", "Under no circumstances should you open this door.", "Under no circumstances + should + chủ ngữ + động từ."),
      o("Chỉ bằng cách làm việc chăm chỉ bạn mới thành công.", "Only by working hard can you succeed.", "Only by + V-ing + can + chủ ngữ + động từ.")
    ]
  },
  {
    id: "reporting-passives-perfect-infinitive",
    level: "C2",
    title: "Reporting passives and perfect infinitives",
    titleVi: "Câu bị động tường thuật và nguyên mẫu hoàn thành",
    summary: "Cấu trúc thường dùng trong báo chí và văn bản trang trọng để nêu điều người ta tin, nói hoặc báo cáo mà không nói rõ ai.",
    rules: [
      {
        title: "Hai cách nói",
        points: ["It + be + said / believed / thought / reported / known / expected + that + mệnh đề: It is believed that he left the country.", "Chủ ngữ + be + said / believed ... + to + động từ: He is said to be very wealthy."]
      },
      {
        title: "Chọn dạng nguyên mẫu",
        points: ["to + động từ: cùng thời điểm hoặc sau: The company is expected to announce its results tomorrow.", "to have + V3: trước thời điểm của động từ tường thuật (He is believed to have left; He was believed to have left): He is believed to have left the country. The building is reported to have been destroyed.", "to be + V-ing: đang diễn ra: He is thought to be living abroad."]
      },
      {
        title: "Lưu ý",
        points: ["Động từ hay gặp: say, think, believe, report, know, consider, expect, understand, allege.", "Không nói It is said him to be rich: người được nói đến làm chủ ngữ (He is said to be rich)."]
      }
    ],
    examples: [
      { en: "It is believed that he left the country.", vi: "Người ta tin rằng anh ta đã rời khỏi đất nước." },
      { en: "He is believed to have left the country.", vi: "Anh ta được cho là đã rời khỏi đất nước." },
      { en: "She is said to be very wealthy.", vi: "Bà ấy được cho là rất giàu có." },
      { en: "The building is reported to have been destroyed.", vi: "Tòa nhà được báo cáo là đã bị phá hủy." },
      { en: "He is thought to be living abroad.", vi: "Anh ấy được cho là đang sống ở nước ngoài." },
      { en: "The company is expected to announce its results tomorrow.", vi: "Công ty dự kiến sẽ công bố kết quả vào ngày mai." }
    ],
    mistakes: [
      { wrong: "He is believed having left the country.", right: "He is believed to have left the country.", why: "Sau động từ tường thuật bị động dùng to + động từ, không dùng V-ing." },
      { wrong: "It is said him to be rich.", right: "He is said to be rich.", why: "Chủ ngữ của câu là người được nói đến, không để him sau said." },
      { wrong: "He is thought to has left.", right: "He is thought to have left.", why: "Sau to dùng nguyên mẫu: to have + V3." }
    ],
    exercises: [
      c("He is believed ___ the country last year.", ["leaving", "to leave", "to have left", "having left"], 2, "Việc xảy ra trước thời điểm nói: to have + V3."),
      c("She is said ___ very wealthy.", ["being", "to be", "to have be", "be"], 1, "Sau said dùng to be."),
      c("The building is reported ___ destroyed in last night's fire.", ["to be", "to have been", "having been", "being"], 1, "Vụ cháy đã xảy ra: to have been + V3."),
      c("It is expected ___ the company will announce its results tomorrow.", ["that", "to", "for", "what"], 0, "Dạng It is expected that + mệnh đề."),
      c("He is thought ___ abroad at the moment.", ["to be living", "to have lived", "living", "to be lived"], 0, "Đang diễn ra lúc này: to be + V-ing."),
      f("The thieves are said ___ escaped through the window.", ["to have"], "Việc đã xảy ra trước: to have + V3."),
      f("It is widely ___ that the minister will resign. (believe)", ["believed"], "Bị động: be + quá khứ phân từ.", "believe"),
      f("The old bridge is known ___ built in 1850.", ["to have been"], "Việc xảy ra trước, bị động: to have been + V3."),
      o("Anh ta được cho là đã rời khỏi đất nước.", "He is believed to have left the country.", "be believed + to have + V3."),
      o("Bà ấy được cho là rất giàu có.", "She is said to be very wealthy.", "be said + to be + tính từ.")
    ]
  },
  {
    id: "ellipsis-substitution",
    level: "C2",
    title: "Ellipsis and substitution",
    titleVi: "Lược bỏ và thay thế",
    summary: "Người bản ngữ tránh lặp bằng cách bỏ bớt từ (lược bỏ) hoặc dùng từ thay thế như so, not, do, one. Dùng đúng làm câu gọn và tự nhiên.",
    rules: [
      {
        title: "Thay thế",
        points: ["so / not thay cho cả mệnh đề sau think, hope, expect, be afraid: Will it rain? I think so. Is he coming? I hope not.", "do so thay cho một hành động: He asked me to leave, and I did so.", "one / ones thay cho danh từ đếm được: I prefer the red one.", "do / does / did thay cho động từ ở câu so sánh: She sings better than I do."]
      },
      {
        title: "So do I và neither do I",
        points: ["Đồng ý với câu khẳng định: So + trợ động từ + chủ ngữ: I love jazz. So do I.", "Đồng ý với câu phủ định: Neither / Nor + trợ động từ + chủ ngữ: She hasn’t called. Neither have I."]
      },
      {
        title: "Lược bỏ",
        points: ["Bỏ chủ ngữ và be trong mệnh đề phụ: When asked, he refused. Although tired, we carried on. If possible, call me.", "Bỏ phần lặp sau to: I’d love to (come)."]
      }
    ],
    examples: [
      { en: "Will it rain? I think so.", vi: "Trời có mưa không? Tôi nghĩ là có." },
      { en: "Is he coming? I hope not.", vi: "Anh ấy có đến không? Tôi hy vọng là không." },
      { en: "I love jazz. So do I.", vi: "Tôi thích nhạc jazz. Tôi cũng vậy." },
      { en: "She hasn't called. Neither have I.", vi: "Cô ấy chưa gọi. Tôi cũng chưa." },
      { en: "When asked, he refused to comment.", vi: "Khi được hỏi, anh ấy từ chối bình luận." },
      { en: "She sings better than I do.", vi: "Cô ấy hát hay hơn tôi." }
    ],
    mistakes: [
      { wrong: "I hope so not.", right: "I hope not.", why: "Phủ định với hope dùng hope not." },
      { wrong: "I like jazz. So like I.", right: "I like jazz. So do I.", why: "So + trợ động từ + chủ ngữ, không lặp lại động từ chính. (Lưu ý: So I do lại có nghĩa khác: “đúng vậy, tôi có”, để xác nhận một nhận xét.)" },
      { wrong: "Although was tired, he continued.", right: "Although (he was) tired, he continued.", why: "Nếu lược thì phải bỏ cả chủ ngữ và be, và chủ ngữ phải trùng với mệnh đề chính: Although tired, he continued." }
    ],
    exercises: [
      c("“Is he coming?” “I hope ___.”", ["no", "not", "so not", "it not"], 1, "Phủ định với hope dùng not."),
      c("“It's going to rain.” “I think ___.”", ["it", "so", "that", "yes"], 1, "So thay cho cả mệnh đề sau think."),
      c("“I love jazz.” “___ do I.”", ["Neither", "So", "Too", "Also"], 1, "Đồng ý với câu khẳng định: So do I."),
      c("“She hasn't called.” “___ have I.”", ["So", "Neither", "Nor so", "Either"], 1, "Đồng ý với câu phủ định: Neither have I."),
      c("___ asked, he refused to comment.", ["When", "Despite", "Because of", "Which"], 0, "Lược chủ ngữ và be: When (he was) asked."),
      f("He asked me to leave, and I ___ so immediately. (do)", ["did"], "Do so thay cho hành động, quá khứ dùng did so.", "do"),
      f("Do you want the blue shirt or the red ___?", ["one"], "One thay cho danh từ đếm được đã nhắc."),
      f("She sings better than I ___. (do)", ["do"], "Do thay cho động từ sing.", "do"),
      o("Cô ấy hát hay hơn tôi.", "She sings better than I do.", "do thay cho động từ ở vế so sánh."),
      o("Khi được hỏi, anh ấy từ chối bình luận.", "When asked, he refused to comment.", "when + V3 (lược chủ ngữ và be).", ["He refused to comment when asked."])
    ]
  },
  {
    id: "formal-hypotheticals",
    level: "C2",
    title: "Were to, should and formal fixed phrases",
    titleVi: "Were to, should và các cụm cố định trang trọng",
    summary: "Một nhóm cấu trúc giả định dùng trong văn viết trang trọng, cùng vài cụm cố định như come what may, be that as it may.",
    rules: [
      {
        title: "If ... were to và If ... should",
        points: ["If + chủ ngữ + were to + động từ: tình huống giả định, có thể rất xa: If the company were to close, thousands would lose their jobs.", "Đảo ngữ: Were the company to close, thousands would lose their jobs.", "If + chủ ngữ + should + động từ: khả năng nhỏ, lịch sự: If you should see her, give her my regards. Đảo ngữ: Should you see her, ..."]
      },
      {
        title: "Cụm cố định",
        points: ["Come what may: dù chuyện gì xảy ra. Come what may, I will support you.", "Be that as it may: dù vậy đi nữa. Be that as it may, we must finish today.", "Suffice it to say (that) ...: chỉ cần nói rằng ... Suffice it to say that the result was disappointing."]
      },
      {
        title: "Liên từ điều kiện và in case",
        points: ["provided / providing (that), on condition that: Provided that you pay on time, there will be no extra charge. (as long as dùng được cả trong văn nói.)", "In case không phải liên từ điều kiện: nó nghĩa là “phòng khi” và đi với hiện tại. Take an umbrella in case it rains."]
      }
    ],
    examples: [
      { en: "If the company were to close, thousands would lose their jobs.", vi: "Nếu công ty đóng cửa, hàng nghìn người sẽ mất việc." },
      { en: "If you should see her, give her my regards.", vi: "Nếu bạn tình cờ gặp cô ấy, xin gửi lời hỏi thăm của tôi." },
      { en: "Come what may, I will support you.", vi: "Dù chuyện gì xảy ra, tôi vẫn ủng hộ bạn." },
      { en: "Be that as it may, we must finish today.", vi: "Dù vậy đi nữa, chúng ta phải xong trong hôm nay." },
      { en: "Suffice it to say that the result was disappointing.", vi: "Chỉ cần nói rằng kết quả thật đáng thất vọng." },
      { en: "Provided that you pay on time, there will be no extra charge.", vi: "Miễn là bạn trả đúng hạn, sẽ không có phụ phí." }
    ],
    mistakes: [
      { wrong: "If the company would close, thousands would lose their jobs.", right: "If the company were to close, thousands would lose their jobs.", why: "Với sự kiện giả định, dùng were to. Would sau if chỉ dùng cho ý lịch sự hoặc sẵn lòng (If you would be so kind)." },
      { wrong: "Should you will see her, tell her.", right: "Should you see her, tell her.", why: "Sau should trong đảo ngữ dùng động từ nguyên mẫu." },
      { wrong: "Come what may happen, I will stay.", right: "Come what may, I will stay.", why: "Come what may là cụm cố định, không thêm động từ." }
    ],
    exercises: [
      c("If the company ___ to close, thousands would lose their jobs.", ["is", "were", "would", "had"], 1, "Dạng giả định là were to."),
      c("___ you see her, give her my regards.", ["Should", "Would", "Did", "Had"], 0, "Đảo ngữ trang trọng cho khả năng nhỏ dùng Should."),
      c("___ what may, I will support you.", ["Do", "Come", "Go", "Be"], 1, "Cụm cố định: Come what may."),
      c("___ that as it may, we must finish today.", ["Be", "Is", "Let", "Do"], 0, "Cụm cố định: Be that as it may."),
      c("You can borrow my car ___ you drive carefully.", ["provided that", "in spite of", "unless", "despite"], 0, "Miễn là: provided that."),
      f("___ it to say that the results were disappointing. (Suffice / Let)", ["Suffice"], "Cụm cố định: Suffice it to say.", "Suffice / Let"),
      f("Were the company ___ close, thousands would lose their jobs.", ["to"], "Đảo ngữ với were to.", "to"),
      f("Take an umbrella ___ it rains. (in case / unless)", ["in case"], "Phòng khi: in case + hiện tại.", "in case / unless"),
      o("Dù chuyện gì xảy ra, tôi vẫn ủng hộ bạn.", "Come what may, I will support you.", "Come what may, + mệnh đề."),
      o("Nếu bạn tình cờ gặp cô ấy, xin gửi lời hỏi thăm của tôi.", "If you should see her, give her my regards.", "If + chủ ngữ + should + động từ, mệnh lệnh.", ["Give her my regards if you should see her."])
    ]
  },
  {
    id: "nominalisation",
    level: "C2",
    title: "Nominalisation in formal writing",
    titleVi: "Danh hóa trong văn viết trang trọng",
    summary: "Danh hóa là biến động từ hoặc tính từ thành danh từ để câu cô đọng và khách quan hơn, rất phổ biến trong văn học thuật và báo chí.",
    rules: [
      {
        title: "Ý tưởng",
        points: ["Câu thường: They decided to raise prices. → Câu danh hóa: The decision to raise prices was unpopular.", "Prices rose sharply. → There was a sharp rise in prices.", "Thông tin nằm trong cụm danh từ, câu nghe trang trọng và đặc, ít chủ ngữ là người."]
      },
      {
        title: "Cặp từ thường gặp",
        points: ["decide → decision, fail → failure, arrive → arrival, develop → development, argue → argument, reduce → reduction, discover → discovery, analyse → analysis.", "important → importance, able → ability, different → difference, aware → awareness."]
      },
      {
        title: "Giới từ đi sau danh từ",
        points: ["an increase / a rise / a fall in; demand for; reason for; solution to; effect / influence / impact on; decision to / about; belief in.", "Danh từ nào thì giới từ đó, cần học theo cụm."]
      }
    ],
    examples: [
      { en: "The decision to raise prices was unpopular.", vi: "Quyết định tăng giá không được ưa chuộng." },
      { en: "There was a sharp rise in the number of students.", vi: "Số lượng sinh viên đã tăng mạnh." },
      { en: "The failure of the company surprised everyone.", vi: "Sự thất bại của công ty khiến mọi người ngạc nhiên." },
      { en: "The discovery of a new species was announced.", vi: "Việc phát hiện một loài mới đã được công bố." },
      { en: "The policy had a serious effect on small businesses.", vi: "Chính sách có tác động nghiêm trọng tới doanh nghiệp nhỏ." }
    ],
    mistakes: [
      { wrong: "The increase of prices", right: "The increase in prices", why: "Thứ bị tăng đi với in (an increase in prices); of dùng cho mức tăng (an increase of 5%)." },
      { wrong: "a demand of cheap flights", right: "a demand for cheap flights", why: "Demand đi với for." },
      { wrong: "The effect of the policy to small businesses", right: "The effect of the policy on small businesses", why: "Effect đi với on." }
    ],
    exercises: [
      c("Prices rose sharply. → There was a sharp ___ in prices.", ["rise", "rose", "rising", "raise"], 0, "Danh từ của động từ rise là rise."),
      c("They decided to close the factory. → The ___ to close the factory caused protests.", ["decide", "decision", "deciding", "decisive"], 1, "Danh từ của decide là decision."),
      c("There is a growing demand ___ renewable energy.", ["of", "for", "to", "on"], 1, "Demand for."),
      c("The policy had a serious effect ___ small businesses.", ["of", "for", "on", "at"], 2, "Effect on."),
      c("He is very able. → His ___ impressed everyone.", ["able", "ability", "ably", "enable"], 1, "Danh từ của able là ability."),
      f("Scientists discovered a new species. → The ___ of a new species was announced. (discover)", ["discovery"], "Danh từ của discover là discovery.", "discover"),
      f("The company failed. → The ___ of the company surprised everyone. (fail)", ["failure"], "Danh từ của fail là failure.", "fail"),
      f("There was a sharp fall ___ unemployment last year. (in / of)", ["in"], "A fall in.", "in / of"),
      o("Mức tăng giá mạnh đã làm mọi người ngạc nhiên.", "The sharp rise in prices surprised everyone.", "Danh hóa: the sharp rise in prices làm chủ ngữ."),
      o("Quyết định đóng cửa nhà máy đã gây ra các cuộc biểu tình.", "The decision to close the factory caused protests.", "Danh hóa: the decision to close ... làm chủ ngữ.")
    ]
  },
  {
    id: "advanced-relative-clauses",
    level: "C2",
    title: "Relative clauses with prepositions, quantifiers and reduced forms",
    titleVi: "Mệnh đề quan hệ nâng cao: giới từ, lượng từ và dạng rút gọn",
    summary: "Mệnh đề quan hệ trang trọng đặt giới từ hoặc lượng từ trước whom / which, và có thể rút gọn bằng V-ing hoặc V3.",
    rules: [
      {
        title: "Giới từ + whom / which",
        points: ["Trang trọng: the man to whom I spoke; the house in which we live. Sau giới từ không dùng who hoặc that.", "Thân mật: the man (who) I spoke to; the house (that) we live in."]
      },
      {
        title: "Lượng từ + of + whom / which",
        points: ["all of whom, some of which, none of whom, most of which, neither of whom: She has three sons, all of whom are doctors. The books, most of which were old, were sold.", "Dùng whom cho người, which cho vật. Không viết hai mệnh đề độc lập chỉ nối bằng dấu phẩy."]
      },
      {
        title: "Cụm cố định và rút gọn",
        points: ["the extent to which, the way in which, the reason for which, a fact of which he was unaware.", "Rút gọn bằng V-ing (chủ động) hoặc V3 (bị động): The people living nearby complained. The book written in 1900 is still popular."]
      }
    ],
    examples: [
      { en: "The man to whom I spoke was the manager.", vi: "Người đàn ông mà tôi đã nói chuyện là quản lý." },
      { en: "The house in which we live is very old.", vi: "Ngôi nhà chúng tôi sống rất cũ." },
      { en: "She has three sons, all of whom are doctors.", vi: "Bà ấy có ba con trai, tất cả đều là bác sĩ." },
      { en: "The books, most of which were old, were sold.", vi: "Những cuốn sách, phần lớn là sách cũ, đã được bán." },
      { en: "The extent to which he was involved is unclear.", vi: "Mức độ mà anh ấy có liên quan vẫn chưa rõ." },
      { en: "The people living nearby complained about the noise.", vi: "Những người sống gần đó phàn nàn về tiếng ồn." }
    ],
    mistakes: [
      { wrong: "The man to who I spoke", right: "The man to whom I spoke", why: "Sau giới từ dùng whom, không dùng who." },
      { wrong: "The house in that we live", right: "The house in which we live", why: "Sau giới từ không dùng that." },
      { wrong: "She has three sons, all of them are doctors.", right: "She has three sons, all of whom are doctors.", why: "Cần đại từ quan hệ whom để nối hai mệnh đề, không dùng them." }
    ],
    exercises: [
      c("The man to ___ I spoke was the manager.", ["who", "whom", "that", "which"], 1, "Sau giới từ chỉ người dùng whom."),
      c("The house in ___ we live is very old.", ["that", "who", "which", "whose"], 2, "Sau giới từ chỉ vật dùng which."),
      c("She has three sons, all of ___ are doctors.", ["who", "whom", "them", "which"], 1, "Lượng từ + of + whom cho người."),
      c("The books, most of ___ were old, were sold.", ["them", "which", "whom", "that"], 1, "Lượng từ + of + which cho vật."),
      c("The people ___ nearby complained about the noise.", ["living", "lived", "to live", "are living"], 0, "Rút gọn mệnh đề chủ động: V-ing."),
      f("The extent ___ which he was involved is unclear. (to / in)", ["to"], "The extent to which.", "to / in"),
      f("He has two brothers, neither of ___ lives in Hanoi. (who / whom)", ["whom"], "Lượng từ + of + whom.", "who / whom"),
      f("The way ___ which she solved the problem impressed us. (in / by)", ["in", "by"], "The way in which.", "in / by"),
      o("Người đàn ông mà tôi đã nói chuyện là quản lý.", "The man to whom I spoke was the manager.", "Giới từ + whom."),
      o("Bà ấy có ba con trai, tất cả đều là bác sĩ.", "She has three sons, all of whom are doctors.", "all of whom + động từ.")
    ]
  }
];
