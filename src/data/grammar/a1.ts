import { GrammarTopic, choice as c, fill as f, order as o } from "utils/grammar";

// A1: original lessons written for MemCard (Vietnamese explanations, examples and exercises).

export const A1: GrammarTopic[] = [
  {
    id: "be",
    level: "A1",
    title: "To be: am / is / are",
    titleVi: "Động từ to be",
    summary: "Be nghĩa là “là, thì, ở” và là động từ đầu tiên cần học. Câu tiếng Anh bắt buộc có động từ, nên không bỏ be như tiếng Việt.",
    rules: [
      {
        title: "Hình thức",
        points: ["I am (I’m) • he / she / it is (he’s) • you / we / they are (they’re).", "Phủ định thêm not: I am not, he isn’t, they aren’t.", "Câu hỏi đảo be lên trước chủ ngữ: Are you ready? Trả lời ngắn: Yes, I am. / No, he isn’t."]
      },
      {
        title: "Dùng để nói về",
        points: ["Tên, nghề nghiệp, quốc tịch: I am a nurse. She is Vietnamese.", "Tuổi và cảm giác: I am 20. He is tired.", "Vị trí: The cat is on the sofa."]
      }
    ],
    examples: [
      { en: "I am a student.", vi: "Tôi là sinh viên." },
      { en: "She is from Vietnam.", vi: "Cô ấy đến từ Việt Nam." },
      { en: "We are not tired.", vi: "Chúng tôi không mệt." },
      { en: "Is he your brother?", vi: "Anh ấy có phải anh trai bạn không?" },
      { en: "They are twelve years old.", vi: "Các bạn ấy mười hai tuổi." }
    ],
    mistakes: [
      { wrong: "I have 20 years old.", right: "I am 20 years old.", why: "Tuổi dùng be, không dùng have." },
      { wrong: "She student.", right: "She is a student.", why: "Tiếng Việt có thể bỏ “là”, nhưng tiếng Anh luôn cần be giữa chủ ngữ và danh từ hoặc tính từ." },
      { wrong: "He are tall.", right: "He is tall.", why: "He / she / it đi với is." }
    ],
    exercises: [
      c("My name ___ Linh.", ["am", "is", "are", "be"], 1, "My name là ngôi thứ ba số ít (it) nên dùng is."),
      c("We ___ in the same class.", ["is", "am", "are", "be"], 2, "We đi với are."),
      c("___ you a teacher?", ["Is", "Am", "Are", "Do"], 2, "Với you dùng Are, và câu hỏi đảo be lên đầu câu."),
      c("They ___ not at home.", ["is", "are", "am", "does"], 1, "They đi với are: They are not (aren’t) at home."),
      c("Chọn câu đúng.", ["He are a doctor.", "He is a doctor.", "He am a doctor.", "He a doctor."], 1, "He đi với is, và câu cần có động từ be."),
      f("I ___ 25 years old.", ["am", "'m"], "I đi với am."),
      f("She ___ my sister.", ["is", "'s"], "She đi với is."),
      f("It ___ cold today. (phủ định)", ["isn't", "is not", "'s not"], "Phủ định của is là is not, viết tắt isn’t.", "dạng phủ định"),
      o("Chúng tôi là bạn.", "We are friends.", "Chủ ngữ + be + danh từ."),
      o("Anh ấy không phải là bác sĩ.", "He is not a doctor.", "Phủ định: be + not trước danh từ.")
    ]
  },
  {
    id: "present-simple",
    level: "A1",
    title: "Present simple: statements",
    titleVi: "Hiện tại đơn: câu khẳng định và phủ định",
    summary: "Hiện tại đơn dùng cho thói quen, sự thật và lịch trình. Điểm cần nhớ nhất là he / she / it thêm -s.",
    rules: [
      {
        title: "Khi nào dùng",
        points: ["Thói quen: I get up at six every day.", "Sự thật hiển nhiên: Water boils at 100°C.", "Lịch trình cố định: The shop opens at 8."]
      },
      {
        title: "Hình thức khẳng định",
        points: ["I / you / we / they + động từ nguyên mẫu: They play football.", "He / she / it + động từ thêm -s hoặc -es: She works. He watches TV. She studies.", "Các dạng đặc biệt: have → has, go → goes, do → does."]
      },
      {
        title: "Phủ định",
        points: ["I / you / we / they + do not (don’t) + động từ nguyên mẫu.", "He / she / it + does not (doesn’t) + động từ nguyên mẫu, sau doesn’t KHÔNG thêm -s."]
      }
    ],
    examples: [
      { en: "She works in a bank.", vi: "Cô ấy làm việc ở ngân hàng." },
      { en: "They play football on Sundays.", vi: "Họ chơi bóng đá vào Chủ nhật." },
      { en: "He doesn't like coffee.", vi: "Anh ấy không thích cà phê." },
      { en: "I don't have a car.", vi: "Tôi không có xe hơi." },
      { en: "The shop opens at eight.", vi: "Cửa hàng mở cửa lúc tám giờ." }
    ],
    mistakes: [
      { wrong: "She work here.", right: "She works here.", why: "Với he / she / it, động từ thêm -s." },
      { wrong: "He doesn't likes tea.", right: "He doesn't like tea.", why: "Sau does / doesn’t động từ chính về nguyên mẫu, -s đã nằm ở does." },
      { wrong: "I am go to school every day.", right: "I go to school every day.", why: "Không dùng am / is / are cùng một động từ thường." }
    ],
    exercises: [
      c("My brother ___ in Hanoi.", ["live", "lives", "living", "is live"], 1, "My brother là ngôi thứ ba số ít nên động từ thêm -s: lives."),
      c("They ___ TV in the morning.", ["doesn't watch", "don't watch", "don't watches", "not watch"], 1, "They đi với don’t + động từ nguyên mẫu."),
      c("She ___ English very well.", ["speak", "speaks", "speaking", "is speak"], 1, "She + động từ thêm -s: speaks."),
      c("Water ___ at 100 degrees.", ["boil", "boils", "is boil", "boiling"], 1, "Water là it, động từ thêm -s: boils."),
      c("He ___ like spicy food.", ["don't", "doesn't", "isn't", "not"], 1, "He đi với doesn’t."),
      f("My mother ___ dinner every day. (cook)", ["cooks"], "Mother là she nên thêm -s: cooks.", "cook"),
      f("Linh ___ English at night. (study)", ["studies"], "Phụ âm + y đổi thành -ies: studies.", "study"),
      f("We ___ to school on Sunday. (not / go)", ["don't go", "do not go"], "We đi với don’t + động từ nguyên mẫu.", "not / go"),
      o("Anh ấy không thích cà phê.", "He doesn't like coffee.", "Sau doesn’t dùng động từ nguyên mẫu."),
      o("Cô ấy làm việc ở một ngân hàng.", "She works in a bank.", "She + động từ thêm -s.")
    ]
  },
  {
    id: "present-simple-questions",
    level: "A1",
    title: "Present simple: questions",
    titleVi: "Hiện tại đơn: câu hỏi",
    summary: "Câu hỏi hiện tại đơn dùng do / does ở đầu câu. Khi đã có does, động từ chính về nguyên mẫu.",
    rules: [
      {
        title: "Câu hỏi Yes / No",
        points: ["Do + I / you / we / they + động từ? Do you like pizza?", "Does + he / she / it + động từ? Does she work here?", "Trả lời ngắn: Yes, I do. / No, she doesn’t."]
      },
      {
        title: "Câu hỏi có từ để hỏi",
        points: ["Từ hỏi + do / does + chủ ngữ + động từ: Where do you live? What time does the film start?", "What do you do? nghĩa là “Bạn làm nghề gì?”.", "Who / What làm chủ ngữ thì không cần do / does: Who lives here?"]
      }
    ],
    examples: [
      { en: "Do you like pizza?", vi: "Bạn có thích pizza không?" },
      { en: "Does she work here?", vi: "Cô ấy có làm việc ở đây không?" },
      { en: "Where do they live?", vi: "Họ sống ở đâu?" },
      { en: "What time does the film start?", vi: "Phim bắt đầu lúc mấy giờ?" },
      { en: "How often do you exercise?", vi: "Bạn tập thể dục bao lâu một lần?" }
    ],
    mistakes: [
      { wrong: "Does she works here?", right: "Does she work here?", why: "Does đã mang -s, động từ chính để nguyên mẫu." },
      { wrong: "Where you live?", right: "Where do you live?", why: "Câu hỏi với động từ thường cần do / does." },
      { wrong: "Do he play football?", right: "Does he play football?", why: "He / she / it đi với does." }
    ],
    exercises: [
      c("___ your sister like music?", ["Do", "Does", "Is", "Are"], 1, "Your sister là she nên dùng Does."),
      c("Where ___ they work?", ["do", "does", "are", "is"], 0, "They đi với do."),
      c("Does he ___ English?", ["speak", "speaks", "speaking", "spoke"], 0, "Sau does động từ về nguyên mẫu."),
      c("What time ___ the shop open?", ["do", "does", "is", "are"], 1, "The shop là it nên dùng does."),
      c("Do you play tennis? — Yes, I ___.", ["play", "do", "am", "does"], 1, "Trả lời ngắn dùng lại trợ động từ: Yes, I do."),
      f("___ you live near here? (hiện tại)", ["Do"], "You đi với Do."),
      f("How often ___ she visit her grandmother? (hiện tại)", ["does"], "She đi với does."),
      f("Where does he ___? (work)", ["work"], "Sau does động từ nguyên mẫu.", "work"),
      o("Bạn sống ở đâu?", "Where do you live?", "Từ hỏi + do + chủ ngữ + động từ."),
      o("Cô ấy có nói tiếng Pháp không?", "Does she speak French?", "Does + she + động từ nguyên mẫu.")
    ]
  },
  {
    id: "articles",
    level: "A1",
    title: "Articles: a / an / the",
    titleVi: "Mạo từ a / an / the",
    summary: "Mạo từ đứng trước danh từ. Tiếng Việt không có mạo từ nên đây là điểm người học hay thiếu hoặc dùng nhầm.",
    rules: [
      {
        title: "A và an",
        points: ["Dùng với danh từ đếm được số ít, khi nhắc đến lần đầu hoặc nói “một”: I have a cat.", "An đứng trước ÂM nguyên âm (không phải chữ cái): an apple, an hour, nhưng a university (âm /j/)."]
      },
      {
        title: "The",
        points: ["Người nói và người nghe đều biết đang nói đến cái nào, hoặc đã nhắc ở câu trước: I have a cat. The cat is black.", "Những thứ duy nhất: the sun, the moon, the Internet."]
      },
      {
        title: "Không dùng mạo từ",
        points: ["Danh từ số nhiều hoặc không đếm được khi nói chung: I like music. Dogs are loyal.", "Tên người, bữa ăn, môn học: have lunch, study math."]
      }
    ],
    examples: [
      { en: "I have a cat. The cat is black.", vi: "Tôi có một con mèo. Con mèo đó màu đen." },
      { en: "She is an engineer.", vi: "Cô ấy là kỹ sư." },
      { en: "The sun is hot.", vi: "Mặt trời nóng." },
      { en: "I like music.", vi: "Tôi thích âm nhạc." },
      { en: "We have lunch at noon.", vi: "Chúng tôi ăn trưa lúc 12 giờ trưa." }
    ],
    mistakes: [
      { wrong: "I am student.", right: "I am a student.", why: "Danh từ đếm được số ít cần mạo từ." },
      { wrong: "He is a honest man.", right: "He is an honest man.", why: "Honest bắt đầu bằng âm nguyên âm (h câm) nên dùng an." },
      { wrong: "The life is beautiful.", right: "Life is beautiful.", why: "Nói chung về một khái niệm thì không dùng the." }
    ],
    exercises: [
      c("My sister is ___ doctor. (một bác sĩ)", ["a", "an", "the", "(không cần mạo từ)"], 0, "Doctor bắt đầu bằng phụ âm, nhắc đến một người: a doctor."),
      c("I eat ___ apple every day.", ["a", "an", "the", "(không cần mạo từ)"], 1, "Apple bắt đầu bằng âm nguyên âm nên dùng an."),
      c("He is ___ honest man. (một người đàn ông trung thực)", ["a", "an", "the", "(không cần mạo từ)"], 1, "Honest có h câm, âm đầu là nguyên âm nên dùng an."),
      c("I have a dog. ___ dog is very friendly.", ["A", "An", "The", "(không cần mạo từ)"], 2, "Con chó đã được nhắc ở câu trước nên dùng The."),
      c("I love ___ pizza. (nói chung)", ["a", "an", "the", "(không cần mạo từ)"], 3, "Nói chung về một món ăn thì không dùng mạo từ."),
      f("I met a girl yesterday. She studies at ___ university in Hue. (nhắc lần đầu)", ["a"], "University bắt đầu bằng âm /j/ (phụ âm) nên dùng a."),
      f("There is ___ umbrella under the table.", ["an"], "Umbrella bắt đầu bằng âm nguyên âm nên dùng an."),
      f("___ moon is bright tonight.", ["The"], "Mặt trăng chỉ có một nên dùng the."),
      o("Tôi là một giáo viên.", "I am a teacher.", "Nghề nghiệp ở số ít cần a / an."),
      o("Mặt trời rất nóng.", "The sun is very hot.", "Sun là vật duy nhất nên dùng the.")
    ]
  },
  {
    id: "plurals-demonstratives",
    level: "A1",
    title: "Plural nouns, this / that / these / those",
    titleVi: "Danh từ số nhiều và this / that / these / those",
    summary: "Danh từ đếm được có dạng số nhiều. This / that / these / those chỉ vật ở gần hoặc xa và phải khớp số với danh từ.",
    rules: [
      {
        title: "Cách tạo số nhiều",
        points: ["Thường thêm -s: book → books.", "Tận cùng s, x, z, ch, sh thêm -es: box → boxes, watch → watches, bus → buses.", "Một số từ tận cùng o cũng thêm -es: tomato → tomatoes, potato → potatoes (nhưng photo → photos, piano → pianos).", "Phụ âm + y đổi thành -ies: city → cities, baby → babies.", "Bất quy tắc: man → men, woman → women, child → children, person → people, foot → feet, tooth → teeth. Sheep và fish không đổi."]
      },
      {
        title: "This / that / these / those",
        points: ["This (số ít) và these (số nhiều): ở gần người nói.", "That (số ít) và those (số nhiều): ở xa người nói.", "Phải khớp với danh từ: this book, these books."]
      }
    ],
    examples: [
      { en: "I have two boxes.", vi: "Tôi có hai cái hộp." },
      { en: "There are three children in the park.", vi: "Có ba đứa trẻ trong công viên." },
      { en: "This is my book.", vi: "Đây là quyển sách của tôi." },
      { en: "Those are my shoes.", vi: "Kia là đôi giày của tôi." },
      { en: "These apples are fresh.", vi: "Những quả táo này tươi." }
    ],
    mistakes: [
      { wrong: "two childs", right: "two children", why: "Child là danh từ bất quy tắc, số nhiều là children." },
      { wrong: "This books are new.", right: "These books are new.", why: "Books là số nhiều nên dùng these." },
      { wrong: "many peoples", right: "many people", why: "People đã là dạng số nhiều, không thêm -s." }
    ],
    exercises: [
      c("one box, two ___", ["boxs", "boxes", "boxies", "box"], 1, "Tận cùng x thêm -es: boxes."),
      c("one child, three ___", ["childs", "childes", "children", "childrens"], 2, "Số nhiều bất quy tắc của child là children."),
      c("___ shoes over there are mine.", ["This", "That", "These", "Those"], 3, "Giày số nhiều và ở xa nên dùng those."),
      c("___ is my phone, here in my hand.", ["This", "That", "These", "Those"], 0, "Một vật số ít ở gần nên dùng this."),
      c("She has two ___.", ["babys", "babies", "babyes", "babis"], 1, "Phụ âm + y đổi thành -ies: babies."),
      f("There are five ___ in the room. (woman)", ["women"], "Số nhiều bất quy tắc của woman là women.", "woman"),
      f("I need two ___. (watch)", ["watches"], "Tận cùng ch thêm -es: watches.", "watch"),
      f("Look at ___ birds over there! (this / that / these / those)", ["those"], "Birds số nhiều và ở xa nên dùng those.", "this / that / these / those"),
      o("Đây là những quyển sách mới của tôi.", "These are my new books.", "These đi với danh từ số nhiều ở gần."),
      o("Những con mèo kia màu đen.", "Those cats are black.", "Those + danh từ số nhiều ở xa.")
    ]
  },
  {
    id: "there-is-are",
    level: "A1",
    title: "There is / there are",
    titleVi: "There is / there are",
    summary: "Dùng để nói “có” cái gì ở đâu. Không dùng have cho nghĩa “có” này.",
    rules: [
      {
        title: "Hình thức",
        points: ["There is + danh từ số ít hoặc không đếm được: There is a park. There is some milk.", "There are + danh từ số nhiều: There are three bedrooms.", "Phủ định: There isn’t / There aren’t. Câu hỏi: Is there ...? Are there ...?"]
      },
      {
        title: "Lưu ý",
        points: ["Câu hỏi và phủ định hay đi với any: Are there any shops? There isn’t any milk.", "Với danh sách, chia theo danh từ đầu tiên: There is a table and two chairs."]
      }
    ],
    examples: [
      { en: "There is a park near my house.", vi: "Có một công viên gần nhà tôi." },
      { en: "There are three bedrooms.", vi: "Có ba phòng ngủ." },
      { en: "There isn't any milk.", vi: "Không có chút sữa nào." },
      { en: "Is there a bank near here?", vi: "Gần đây có ngân hàng không?" },
      { en: "Are there any shops?", vi: "Có cửa hàng nào không?" }
    ],
    mistakes: [
      { wrong: "In my room has a bed.", right: "There is a bed in my room.", why: "Muốn nói “có” cái gì ở đâu, mở đầu bằng There is / are." },
      { wrong: "There have two cats.", right: "There are two cats.", why: "Dùng be, không dùng have." },
      { wrong: "There is many books.", right: "There are many books.", why: "Books là số nhiều nên dùng are." }
    ],
    exercises: [
      c("___ a library in this town.", ["There is", "There are", "It is", "They are"], 0, "Library số ít nên There is."),
      c("___ two windows in the room.", ["There is", "There are", "There have", "Have"], 1, "Windows số nhiều nên There are."),
      c("___ any eggs in the fridge?", ["Is there", "Are there", "Have there", "Do there"], 1, "Eggs số nhiều nên Are there ...?"),
      c("There ___ any milk.", ["isn't", "aren't", "hasn't", "doesn't"], 0, "Milk không đếm được nên dùng isn’t."),
      c("Chọn câu đúng.", ["In the garden has a tree.", "There is a tree in the garden.", "There have a tree in the garden.", "It is a tree in the garden."], 1, "Dùng There is + danh từ + nơi chốn."),
      f("There ___ a cat on the sofa.", ["is", "'s"], "Cat là số ít nên dùng is."),
      f("___ there a bank near here?", ["Is"], "Bank số ít nên Is there ...?"),
      f("There ___ some students in the classroom.", ["are"], "Students số nhiều nên dùng are."),
      o("Có một công viên gần nhà tôi.", "There is a park near my house.", "There is + danh từ số ít + nơi chốn.", ["Near my house there is a park."]),
      o("Có ba phòng ngủ trong căn nhà.", "There are three bedrooms in the house.", "There are + số + danh từ số nhiều.", ["In the house there are three bedrooms."])
    ]
  },
  {
    id: "present-continuous",
    level: "A1",
    title: "Present continuous",
    titleVi: "Hiện tại tiếp diễn",
    summary: "Nói về việc đang xảy ra ngay lúc nói. Cấu trúc là am / is / are + động từ-ing.",
    rules: [
      {
        title: "Dùng và hình thức",
        points: ["Việc đang diễn ra: I am reading now. Look! It is raining.", "Cấu trúc: am / is / are + V-ing. Phủ định: am not / isn’t / aren’t + V-ing. Hỏi: Are you working?"]
      },
      {
        title: "Cách thêm -ing",
        points: ["Bỏ e cuối: make → making, write → writing.", "Từ ngắn phụ âm-nguyên âm-phụ âm gấp đôi phụ âm: run → running, sit → sitting.", "ie → ying: lie → lying."]
      },
      {
        title: "Động từ trạng thái",
        points: ["Các động từ chỉ trạng thái như know, like, love, want, need thường không dùng tiếp diễn: I want a coffee (không nói I am wanting)."]
      }
    ],
    examples: [
      { en: "I am reading a book now.", vi: "Bây giờ tôi đang đọc sách." },
      { en: "She is cooking dinner.", vi: "Cô ấy đang nấu bữa tối." },
      { en: "They are not playing football.", vi: "Họ đang không chơi bóng đá." },
      { en: "Is he sleeping?", vi: "Anh ấy đang ngủ à?" },
      { en: "Look! It is raining.", vi: "Nhìn kìa! Trời đang mưa." }
    ],
    mistakes: [
      { wrong: "I am eat lunch now.", right: "I am eating lunch now.", why: "Sau am / is / are động từ thêm -ing." },
      { wrong: "She is runing.", right: "She is running.", why: "Run gấp đôi phụ âm cuối trước -ing." },
      { wrong: "I am wanting a coffee.", right: "I want a coffee.", why: "Want là động từ trạng thái, không dùng tiếp diễn." }
    ],
    exercises: [
      c("Be quiet! The baby ___.", ["sleeps", "is sleeping", "sleep", "are sleeping"], 1, "Việc đang xảy ra lúc nói nên dùng is sleeping."),
      c("They ___ football at the moment.", ["play", "plays", "are playing", "is playing"], 2, "They + are + V-ing."),
      c("What ___ you doing?", ["is", "are", "do", "does"], 1, "You đi với are."),
      c("He ___ TV now.", ["isn't watching", "doesn't watching", "not watching", "aren't watching"], 0, "He + isn’t + V-ing."),
      c("I ___ a cup of tea right now.", ["want", "am wanting", "wants", "are wanting"], 0, "Want là động từ trạng thái, dùng hiện tại đơn."),
      f("She ___ an email now. (write)", ["is writing", "'s writing"], "Bỏ e rồi thêm -ing: writing.", "write"),
      f("The children ___ in the park. (run)", ["are running", "'re running"], "Run gấp đôi n: running.", "run"),
      f("I ___ at the moment. (not / study)", ["am not studying", "'m not studying"], "Phủ định: am not + V-ing.", "not / study"),
      o("Cô ấy đang nấu bữa tối.", "She is cooking dinner.", "She + is + V-ing."),
      o("Lúc này họ đang không chơi bóng đá.", "They are not playing football.", "They + are not + V-ing.")
    ]
  },
  {
    id: "can-cant",
    level: "A1",
    title: "Can and can't",
    titleVi: "Can / can't (khả năng, xin phép)",
    summary: "Can diễn tả khả năng, xin phép và nhờ vả. Sau can là động từ nguyên mẫu, không có to và không thêm -s.",
    rules: [
      {
        title: "Hình thức",
        points: ["Chủ ngữ + can + động từ nguyên mẫu: She can swim.", "Phủ định: can’t hoặc cannot. Câu hỏi: Can you swim? Trả lời: Yes, I can. / No, I can’t."]
      },
      {
        title: "Cách dùng",
        points: ["Khả năng: I can speak English.", "Xin phép: Can I open the window?", "Nhờ giúp: Can you help me, please?"]
      }
    ],
    examples: [
      { en: "I can swim.", vi: "Tôi biết bơi." },
      { en: "She can't drive.", vi: "Cô ấy không biết lái xe." },
      { en: "Can you speak English?", vi: "Bạn nói được tiếng Anh không?" },
      { en: "Can I sit here?", vi: "Tôi ngồi đây được không?" },
      { en: "He can play the guitar very well.", vi: "Anh ấy chơi guitar rất giỏi." }
    ],
    mistakes: [
      { wrong: "She cans swim.", right: "She can swim.", why: "Can không thêm -s với he / she / it." },
      { wrong: "I can to swim.", right: "I can swim.", why: "Sau can không dùng to." },
      { wrong: "He can speaks English.", right: "He can speak English.", why: "Sau can động từ để nguyên mẫu." }
    ],
    exercises: [
      c("She ___ play the piano.", ["can", "cans", "can to", "is can"], 0, "Can giữ nguyên với mọi chủ ngữ."),
      c("I ___ swim, but I can ride a bike.", ["can't", "don't can", "not can", "am not can"], 0, "Phủ định của can là can’t."),
      c("___ you help me, please?", ["Do", "Can", "Are", "Does"], 1, "Nhờ giúp dùng Can you ...?"),
      c("He can ___ three languages.", ["speaks", "speak", "speaking", "to speak"], 1, "Sau can động từ nguyên mẫu."),
      c("Can I open the window? — Yes, you ___.", ["can", "do", "are", "does"], 0, "Trả lời ngắn dùng lại can."),
      f("My brother ___ cook. (phủ định)", ["can't", "cannot"], "Phủ định của can là can’t hoặc cannot.", "phủ định"),
      f("___ you speak Japanese? (hỏi về khả năng)", ["Can"], "Hỏi về khả năng dùng Can.", "can"),
      f("She can ___ very fast. (run)", ["run"], "Sau can động từ nguyên mẫu.", "run"),
      o("Tôi có thể bơi.", "I can swim.", "Chủ ngữ + can + động từ."),
      o("Bạn có thể nói tiếng Anh không?", "Can you speak English?", "Câu hỏi: Can + chủ ngữ + động từ.")
    ]
  },
  {
    id: "prepositions-in-on-at",
    level: "A1",
    title: "Prepositions: in / on / at",
    titleVi: "Giới từ in / on / at",
    summary: "In, on, at dùng cho cả thời gian và nơi chốn. Mỗi từ có một “vùng” riêng, nhớ theo nhóm sẽ dễ hơn.",
    rules: [
      {
        title: "Thời gian",
        points: ["at + thời điểm: at 7 o’clock, at noon, at night.", "on + ngày: on Monday, on 5 May, on my birthday.", "in + buổi trong ngày, tháng, năm, mùa: in the morning, in May, in 2024, in summer."]
      },
      {
        title: "Nơi chốn",
        points: ["at + một điểm: at home, at school, at the bus stop.", "on + bề mặt: on the table, on the wall, on the second floor.", "in + không gian bao quanh: in a room, in a car, in Hanoi."]
      }
    ],
    examples: [
      { en: "I get up at six.", vi: "Tôi dậy lúc sáu giờ." },
      { en: "We have a party on Saturday.", vi: "Chúng tôi có tiệc vào thứ Bảy." },
      { en: "She was born in 1998.", vi: "Cô ấy sinh năm 1998." },
      { en: "The keys are on the table.", vi: "Chìa khóa ở trên bàn." },
      { en: "He lives in Da Nang.", vi: "Anh ấy sống ở Đà Nẵng." }
    ],
    mistakes: [
      { wrong: "I will see you in Monday.", right: "I will see you on Monday.", why: "Thứ trong tuần dùng on." },
      { wrong: "My birthday is in 12 May.", right: "My birthday is on 12 May.", why: "Ngày cụ thể dùng on, tháng đứng một mình dùng in." },
      { wrong: "I live at Hanoi.", right: "I live in Hanoi.", why: "Thành phố là không gian rộng nên dùng in." }
    ],
    exercises: [
      c("The meeting is ___ 9 o'clock.", ["in", "on", "at", "of"], 2, "Giờ cụ thể dùng at."),
      c("My birthday is ___ June.", ["in", "on", "at", "to"], 0, "Tháng dùng in."),
      c("We go to the beach ___ Sundays.", ["in", "on", "at", "of"], 1, "Thứ trong tuần dùng on."),
      c("She lives ___ Ho Chi Minh City.", ["at", "on", "in", "to"], 2, "Thành phố dùng in."),
      c("The book is ___ the table.", ["in", "at", "on", "to"], 2, "Trên bề mặt dùng on."),
      f("I wake up ___ 6 a.m.", ["at"], "Giờ cụ thể dùng at."),
      f("He was born ___ 2001.", ["in"], "Năm dùng in."),
      f("Let's meet ___ Friday.", ["on"], "Thứ trong tuần dùng on."),
      o("Họ ở nhà vào buổi tối.", "They are at home in the evening.", "at home (nơi chốn), in the evening (buổi trong ngày).", ["In the evening they are at home."]),
      o("Chìa khóa ở trên bàn.", "The keys are on the table.", "Trên bề mặt dùng on.")
    ]
  }
];
