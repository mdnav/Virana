// Shared heritage constants (colors/icons for categories, states).
// The actual records come from the backend /api/heritage.

export const CATEGORY_META = {
  monuments: { name: "Monuments & Forts", color: "#F56A1E", icon: "Landmark" },
  temples: { name: "Sacred Temples", color: "#E89B17", icon: "Sun" },
  dance: { name: "Classical & Folk Dance", color: "#C85A32", icon: "Sparkles" },
  music: { name: "Music & Ragas", color: "#2B3A67", icon: "Music" },
  instruments: { name: "Rare Instruments", color: "#3B5998", icon: "Music2" },
  food: { name: "Culinary Heritage", color: "#B8433E", icon: "Utensils" },
  spices: { name: "Spices & Ayurveda", color: "#8B4513", icon: "Leaf" },
  crafts: { name: "Handicrafts & Textiles", color: "#1B7A56", icon: "Scissors" },
  languages: { name: "Languages & Dialects", color: "#6E4C9E", icon: "Languages" },
  festivals: { name: "Festivals", color: "#D4368A", icon: "Calendar" },
  rituals: { name: "Rituals & Oral Tales", color: "#7A6C48", icon: "BookOpen" },
  at_risk: { name: "Heritage at Risk", color: "#DC2626", icon: "AlertTriangle" },
};

export const CATEGORY_ORDER = [
  "monuments", "temples", "festivals", "dance", "music", "instruments",
  "food", "spices", "crafts", "languages", "rituals", "at_risk",
];
