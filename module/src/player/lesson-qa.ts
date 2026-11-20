export type LessonAnswer = {
  language: "en" | "am";
  answer: string;
  supported: boolean;
};

const answers = {
  en: {
    main: "The speaker reflects on learning from short online videos and contrasts those focused segments with longer lectures. The lesson presents this as the speaker's experience, not a rule that every learner should follow.",
    fourMinutes:
      "The speaker says 4 minutes 12 seconds is the average YouTube video length and uses it to describe how they experience learning in short chunks. Treat that number as the speaker's claim in this clip, not as a verified current statistic.",
    comparison:
      "The speaker says ideas in a long lecture can still arrive in short sections, while a less structured lecture may stay on one point for much longer. The contrast is about how clearly ideas are divided, not simply the total video length.",
    unsupported:
      "I can't find that in this lesson. I can answer questions about the main idea, the 4 minutes 12 seconds figure, and the comparison between short video segments and lectures.",
  },
  am: {
    main: "ተናጋሪው ከአጭር የመስመር ላይ ቪዲዮዎች ስለመማር ያሰላስላል፤ እነዚህን ክፍሎች ከረጅም ንግግሮች ጋር ያነጻጽራል። ይህ የተናጋሪው ተሞክሮ ነው፤ ሁሉም ተማሪዎች መከተል ያለባቸው ሕግ አይደለም።",
    fourMinutes:
      "ተናጋሪው 4 ደቂቃ ከ12 ሰከንድ የYouTube ቪዲዮ አማካይ ርዝመት ነው ይላል፤ ይህንም በአጭር ክፍሎች የመማር ተሞክሮውን ለመግለጽ ይጠቀምበታል። ቁጥሩን በዚህ ቪዲዮ ውስጥ እንደተናጋሪው አባባል ይውሰዱት፤ የዛሬ የተረጋገጠ ስታቲስቲክስ አይደለም።",
    comparison:
      "ተናጋሪው በረጅም ንግግር ውስጥም ሐሳቦች በአጭር ክፍሎች ሊቀርቡ እንደሚችሉ ይገልጻል። ነጥቦች በግልጽ ካልተከፋፈሉ ግን አንድ ሐሳብ ረጅም ጊዜ ሊቆይ ይችላል። ንጽጽሩ ስለ ሐሳቦች አቀራረብ ነው፤ ስለ ቪዲዮው አጠቃላይ ርዝመት ብቻ አይደለም።",
    unsupported:
      "ስለ ትምህርቱ ዋና ሐሳብ፣ ስለ 4 ደቂቃ ከ12 ሰከንድ ቁጥር፣ እና ስለ አጭር ቪዲዮዎችና ንግግሮች ንጽጽር መልስ መስጠት እችላለሁ። ለዚህ ጥያቄ የሚመልስ በቂ የትምህርት መረጃ የለኝም።",
  },
} as const;

function hasAmharic(text: string): boolean {
  return /[\u1200-\u137f]/u.test(text);
}

/** Returns only answers supported by this lesson's transcript; no remote model or new API is used. */
export function answerLessonQuestion(question: string, lessonId: string): LessonAnswer {
  const language = hasAmharic(question) ? "am" : "en";
  const text = question.trim().toLocaleLowerCase();
  const copy = answers[language];
  if (!text || (lessonId !== "L-102" && lessonId !== "L-103")) {
    return { language, answer: copy.unsupported, supported: false };
  }

  const asksAboutDuration =
    language === "am"
      ? /4|12|ደቂቃ|ሰከንድ|ዩቲዩብ|አማካይ/u.test(text)
      : /4\s*minutes?|four\s+minutes?|4\s*[:.]\s*12|twelve\s+seconds?|average\s+(video\s+)?length|youtube/u.test(
          text,
        );
  if (asksAboutDuration) return { language, answer: copy.fourMinutes, supported: true };

  const asksAboutComparison =
    language === "am"
      ? /ንግግር|ረጅም|ንጽጽር|አነጻጽር|ክፍል|የሚለያይ/u.test(text)
      : /lecture|compare|comparison|difference|long|chunks?/u.test(text);
  if (asksAboutComparison) return { language, answer: copy.comparison, supported: true };

  const asksAboutMainIdea =
    language === "am"
      ? /ዋና|ሐሳብ|ሀሳብ|ቁልፍ|ስለ\s*ምን|ትምህርት/u.test(text)
      : /main idea|key idea|lesson about|what is this about|summary|point/u.test(text);
  if (asksAboutMainIdea) return { language, answer: copy.main, supported: true };

  return { language, answer: copy.unsupported, supported: false };
}
