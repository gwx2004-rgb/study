import type { ExamKind } from "./user-store";

export type ExamTopicPart = "part1" | "part2" | "independent";

export interface ExamTopic {
  id: string;
  exam: "IELTS" | "TOEFL";
  part: ExamTopicPart;
  /** English title shown to the model */
  title: string;
  titleZh?: string;
  /** Part 2 cue-card bullets */
  cues?: string[];
  /** Part 1 / TOEFL starter questions */
  questions?: string[];
  /** Part 3 follow-up hints for the model */
  followUps?: string[];
}

const IELTS_PART1: ExamTopic[] = [
  {
    id: "ielts-p1-evening",
    exam: "IELTS",
    part: "part1",
    title: "Evening time",
    titleZh: "晚间时光",
    questions: [
      "Do you like the morning or evening?",
      "What do you usually do in the evening?",
      "What did you do in the evening when you were little?",
      "Are there any differences between what you do in the evening now and in the past?",
    ],
  },
  {
    id: "ielts-p1-morning",
    exam: "IELTS",
    part: "part1",
    title: "Morning routines",
    titleZh: "晨间习惯",
    questions: [
      "What do you do right after getting up in the morning?",
      "Is breakfast important to you?",
      "What is your morning routine?",
      "Do you like to get up early in the morning?",
    ],
  },
  {
    id: "ielts-p1-sports",
    exam: "IELTS",
    part: "part1",
    title: "Sports programs",
    titleZh: "体育节目",
    questions: [
      "Do you like watching sports programs on TV?",
      "Do you like to watch live sports games?",
      "Who do you like to watch sports games with?",
      "Have you ever watched a sports game in a stadium?",
    ],
  },
  {
    id: "ielts-p1-old-buildings",
    exam: "IELTS",
    part: "part1",
    title: "Old buildings",
    titleZh: "老建筑",
    questions: [
      "Have you ever seen old buildings in the city?",
      "Do you think we should preserve old buildings in cities?",
      "Do you prefer living in an old building or a modern house?",
    ],
  },
  {
    id: "ielts-p1-films",
    exam: "IELTS",
    part: "part1",
    title: "Films / cinemas",
    titleZh: "电影与影院",
    questions: [
      "What films do you like?",
      "Did you often watch films when you were a child?",
      "Do you often go to the cinema with your friends?",
      "Do you prefer to watch films at home or in the cinema?",
    ],
  },
  {
    id: "ielts-p1-history",
    exam: "IELTS",
    part: "part1",
    title: "History",
    titleZh: "历史",
    questions: [
      "Have you ever been to historical museums?",
      "Do you like history?",
      "When was the last time you read about history?",
      "Did you like history when you were young?",
    ],
  },
  {
    id: "ielts-p1-headphones",
    exam: "IELTS",
    part: "part1",
    title: "Headphones",
    titleZh: "耳机",
    questions: [
      "Do you use headphones?",
      "What type of headphones do you use?",
      "When would you use headphones?",
    ],
  },
  {
    id: "ielts-p1-jokes",
    exam: "IELTS",
    part: "part1",
    title: "Jokes & comedies",
    titleZh: "笑话与喜剧",
    questions: [
      "Are you good at telling jokes?",
      "Do your friends like to tell jokes?",
      "Do you like to watch comedies?",
      "Have you ever watched a live show?",
    ],
  },
  {
    id: "ielts-p1-clothing",
    exam: "IELTS",
    part: "part1",
    title: "Clothing",
    titleZh: "穿着",
    questions: [
      "What kind of clothes do you like to wear?",
      "Do you prefer comfortable casual clothes or smart clothes?",
      "Do you like wearing T-shirts?",
    ],
  },
  {
    id: "ielts-p1-singing",
    exam: "IELTS",
    part: "part1",
    title: "Singing",
    titleZh: "唱歌",
    questions: [
      "Do you like singing? Why?",
      "Have you ever learnt how to sing?",
      "Who do you want to sing for?",
    ],
  },
  {
    id: "ielts-p1-space",
    exam: "IELTS",
    part: "part1",
    title: "Outer space and stars",
    titleZh: "外太空与星星",
    questions: [
      "Have you ever learnt about outer space and stars?",
      "Do you like science fiction movies? Why?",
      "Do you want to go into outer space in the future?",
    ],
  },
  {
    id: "ielts-p1-science",
    exam: "IELTS",
    part: "part1",
    title: "Science",
    titleZh: "科学",
    questions: [
      "Do you like science?",
      "Which science subject is interesting to you?",
      "Do you like watching science TV programs?",
    ],
  },
  {
    id: "ielts-p1-parks",
    exam: "IELTS",
    part: "part1",
    title: "Parks",
    titleZh: "公园",
    questions: [
      "Did you like going to parks as a child?",
      "Do you still like going to parks now?",
      "Would you like to see more parks in your city?",
    ],
  },
  {
    id: "ielts-p1-cars",
    exam: "IELTS",
    part: "part1",
    title: "Cars",
    titleZh: "汽车",
    questions: [
      "Did you enjoy traveling by car when you were a kid?",
      "What types of cars do you like?",
      "Do you prefer to be a driver or a passenger?",
    ],
  },
  {
    id: "ielts-p1-shopping",
    exam: "IELTS",
    part: "part1",
    title: "Shopping",
    titleZh: "购物",
    questions: [
      "Do you like shopping?",
      "How often do you go shopping?",
      "Do you prefer online shopping or in-store shopping?",
    ],
  },
  {
    id: "ielts-p1-watch",
    exam: "IELTS",
    part: "part1",
    title: "Watch",
    titleZh: "手表",
    questions: [
      "Do you wear a watch?",
      "Have you ever got a watch as a gift?",
      "Do you think it is important to wear a watch?",
    ],
  },
  {
    id: "ielts-p1-websites",
    exam: "IELTS",
    part: "part1",
    title: "Websites",
    titleZh: "网站",
    questions: [
      "What kinds of websites do you often visit?",
      "What is your favourite website?",
      "What kinds of websites are popular in your country?",
    ],
  },
  {
    id: "ielts-p1-teachers",
    exam: "IELTS",
    part: "part1",
    title: "Teachers",
    titleZh: "老师",
    questions: [
      "Do you have a favorite teacher?",
      "Do you want to be a teacher in the future?",
      "In what way has your favourite teacher helped you?",
    ],
  },
  {
    id: "ielts-p1-social-media",
    exam: "IELTS",
    part: "part1",
    title: "Social media",
    titleZh: "社交媒体",
    questions: [
      "When did you start using social media?",
      "Do you think you spend too much time on social media?",
      "What do people often do on social media?",
    ],
  },
  {
    id: "ielts-p1-dream",
    exam: "IELTS",
    part: "part1",
    title: "Dream and ambition",
    titleZh: "梦想与抱负",
    questions: [
      "What was your childhood dream?",
      "What is your dream job?",
      "Do you think you are an ambitious person?",
    ],
  },
  {
    id: "ielts-p1-music",
    exam: "IELTS",
    part: "part1",
    title: "Music",
    titleZh: "音乐",
    questions: [
      "Do you prefer sad or happy music?",
      "Does happy music make you feel more excited?",
    ],
  },
];

const IELTS_PART2: ExamTopic[] = [
  {
    id: "ielts-p2-traffic",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you were stuck in a traffic jam for a very long time",
    titleZh: "交通拥堵",
    cues: ["When it happened", "Where you were stuck", "What you did while waiting", "And explain how you felt"],
    followUps: [
      "How can we solve the traffic jam problem?",
      "Do you think developing public transport can help?",
      "Would you rather be in a car or a bus in a traffic jam?",
    ],
  },
  {
    id: "ielts-p2-ambition",
    exam: "IELTS",
    part: "part2",
    title: "Describe a long-term goal or ambition you would like to achieve",
    titleZh: "长久目标/抱负",
    cues: [
      "How long you have had this goal",
      "What it is",
      "How you will achieve it",
      "And explain why you set it",
    ],
    followUps: [
      "Do people need to have goals?",
      "What goals do people at your age have?",
      "What should people do to achieve their goals?",
    ],
  },
  {
    id: "ielts-p2-happy-event",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you organized a happy event successfully",
    titleZh: "组织快乐活动",
    cues: ["What the event was", "How you prepared for it", "Who helped you", "And explain why it was successful"],
    followUps: [
      "How can parents help children to be organized?",
      "On what occasions do people need to be organized?",
    ],
  },
  {
    id: "ielts-p2-no-reply",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you sent a message but received no reply for a long time",
    titleZh: "很久没收到回复的信息",
    cues: ["Who you sent it to", "What the message was about", "Whether you finally received a reply", "And explain how you felt"],
    followUps: [
      "Why do some people prefer sending a message instead of making a call?",
      "What would you do if you haven't received a reply?",
    ],
  },
  {
    id: "ielts-p2-env-law",
    exam: "IELTS",
    part: "part2",
    title: "Describe a law on environmental protection",
    titleZh: "保护环境的法律",
    cues: ["What it is", "How you first learned about it", "Who benefits from it", "And explain how you feel about this law"],
    followUps: ["What is the purpose of punishment?", "What rules should people obey at work?"],
  },
  {
    id: "ielts-p2-cheap-day-out",
    exam: "IELTS",
    part: "part2",
    title: "Describe a special day out that cost you little money",
    titleZh: "花费甚少的外出日",
    cues: ["When the day was", "Where you went", "How much you spent", "And explain how you feel about the day"],
    followUps: [
      "How do people spend their leisure time in your country?",
      "Why do people like to have days off?",
    ],
  },
  {
    id: "ielts-p2-help-problem",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when a person helped you solve a problem",
    titleZh: "别人帮助解决问题",
    cues: ["Who the person is", "What the problem was", "How he/she helped you", "And explain how you felt"],
    followUps: ["How important is it for schools to help children become smarter?"],
  },
  {
    id: "ielts-p2-animal-story",
    exam: "IELTS",
    part: "part2",
    title: "Describe a story or book with animals in it",
    titleZh: "包含动物的故事或书",
    cues: ["What animals are in it", "What the story is about", "Why you read it", "And explain what you think of it"],
    followUps: [
      "Should schools teach children about animals?",
      "What are the advantages of keeping a pet?",
    ],
  },
  {
    id: "ielts-p2-river-lake",
    exam: "IELTS",
    part: "part2",
    title: "Describe an important river or lake in your country",
    titleZh: "重要河流/湖泊",
    cues: ["Where it is located", "How big/long it is", "What it looks like", "And explain why it is important"],
    followUps: [
      "Are rivers and lakes important to a country?",
      "How do rivers and lakes affect local tourism?",
    ],
  },
  {
    id: "ielts-p2-learn-language",
    exam: "IELTS",
    part: "part2",
    title: "Describe something you did to learn another language",
    titleZh: "语言学习",
    cues: ["What language you learned", "What you did", "How it helped you", "And explain how you felt"],
    followUps: [
      "What difficulties do people face when learning a language?",
      "What's the best way to learn a language?",
    ],
  },
  {
    id: "ielts-p2-visit-home",
    exam: "IELTS",
    part: "part2",
    title: "Describe a home that you like to visit but do not want to live in",
    titleZh: "喜欢拜访但不想住的家",
    cues: ["Where it is", "What it is like", "Why you like to visit it", "And explain why you would not like to live there"],
    followUps: ["What kind of place do people in your country like to live in?"],
  },
  {
    id: "ielts-p2-broken-device",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you had a problem with using an electronic device",
    titleZh: "坏掉的电子设备",
    cues: ["When it happened", "Where it happened", "What the problem was", "And explain how you solved it"],
    followUps: ["Why are people keen on buying new electronic devices?"],
  },
  {
    id: "ielts-p2-tv-show",
    exam: "IELTS",
    part: "part2",
    title: "Describe a TV show or online program you have watched recently",
    titleZh: "最近看过的电视/网络节目",
    cues: ["What it is", "What it is about", "How often you watch it", "And explain how you feel about it"],
    followUps: ["What makes a popular TV or online program?"],
  },
  {
    id: "ielts-p2-travel-recommend",
    exam: "IELTS",
    part: "part2",
    title: "Describe a place you have travelled to that you would like to recommend",
    titleZh: "推荐旅行过的地方",
    cues: ["What it is", "Where it is", "What you saw and did there", "And explain why you would recommend it"],
    followUps: [
      "Where do people in your country often go for holidays?",
      "What is the ideal length for a holiday?",
    ],
  },
  {
    id: "ielts-p2-celebrity-ad",
    exam: "IELTS",
    part: "part2",
    title: "Describe an advertisement with a famous person in it",
    titleZh: "名人出演的广告",
    cues: ["Who the person is", "Where you can see it", "What the ad is about", "And explain how you feel about it"],
    followUps: ["Why are many advertisements endorsed by celebrities?"],
  },
  {
    id: "ielts-p2-tech-problem",
    exam: "IELTS",
    part: "part2",
    title: "Describe a challenging technological problem you faced",
    titleZh: "遇到的科技问题",
    cues: ["What the problem was", "When and where you faced it", "How challenging it was", "And explain how you solved it"],
    followUps: [
      "What are the advantages and disadvantages of AI?",
      "Do you think students are overly reliant on AI?",
    ],
  },
  {
    id: "ielts-p2-language-person",
    exam: "IELTS",
    part: "part2",
    title: "Describe a person who is good at learning and speaking new languages",
    titleZh: "擅长学习和说语言的人",
    cues: ["How you got to know him/her", "How he/she learns languages", "What languages he/she speaks", "And explain how you feel about him/her"],
    followUps: ["Does speaking other languages help at work?"],
  },
  {
    id: "ielts-p2-special-food",
    exam: "IELTS",
    part: "part2",
    title: "Describe a food that people eat on special occasions",
    titleZh: "特别场合的食物",
    cues: ["What it is", "What the special occasion is", "How it is cooked/made", "And explain why people eat it then"],
    followUps: ["What are the differences between everyday food and festival food?"],
  },
  {
    id: "ielts-p2-live-sports",
    exam: "IELTS",
    part: "part2",
    title: "Describe a live sports event you watched and liked",
    titleZh: "喜欢的现场体育赛事",
    cues: ["What it was", "When and where you watched it", "Who you watched it with", "And explain why you liked it"],
    followUps: ["Why do some people like to watch sports events?"],
  },
  {
    id: "ielts-p2-decision",
    exam: "IELTS",
    part: "part2",
    title: "Describe an important decision that you made",
    titleZh: "重要决定",
    cues: ["What the decision was", "How you made your decision", "What the results were", "And explain why it was important"],
    followUps: [
      "What important decisions do teenagers need to make after graduation?",
      "Do advertisements influence our decisions when shopping?",
    ],
  },
  {
    id: "ielts-p2-group-work",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you worked in a group",
    titleZh: "在团队中工作",
    cues: ["What you did", "Who you worked with", "What problems you faced", "And explain why you worked in the group"],
    followUps: ["Should students learn to do group work?"],
  },
  {
    id: "ielts-p2-changed-plan",
    exam: "IELTS",
    part: "part2",
    title: "Describe a plan that you had to change recently",
    titleZh: "近期改变的计划",
    cues: ["When this happened", "What made you change the plan", "What the new plan was", "And explain how you felt"],
    followUps: ["Do people often change their plans?"],
  },
  {
    id: "ielts-p2-successful-business",
    exam: "IELTS",
    part: "part2",
    title: "Describe a person you know who has a successful business",
    titleZh: "拥有成功商业的人",
    cues: ["Who this person is", "How you got to know him/her", "What business he/she does", "And explain why it is successful"],
    followUps: ["Why do some people start their own business?"],
  },
  {
    id: "ielts-p2-childhood-friend",
    exam: "IELTS",
    part: "part2",
    title: "Describe a friend from your childhood",
    titleZh: "发小",
    cues: ["Who he/she is", "Where and how you met", "What you often did together", "And explain what made you like him/her"],
    followUps: [
      "Do you still keep in touch with childhood friends?",
      "How important is childhood friendship?",
    ],
  },
  {
    id: "ielts-p2-new-law",
    exam: "IELTS",
    part: "part2",
    title: "Describe a new law you would like to introduce in your country",
    titleZh: "想颁布的新法律",
    cues: ["What law it is", "What changes it brings", "Whether it will be popular", "And explain how you feel"],
    followUps: ["Do people in your country usually obey the law?"],
  },
  {
    id: "ielts-p2-plants",
    exam: "IELTS",
    part: "part2",
    title: "Describe a person who loves to grow plants at home or in the garden",
    titleZh: "喜欢种植物的人",
    cues: ["Who this person is", "What plants he/she grows", "How he/she grows them", "And explain why he/she loves it"],
    followUps: ["What are the advantages of growing vegetables at home?"],
  },
  {
    id: "ielts-p2-early-morning",
    exam: "IELTS",
    part: "part2",
    title: "Describe a time when you got up early",
    titleZh: "早起经历",
    cues: ["When it was", "What you did", "Why you got up early", "And explain how you felt"],
    followUps: ["Why do people get up early?"],
  },
  {
    id: "ielts-p2-favorite-city",
    exam: "IELTS",
    part: "part2",
    title: "Describe your favorite city that you have visited",
    titleZh: "去过的最喜欢的城市",
    cues: ["Where it is", "How you knew it", "When you visited it", "And explain why it is your favourite"],
    followUps: ["How do people choose a city to travel to?"],
  },
  {
    id: "ielts-p2-boring-place",
    exam: "IELTS",
    part: "part2",
    title: "Describe a boring place",
    titleZh: "去过的无聊地方",
    cues: ["Where it is", "Who you went there with", "What you did there", "And explain why it was boring"],
    followUps: ["What can people do when they feel bored?"],
  },
  {
    id: "ielts-p2-video",
    exam: "IELTS",
    part: "part2",
    title: "Describe an interesting video",
    titleZh: "有趣视频",
    cues: ["When and where you watched it", "What it is about", "Why you watched it", "And explain how you feel"],
    followUps: ["Which is more helpful, watching videos or reading books?"],
  },
  {
    id: "ielts-p2-tall-building",
    exam: "IELTS",
    part: "part2",
    title: "Describe a tall building you like or dislike",
    titleZh: "喜欢或不喜欢的高建筑",
    cues: ["What it is used for", "Where it is", "What it looks like", "And explain why you like or dislike it"],
    followUps: ["Are there many tall buildings in your country?"],
  },
];

/** TOEFL Independent Speaking style prompts (Task 1 personal preference / experience) */
const TOEFL_INDEPENDENT: ExamTopic[] = [
  {
    id: "toefl-pref-study",
    exam: "TOEFL",
    part: "independent",
    title: "Do you prefer studying alone or in a group?",
    titleZh: "独自学习还是小组学习",
    questions: [
      "Do you prefer studying alone or in a group?",
      "What are the advantages of your choice?",
      "Can you give a specific example from your experience?",
    ],
  },
  {
    id: "toefl-pref-city",
    exam: "TOEFL",
    part: "independent",
    title: "Do you prefer living in a big city or in the countryside?",
    titleZh: "城市还是乡村",
    questions: [
      "Which do you prefer and why?",
      "What is one thing you like most about your choice?",
    ],
  },
  {
    id: "toefl-exp-trip",
    exam: "TOEFL",
    part: "independent",
    title: "Describe a memorable trip you have taken",
    titleZh: "难忘的旅行",
    questions: [
      "Where did you go?",
      "Who did you go with?",
      "What made it memorable?",
    ],
  },
  {
    id: "toefl-exp-influence",
    exam: "TOEFL",
    part: "independent",
    title: "Describe a person who has influenced you",
    titleZh: "影响你的人",
    questions: [
      "Who is this person?",
      "How did you meet them?",
      "How have they influenced you?",
    ],
  },
  {
    id: "toefl-pref-online-class",
    exam: "TOEFL",
    part: "independent",
    title: "Do you prefer online classes or in-person classes?",
    titleZh: "网课还是线下课",
    questions: [
      "Which do you prefer and why?",
      "What is one challenge of the other option?",
    ],
  },
  {
    id: "toefl-exp-skill",
    exam: "TOEFL",
    part: "independent",
    title: "Describe an important skill you want to learn",
    titleZh: "想学的技能",
    questions: [
      "What skill is it?",
      "Why do you want to learn it?",
      "How will you learn it?",
    ],
  },
  {
    id: "toefl-pref-morning-night",
    exam: "TOEFL",
    part: "independent",
    title: "Are you a morning person or a night owl?",
    titleZh: "早起型还是夜猫型",
    questions: [
      "Which are you and why?",
      "How does this affect your daily routine?",
    ],
  },
  {
    id: "toefl-exp-book-movie",
    exam: "TOEFL",
    part: "independent",
    title: "Describe a book or movie that impressed you",
    titleZh: "印象深刻的书或电影",
    questions: [
      "What is it about?",
      "When did you read or watch it?",
      "Why did it impress you?",
    ],
  },
  {
    id: "toefl-pref-public-transport",
    exam: "TOEFL",
    part: "independent",
    title: "Do you prefer using public transport or driving your own car?",
    titleZh: "公共交通还是自驾",
    questions: [
      "Which do you prefer in your daily life?",
      "Give one reason for your preference.",
    ],
  },
  {
    id: "toefl-exp-challenge",
    exam: "TOEFL",
    part: "independent",
    title: "Describe a challenge you faced and how you dealt with it",
    titleZh: "面对的挑战",
    questions: [
      "What was the challenge?",
      "What did you do to handle it?",
      "What did you learn from it?",
    ],
  },
  {
    id: "toefl-pref-social-media",
    exam: "TOEFL",
    part: "independent",
    title: "How has social media changed the way people communicate?",
    titleZh: "社交媒体如何改变沟通",
    questions: [
      "Do you think the change is mostly positive or negative?",
      "Give an example from your own life.",
    ],
  },
  {
    id: "toefl-exp-volunteer",
    exam: "TOEFL",
    part: "independent",
    title: "Describe a volunteer or community activity you participated in",
    titleZh: "志愿/社区活动",
    questions: [
      "What did you do?",
      "Why did you join?",
      "How did you feel afterward?",
    ],
  },
];

const IELTS_POOL = [...IELTS_PART1, ...IELTS_PART2];

export const ALL_EXAM_TOPICS: ExamTopic[] = [...IELTS_POOL, ...TOEFL_INDEPENDENT];

export function getExamTopicById(id: string): ExamTopic | undefined {
  return ALL_EXAM_TOPICS.find((t) => t.id === id);
}

export function isExamPrepExam(exam: ExamKind): exam is "IELTS" | "TOEFL" {
  return exam === "IELTS" || exam === "TOEFL";
}

export function pickRandomExamTopic(exam: "IELTS" | "TOEFL"): ExamTopic {
  const pool = exam === "IELTS" ? IELTS_POOL : TOEFL_INDEPENDENT;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function examTopicLabel(topic: ExamTopic): string {
  if (topic.part === "part1") return `IELTS Part 1 · ${topic.title}`;
  if (topic.part === "part2") return `IELTS Part 2 · ${topic.titleZh ?? topic.title}`;
  return `TOEFL · ${topic.titleZh ?? topic.title}`;
}

/** 话题选择器里显示的短标签 */
export function examTopicShortLabel(topic: ExamTopic): string {
  if (topic.titleZh) return topic.titleZh;
  return topic.title.length > 36 ? `${topic.title.slice(0, 36)}…` : topic.title;
}
