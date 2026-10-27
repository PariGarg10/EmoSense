/**
 * Offline Helpbot answers. Works out what kind of question was asked
 * (social cue, body symptom, a specific emotion, a comparison, coping, app
 * help) and answers that question in plain, literal language, using the
 * emotion dictionary in data/emotions.ts.
 */

import { emotions, type EmotionRecord } from "@/data/emotions";

export type HelpbotTopic =
  | "greeting"
  | "thanks"
  | "social"
  | "symptom"
  | "regulation"
  | "compare"
  | "emotion"
  | "feeling-statement"
  | "app"
  | "unknown";

export type HelpbotAnswer = { topic: HelpbotTopic; reply: string };

type Rule = { test: RegExp; reply: string };

/* ---------------------------------------------------------------- emotions */

const EMOTION_WORDS: Record<string, RegExp> = {
  Joy: /\b(joy|joyful|happy|happiness|glad|excited|excitement|proud)\b/,
  Sadness: /\b(sad|sadness|unhappy|grief|grieving|heartbroken)\b/,
  Anger: /\b(anger|angry|mad|furious|annoyed|frustrat\w*|irritat\w*|rage)\b/,
  Fear: /\b(fear|scared|afraid|frightened|terrified)\b/,
  Surprise: /\b(surprise|surprised|shock|shocked|startled)\b/,
  Disgust: /\b(disgust|disgusted|disgusting|gross|grossed out)\b/,
  Calm: /\b(calm|calmness|relaxed|peaceful)\b/,
  Confused: /\b(confused|confusion|confusing|puzzled)\b/,
  Anxiety: /\b(anxiety|anxious|worry|worried|worries|nervous|stress|stressed)\b/,
  Lonely: /\b(lonely|loneliness|alone|isolated|left out)\b/,
  Embarrassed: /\b(embarrass\w*|ashamed|shame|awkward)\b/,
  Affectionate: /\b(affection|affectionate|caring|love)\b/,
  Envious: /\b(envy|envious|jealous|jealousy)\b/,
  Bored: /\b(bored|boredom|boring)\b/,
  Accepting: /\b(accepting|acceptance)\b/,
  Trusting: /\b(trust|trusting)\b/,
};

function findEmotions(text: string): EmotionRecord[] {
  // "calm down" / "settle down" are requests for help, not the emotion Calm.
  const cleaned = text.replace(/\bcalm(ing)? (myself )?down\b/g, " ").replace(/\bcalm me\b/g, " ");
  const hits: { record: EmotionRecord; index: number }[] = [];
  for (const [name, re] of Object.entries(EMOTION_WORDS)) {
    const m = cleaned.match(re);
    const record = emotions.find((e) => e.name === name);
    if (m && record) hits.push({ record, index: m.index ?? 0 });
  }
  return hits.sort((a, b) => a.index - b.index).map((h) => h.record);
}

/** Noun used in sentences ("Loneliness in the body...") and adjective ("feeling lonely"). */
const WORDS: Record<string, { noun: string; adj: string }> = {
  Joy: { noun: "Joy", adj: "happy" },
  Sadness: { noun: "Sadness", adj: "sad" },
  Anger: { noun: "Anger", adj: "angry" },
  Fear: { noun: "Fear", adj: "scared" },
  Surprise: { noun: "Surprise", adj: "surprised" },
  Disgust: { noun: "Disgust", adj: "disgusted" },
  Calm: { noun: "Calm", adj: "calm" },
  Confused: { noun: "Confusion", adj: "confused" },
  Anxiety: { noun: "Anxiety", adj: "anxious" },
  Lonely: { noun: "Loneliness", adj: "lonely" },
  Embarrassed: { noun: "Embarrassment", adj: "embarrassed" },
  Affectionate: { noun: "Affection", adj: "affectionate" },
  Envious: { noun: "Envy (jealousy)", adj: "jealous" },
  Bored: { noun: "Boredom", adj: "bored" },
  Accepting: { noun: "Acceptance", adj: "accepting" },
  Trusting: { noun: "Trust", adj: "trusting" },
};
const noun = (e: EmotionRecord) => WORDS[e.name]?.noun ?? e.name;
const adj = (e: EmotionRecord) => WORDS[e.name]?.adj ?? e.name.toLowerCase();

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function list(items: string[]) {
  return items.map((s) => lowerFirst(s.replace(/\.$/, ""))).join("; ");
}

function steps(items: string[]) {
  return items.map((s, i) => `${i + 1}. ${s.replace(/\.$/, "")}.`).join("\n");
}

/* ---------------------------------------------------------------- social cues */

const SOCIAL: Rule[] = [
  {
    test: /\b(sarcas\w*|ironic|irony|not mean (it|what))\b/,
    reply:
      "Sarcasm is when someone says the opposite of what they mean, often to joke or to show they are annoyed.\n" +
      "Signs it might be sarcasm:\n" +
      "1. The words do not match the situation. For example, “Great weather!” while it is pouring with rain.\n" +
      "2. The voice sounds flat, slow or stretched, like “oh, gr-e-a-t”.\n" +
      "3. The face does not match the words: an eye roll, a smirk, or a small smile while saying something negative.\n" +
      "4. Other people laugh, or the person says it about something that clearly went wrong.\n" +
      "If you are not sure, it is okay to ask: “Are you being serious, or is that a joke?”",
  },
  {
    test: /\b(joke|joking|kidding|teas\w*|banter|making fun)\b/,
    reply:
      "Teasing can be friendly or unkind. Here is how to tell:\n" +
      "1. Friendly teasing: the person smiles, their voice is light, they also joke about themselves, and they stop if you look upset.\n" +
      "2. Unkind teasing: it is about something you cannot change, it keeps happening after you ask them to stop, or it makes you feel small.\n" +
      "You can say “Was that a joke?” to check. If it hurts, you can say “I do not like that, please stop” and tell a trusted adult if it continues.",
  },
  {
    test: /\b(tone of voice|their tone|voice tone|sound(s|ed)? (angry|upset|annoyed))\b/,
    reply:
      "Tone of voice can give clues about feelings:\n" +
      "1. Loud and fast often means excited or angry.\n" +
      "2. Quiet and slow often means sad or tired.\n" +
      "3. Sharp, short words often mean annoyed or stressed.\n" +
      "4. A rising sound at the end often means a question or surprise.\n" +
      "Tone is only a clue. The person might be tired or in a hurry. If it matters, ask: “Are you okay?” or “Are you upset with me?”",
  },
  {
    test: /\b(body language|facial expression\w*|read(ing)? (people|faces|someone)|someone'?s face|face mean|roll\w* (their|his|her|my) eyes|eye ?roll\w*|sigh\w*|crossed arms|smirk\w*|frown\w*)\b/,
    reply:
      "Some common body and face clues:\n" +
      "1. Smiling with crinkled eyes usually means happy.\n" +
      "2. Crossed arms, a frown or a tight jaw can mean annoyed or uncomfortable.\n" +
      "3. Looking at the door or a watch can mean they want to leave.\n" +
      "4. Leaning in and nodding usually means they are interested.\n" +
      "5. Rolling eyes or a loud sigh often means annoyed, bored, or that they think something is silly. Between friends it can also be playful.\n" +
      "Clues can be wrong, so look at the situation too. You can try the Read a face tool in EmoSense to practise.",
  },
  {
    test: /\b(eye contact|look (people|someone) in the eye)\b/,
    reply:
      "Eye contact can feel uncomfortable or even painful, and that is okay. Some options:\n" +
      "1. Look at the person’s nose, eyebrows or mouth instead of their eyes.\n" +
      "2. Look briefly, then look away, and repeat.\n" +
      "3. You can tell people “I listen better when I do not look at your eyes.”\n" +
      "Nodding or saying “mm-hm” also shows you are listening.",
  },
  {
    test: /\b(make|making|find|keep) (a )?friends?\b|\bfriendship\b/,
    reply:
      "Making friends often starts small:\n" +
      "1. Look for people who like the same things as you, such as a club, game or class.\n" +
      "2. Start with one question about the shared interest, like “What level are you on?”\n" +
      "3. Listen to their answer and ask one more question.\n" +
      "4. Meet again; friendships grow by spending time together more than once.\n" +
      "It is fine to have a few close friends instead of many.",
  },
  {
    test: /\b(small talk|start a conversation|what to say|conversation|keep talking)\b/,
    reply:
      "A simple way to have a conversation:\n" +
      "1. Start with a greeting and an easy question: “Hi, how was your weekend?”\n" +
      "2. Listen, then say one thing about their answer.\n" +
      "3. Share one short thing about you.\n" +
      "4. Take turns. If you have talked for a while, ask them a question.\n" +
      "5. To end, say “It was nice talking. See you later.”",
  },
  {
    test: /\b(ignor\w*|upset with me|mad at me|angry at me|annoyed with me|don'?t like me|doesn'?t like me|hate me)\b/,
    reply:
      "It is hard when you think someone is upset with you. Remember that people can seem distant because they are busy, tired or thinking about something else.\n" +
      "1. Think about what happened just before. Did something change?\n" +
      "2. If you are unsure, ask directly and calmly: “Are you upset with me?”\n" +
      "3. If they say yes, listen, then say “I did not mean to upset you. What can I do?”\n" +
      "4. If they say no, try to believe them.",
  },
  {
    test: /\b(personal space|too close|stand(ing)? close)\b/,
    reply:
      "Personal space is the gap people like to keep around their body. A good rule is about one arm’s length for most people. If someone steps back, leans away or crosses their arms, they may want more space. If someone is too close to you, you can step back or say “Could you give me a bit more space, please?”",
  },
  {
    test: /\b(interrupt\w*|talk(ing)? too much|monolog\w*)\b/,
    reply:
      "To avoid interrupting:\n" +
      "1. Wait until the other person stops talking and pauses for a second.\n" +
      "2. If you are worried you will forget your idea, write one word down.\n" +
      "3. If you interrupt by accident, say “Sorry, please finish.”\n" +
      "4. If you have talked for a while, ask “What do you think?”",
  },
  {
    test: /\b(apologi[sz]e|say sorry|saying sorry)\b/,
    reply:
      "A clear apology has three parts:\n" +
      "1. Say what you did: “I am sorry I shouted.”\n" +
      "2. Say why it was not okay: “It was loud and upsetting.”\n" +
      "3. Say what you will do next time: “Next time I will take a break first.”\n" +
      "Then give the other person time. They might need a little while before they feel better.",
  },
  {
    test: /\b(say no|saying no|boundar\w*)\b/,
    reply:
      "You are allowed to say no. Some clear ways:\n" +
      "1. “No, thank you.”\n" +
      "2. “I do not want to do that.”\n" +
      "3. “Not right now. Maybe later.”\n" +
      "You do not have to give a long reason. If someone keeps pushing, walk away and tell a trusted adult.",
  },
  {
    test: /\b(bull(y|ied|ying)|picking on me|being mean to me)\b/,
    reply:
      "Bullying is when someone keeps hurting, scaring or leaving you out on purpose. It is not your fault.\n" +
      "1. Move away from the person if you can.\n" +
      "2. Tell a trusted adult, such as a parent, teacher or caregiver, what happened, when and where.\n" +
      "3. Write it down or save messages so you can show someone.\n" +
      "You deserve to feel safe.",
  },
];

/* ---------------------------------------------------------------- body symptoms */

const SYMPTOMS: Rule[] = [
  {
    test: /\b(heart (is )?(rac\w*|pound\w*|beat\w* (fast|hard))|racing heart|fast heart ?beat|palpitation\w*)\b/,
    reply:
      "A racing heart often happens with worry, fear, excitement or after moving fast. Your body is getting ready for action. To help it slow down:\n" +
      "1. Breathe in slowly for 4 counts, hold for 2, and breathe out for 6. Repeat 5 times. A long out-breath tells your body it is safe.\n" +
      "2. Put both feet flat on the floor and press down.\n" +
      "3. Hold something cold, or splash cool water on your face.\n" +
      "4. Name 3 things you can see.\n" +
      "If your heart races often, with chest pain or dizziness, tell a trusted adult or a doctor.",
  },
  {
    test: /\b(can'?t breathe|breath(ing)? (fast|quick|hard)|short of breath|panic attack|hyperventilat\w*)\b/,
    reply:
      "When breathing feels fast or tight, try this:\n" +
      "1. Breathe out first, slowly, like blowing through a straw.\n" +
      "2. Breathe in through your nose for 4 counts.\n" +
      "3. Breathe out for 6 counts. Repeat 5 times.\n" +
      "4. Put a hand on your belly and feel it move.\n" +
      "Panic feels scary, but it passes, usually within a few minutes. If you cannot breathe or have chest pain, get help from an adult or call emergency services.",
  },
  {
    test: /\b(shak\w*|trembl\w*|jittery)\b/,
    reply:
      "Shaking can come from fear, anger, excitement or being cold. It is your body releasing energy. Try:\n" +
      "1. Squeeze your hands into fists for 5 seconds, then let go. Repeat 3 times.\n" +
      "2. Push your palms together hard, then relax.\n" +
      "3. Wrap up in a heavy blanket or hoodie.\n" +
      "4. Breathe out slowly for 6 counts.",
  },
  {
    test: /\b(stomach|tummy|butterflies|feel sick|nause\w*)\b/,
    reply:
      "A tight stomach, butterflies or feeling sick often come with worry or nervousness, because stress affects digestion. To help:\n" +
      "1. Sip cool water slowly.\n" +
      "2. Put a warm hand or a warm pack on your belly.\n" +
      "3. Breathe slowly into your belly for a minute.\n" +
      "4. Name what you are worried about in one sentence.\n" +
      "If you are actually unwell, tell a trusted adult.",
  },
  {
    test: /\b(cry\w*|tears)\b/,
    reply:
      "Crying is a normal way the body lets out big feelings, often sadness, frustration or relief. It is okay to cry. To feel steadier:\n" +
      "1. Find a quiet place if you can.\n" +
      "2. Breathe out slowly a few times.\n" +
      "3. Drink some water and wipe your face with a cool cloth.\n" +
      "4. When you are ready, tell someone one sentence about what happened.",
  },
  {
    test: /\b(can'?t sleep|cannot sleep|insomnia|awake at night|trouble sleeping)\b/,
    reply:
      "When worries keep you awake:\n" +
      "1. Write the worry on paper so your brain can put it down until morning.\n" +
      "2. Keep the room dark, cool and quiet. Try earplugs or soft background noise.\n" +
      "3. Put screens away 30 minutes before bed.\n" +
      "4. Breathe in for 4 and out for 6, or tense and relax each part of your body from toes to head.\n" +
      "If sleep is hard most nights, talk to a caregiver or doctor.",
  },
  {
    test: /\b(face (feels )?hot|hot face|sweat\w*|chest (feels )?tight|tight chest|jaw|clench\w*)\b/,
    reply:
      "A hot face, sweating, a tight chest or a clenched jaw often show anger, stress or embarrassment. Your body is tense and ready to react. To release it:\n" +
      "1. Drop your shoulders and unclench your jaw.\n" +
      "2. Breathe out slowly for 6 counts.\n" +
      "3. Drink cool water or hold something cold.\n" +
      "4. Move away from what is bothering you for a few minutes.",
  },
];

/* ---------------------------------------------------------------- regulation topics */

const REGULATION: Rule[] = [
  {
    test: /\b(meltdown\w*)\b/,
    reply:
      "A meltdown happens when the brain and body are overloaded and cannot cope any more. It is not bad behaviour.\n" +
      "During a meltdown:\n" +
      "1. Go somewhere quiet and safe, or ask for space.\n" +
      "2. Reduce input: lower lights, use headphones, stop talking.\n" +
      "3. Use deep pressure if it helps, like a heavy blanket.\n" +
      "After a meltdown:\n" +
      "4. Rest and drink water. You may feel very tired.\n" +
      "5. Later, note what happened before it in the Mood tracker, so you can spot early signs next time.",
  },
  {
    test: /\b(shut ?down\w*|go(ing)? quiet|can'?t talk|non-?verbal)\b/,
    reply:
      "A shutdown is when the brain protects itself from overload by going quiet. You may find it hard to talk or move. It is okay.\n" +
      "1. Find a calm, quiet space and rest.\n" +
      "2. Use a card, gesture or typed message instead of speaking.\n" +
      "3. Ask others for time and space, not questions.\n" +
      "4. Drink water and eat something when you can.",
  },
  {
    test: /\b(sensory|overload\w*|too (loud|bright|noisy)|noise|noisy|loud|bright light\w*|crowd\w*)\b/,
    reply:
      "That sounds like sensory overload: too much sound, light or busyness for your body to handle.\n" +
      "1. Move to a quieter space or the edge of the room.\n" +
      "2. Use headphones, ear defenders or sunglasses.\n" +
      "3. Focus on one steady thing, like your breathing or a fidget.\n" +
      "4. Take a break of 5 to 10 minutes before deciding what to do next.\n" +
      "You can also tell people: “It is too loud for me. I need a short break.”",
  },
  {
    test: /\b(overwhelm\w*|too much)\b/,
    reply:
      "Feeling overwhelmed means there is more happening than you can handle right now.\n" +
      "1. Stop and take 3 slow breaths, breathing out longer than in.\n" +
      "2. Write down everything on your mind, then circle just one thing to do first.\n" +
      "3. Take a short break somewhere quiet.\n" +
      "4. Ask for help with one task: “Can you help me with this part?”",
  },
  {
    test: /\b(change of plan|plans? chang\w*|schedule chang\w*|routine chang\w*|unexpected|transition\w*)\b/,
    reply:
      "Unexpected changes can feel upsetting because the plan in your head no longer fits.\n" +
      "1. Ask what the new plan is, step by step.\n" +
      "2. Write or draw the new order so you can check it.\n" +
      "3. Keep one familiar thing the same, like your snack or music.\n" +
      "4. Give yourself a few minutes before you start the new plan.\n" +
      "The Social stories page has a story about schedule changes.",
  },
  {
    test: /\b(calm (myself )?down|relax|settle|cope|coping|feel better|regulat\w*)\b/,
    reply:
      "Some quick ways to calm your body:\n" +
      "1. Breathe in for 4 counts and out for 6 counts. Repeat 5 times.\n" +
      "2. Press your feet into the floor, or push your hands together.\n" +
      "3. Hold something cold or drink cool water.\n" +
      "4. Go somewhere quiet, or use headphones.\n" +
      "5. Name 3 things you can see, 2 you can hear and 1 you can touch.\n" +
      "Tell me what feeling or situation it is, and I can give more specific steps.",
  },
];

/* ---------------------------------------------------------------- app help */

const APP: Rule[] = [
  {
    test: /\b(scan|camera|read a face|face reader)\b.*\b(how|use|work)\b|\bhow\b.*\b(scan|camera|read a face)\b/,
    reply:
      "To read a face, open Read a face from the menu. Allow the camera, point it at a face and press Capture this moment, or switch to Upload to use a photo. The result shows the emotion, how sure the model is, and a short explanation. Images stay on your device.",
  },
  {
    test: /\b(voice|microphone)\b.*\b(how|use|work)\b|\bhow\b.*\b(voice tone|microphone)\b/,
    reply:
      "Open Voice tone from the menu, tick the consent box and press Start. Speak normally for about 8 seconds. EmoSense looks at loudness and tone movement and gives a gentle clue, such as steady or activated. Audio is not saved or uploaded.",
  },
  {
    test: /\b(track|tracker|log|journal|diary)\b.*\b(how|use|work)\b|\bhow\b.*\b(track|log)\b/,
    reply:
      "Open Mood tracker from the menu. Pick the time of day, one emotion, any activities, your energy level, and add a note if you like, then press Save entry. The weekly pattern and insights below update automatically.",
  },
];

/* ---------------------------------------------------------------- emotion answers */

function emotionAnswer(e: EmotionRecord, q: string): string {
  const name = noun(e);
  const wantsBody = /\b(body|physical\w*|feel like|feels like|sensation\w*|signs?|notice)\b/.test(q);
  const wantsCause = /\b(why|cause\w*|trigger\w*|make me|makes me|happen)\b/.test(q);
  const wantsCoping = /\b(how (do|can|to)|cope|coping|deal|stop|help|handle|manage|get rid|less|reduce|what should|what can)\b/.test(q) && !/\bwhat (is|does)\b/.test(q);
  const wantsMeaning = /\b(what (is|does|are)|mean\w*|define|definition|explain)\b/.test(q);

  if (wantsBody) {
    return `${name} in the body can feel like this: ${list(e.bodyFeelings)}. Everyone feels it a little differently, so notice what is true for you. If you notice these signs, try one of these: ${list(e.strategies)}.`;
  }
  if (wantsCause) {
    return `${name} is ${lowerFirst(e.definition.replace(/\.$/, ""))}. It can happen when, for example: ${list(e.scenarios)}. Noticing what happened just before the feeling can help you spot your own triggers. The Mood tracker can help you see patterns.`;
  }
  if (wantsCoping) {
    return `Things that can help when you feel ${adj(e)}:\n${steps(e.strategies)}\nIf the feeling stays strong for a long time, tell someone you trust.`;
  }
  if (wantsMeaning) {
    return `${name} means: ${e.definition} In your body you might notice: ${list(e.bodyFeelings)}. It often shows up when: ${list(e.scenarios)}.`;
  }
  return `${name}: ${e.definition} You might notice: ${list(e.bodyFeelings)}. Things that can help: ${list(e.strategies)}.`;
}

function compareAnswer(a: EmotionRecord, b: EmotionRecord): string {
  return (
    `${noun(a)} and ${noun(b).toLowerCase()} are different feelings.\n` +
    `${noun(a)}: ${a.definition} In the body: ${list(a.bodyFeelings)}.\n` +
    `${noun(b)}: ${b.definition} In the body: ${list(b.bodyFeelings)}.\n` +
    `A quick test: ask yourself what happened just before. ${noun(a)} often comes after: ${lowerFirst(a.scenarios[0] ?? "")}. ${noun(b)} often comes after: ${lowerFirst(b.scenarios[0] ?? "")}.`
  );
}

function feelingStatement(e: EmotionRecord): string {
  return (
    `Thank you for telling me. It sounds like you might be feeling ${adj(e)}. ${noun(e)} is ${lowerFirst(e.definition)}\n` +
    `One small step you could try now: ${lowerFirst(e.strategies[0] ?? "take three slow breaths")}.\n` +
    `If you want, tell me what happened, and I can help you decide what to do next.`
  );
}

/* ---------------------------------------------------------------- entry point */

function firstMatch(rules: Rule[], q: string): string | null {
  return rules.find((r) => r.test.test(q))?.reply ?? null;
}

export function answerHelpbot(message: string): HelpbotAnswer {
  const q = message.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

  if (/^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b[\s!.?]*$/.test(q)) {
    return {
      topic: "greeting",
      reply: "Hi! You can ask me what a feeling means, how it feels in the body, how to calm down, or how to read social situations like sarcasm. What would you like to talk about?",
    };
  }
  if (/^(thanks|thank you|thx|ok thanks|okay thank you)\b/.test(q)) {
    return { topic: "thanks", reply: "You are welcome. I am here if you want to talk about anything else." };
  }

  const found = findEmotions(q);

  if (found.length >= 2 && /\b(differen\w*|vs\.?|versus|compare|or)\b/.test(q)) {
    return { topic: "compare", reply: compareAnswer(found[0], found[1]) };
  }

  const social = firstMatch(SOCIAL, q);
  if (social) return { topic: "social", reply: social };

  const symptom = firstMatch(SYMPTOMS, q);
  if (symptom) return { topic: "symptom", reply: symptom };

  const app = firstMatch(APP, q);
  if (app) return { topic: "app", reply: app };

  if (found.length >= 1) {
    const e = found[0];
    const isStatement =
      /\b(i('m| am| was)|i feel|i felt|i'?m feeling|i get|feeling)\b/.test(q) && !/\?$/.test(q) && !/\b(what|how|why)\b/.test(q);
    if (isStatement) {
      const regulation = firstMatch(REGULATION, q);
      if (regulation) {
        return { topic: "feeling-statement", reply: `It makes sense that you felt ${adj(e)}. ${regulation}` };
      }
      return { topic: "feeling-statement", reply: feelingStatement(e) };
    }
    return { topic: "emotion", reply: emotionAnswer(e, q) };
  }

  const regulation = firstMatch(REGULATION, q);
  if (regulation) return { topic: "regulation", reply: regulation };

  if (/\b(don'?t know|not sure|unsure)\b.*\b(feel|feeling|emotion)\b/.test(q)) {
    return {
      topic: "feeling-statement",
      reply:
        "That is okay. Many people find feelings hard to name. Try this:\n" +
        "1. Notice your body: is it hot or cold, tight or loose, fast or slow?\n" +
        "2. Notice your energy: high or low?\n" +
        "3. Think about what happened just before.\n" +
        "Tell me what you notice, and I can help you find a word for it. The Dictionary page also shows body signs for each feeling.",
    };
  }

  return {
    topic: "unknown",
    reply:
      "I am not sure I understood that question. I can help with things like:\n" +
      "• what a feeling means or how it feels in the body (“What does loneliness feel like?”)\n" +
      "• calming your body (“How do I calm down when my heart races?”)\n" +
      "• social situations (“How do I know if someone is being sarcastic?”)\n" +
      "Could you ask it in a different way, or tell me what happened?",
  };
}
