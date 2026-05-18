export const EMOTION_THEMES: Record<
  string,
  {
    label: string;
    dataAttr: string;
    faceColor: string;
    accentColor: string;
    bgColor: string;
    moodIcon: string;
  }
> = {
  joy: {
    label: "Happy",
    dataAttr: "joy",
    faceColor: "#FFE566",
    accentColor: "#F5C518",
    bgColor: "#FFF9E6",
    moodIcon: "smile",
  },
  happy: {
    label: "Happy",
    dataAttr: "joy",
    faceColor: "#FFE566",
    accentColor: "#F5C518",
    bgColor: "#FFF9E6",
    moodIcon: "smile",
  },
  sadness: {
    label: "Sad",
    dataAttr: "sadness",
    faceColor: "#AED6F1",
    accentColor: "#4A90D9",
    bgColor: "#E8F4FD",
    moodIcon: "frown",
  },
  sad: {
    label: "Sad",
    dataAttr: "sadness",
    faceColor: "#AED6F1",
    accentColor: "#4A90D9",
    bgColor: "#E8F4FD",
    moodIcon: "frown",
  },
  anger: {
    label: "Angry",
    dataAttr: "anger",
    faceColor: "#F1948A",
    accentColor: "#C0392B",
    bgColor: "#FDEDED",
    moodIcon: "angry",
  },
  angry: {
    label: "Angry",
    dataAttr: "anger",
    faceColor: "#F1948A",
    accentColor: "#C0392B",
    bgColor: "#FDEDED",
    moodIcon: "angry",
  },
  fear: {
    label: "Scared",
    dataAttr: "fear",
    faceColor: "#C39BD3",
    accentColor: "#7D3C98",
    bgColor: "#F3EEF8",
    moodIcon: "fear",
  },
  fearful: {
    label: "Scared",
    dataAttr: "fear",
    faceColor: "#C39BD3",
    accentColor: "#7D3C98",
    bgColor: "#F3EEF8",
    moodIcon: "fear",
  },
  surprise: {
    label: "Surprised",
    dataAttr: "surprise",
    faceColor: "#82E0AA",
    accentColor: "#1E8449",
    bgColor: "#EAFAF1",
    moodIcon: "surprise",
  },
  surprised: {
    label: "Surprised",
    dataAttr: "surprise",
    faceColor: "#82E0AA",
    accentColor: "#1E8449",
    bgColor: "#EAFAF1",
    moodIcon: "surprise",
  },
  disgust: {
    label: "Disgusted",
    dataAttr: "disgust",
    faceColor: "#A9DFBF",
    accentColor: "#27AE60",
    bgColor: "#EAFAF1",
    moodIcon: "disgust",
  },
  disgusted: {
    label: "Disgusted",
    dataAttr: "disgust",
    faceColor: "#A9DFBF",
    accentColor: "#27AE60",
    bgColor: "#EAFAF1",
    moodIcon: "disgust",
  },
  neutral: {
    label: "Calm",
    dataAttr: "calm",
    faceColor: "#D5D8DC",
    accentColor: "#717D7E",
    bgColor: "#FDFEFE",
    moodIcon: "neutral",
  },
  calm: {
    label: "Calm",
    dataAttr: "calm",
    faceColor: "#D5D8DC",
    accentColor: "#717D7E",
    bgColor: "#FDFEFE",
    moodIcon: "neutral",
  },
  anxiety: {
    label: "Anxious",
    dataAttr: "anxiety",
    faceColor: "#FAD7A0",
    accentColor: "#E67E22",
    bgColor: "#FEF5E7",
    moodIcon: "anxiety",
  },
  loneliness: {
    label: "Lonely",
    dataAttr: "loneliness",
    faceColor: "#76D7C4",
    accentColor: "#1ABC9C",
    bgColor: "#E8F8F5",
    moodIcon: "lonely",
  },
  lonely: {
    label: "Lonely",
    dataAttr: "loneliness",
    faceColor: "#76D7C4",
    accentColor: "#1ABC9C",
    bgColor: "#E8F8F5",
    moodIcon: "lonely",
  },
  confusion: {
    label: "Confused",
    dataAttr: "confusion",
    faceColor: "#F1A7D0",
    accentColor: "#E91E8C",
    bgColor: "#FDF2F8",
    moodIcon: "confused",
  },
  confused: {
    label: "Confused",
    dataAttr: "confusion",
    faceColor: "#F1A7D0",
    accentColor: "#E91E8C",
    bgColor: "#FDF2F8",
    moodIcon: "confused",
  },
  embarrassment: {
    label: "Embarrassed",
    dataAttr: "embarrassment",
    faceColor: "#F48FB1",
    accentColor: "#E91E63",
    bgColor: "#FFF0F5",
    moodIcon: "embarrassed",
  },
  affection: {
    label: "Affectionate",
    dataAttr: "affection",
    faceColor: "#F48FB1",
    accentColor: "#E91E63",
    bgColor: "#FFF0F5",
    moodIcon: "affection",
  },
  envy: {
    label: "Envious",
    dataAttr: "envy",
    faceColor: "#4DD0E1",
    accentColor: "#00838F",
    bgColor: "#E0F7FA",
    moodIcon: "envy",
  },
  ennui: {
    label: "Bored",
    dataAttr: "ennui",
    faceColor: "#9575CD",
    accentColor: "#512DA8",
    bgColor: "#EDE7F6",
    moodIcon: "ennui",
  },
  acceptance: {
    label: "Accepting",
    dataAttr: "acceptance",
    faceColor: "#64B5F6",
    accentColor: "#1565C0",
    bgColor: "#E3F2FD",
    moodIcon: "acceptance",
  },
  trust: {
    label: "Trusting",
    dataAttr: "trust",
    faceColor: "#FF8A65",
    accentColor: "#BF360C",
    bgColor: "#FBE9E7",
    moodIcon: "trust",
  },
};

export function applyEmotionTheme(emotion: string) {
  if (typeof document === "undefined") return;
  const theme = EMOTION_THEMES[emotion.toLowerCase()];
  if (!theme) return;
  document.body.setAttribute("data-emotion", theme.dataAttr);
}

export function clearEmotionTheme() {
  if (typeof document === "undefined") return;
  document.body.removeAttribute("data-emotion");
}

export function getTheme(emotion: string) {
  return (
    EMOTION_THEMES[emotion.toLowerCase()] ?? EMOTION_THEMES["neutral"]
  );
}
