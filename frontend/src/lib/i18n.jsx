import React, { createContext, useContext, useState, useCallback } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", ready: true },
  { code: "hi", name: "Hindi", native: "हिन्दी", ready: true },
  { code: "te", name: "Telugu", native: "తెలుగు", ready: true },
  { code: "ta", name: "Tamil", native: "தமிழ்", ready: false },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", ready: false },
  { code: "ml", name: "Malayalam", native: "മലയാളം", ready: false },
  { code: "bn", name: "Bengali", native: "বাংলা", ready: false },
  { code: "mr", name: "Marathi", native: "मराठी", ready: false },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", ready: false },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", ready: false },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", ready: false },
  { code: "as", name: "Assamese", native: "অসমীয়া", ready: false },
  { code: "ur", name: "Urdu", native: "اردو", ready: false },
];

const STRINGS = {
  en: {
    home: "Home", explore: "Explore Map", ask: "Ask Virana AI", lens: "HeritageLens",
    calendar: "Calendar", atRisk: "At Risk", signIn: "Sign In", signUp: "Sign Up",
    myVirana: "My Virana", savedHeritage: "Saved Heritage", myContributions: "My Contributions",
    collections: "Collections", activity: "Activity", settings: "Account Settings",
    help: "Help", signOut: "Sign Out", search: "Discover...", comingUp: "Coming Up",
    exploreArrow: "Explore →", daysAway: "days away", today: "Happening now",
    culturalCalendar: "Cultural Calendar", saveFestival: "Save Festival", remindMe: "Remind Me",
  },
  hi: {
    home: "होम", explore: "मानचित्र खोजें", ask: "विराना AI से पूछें", lens: "हेरिटेजलेंस",
    calendar: "कैलेंडर", atRisk: "संकट में", signIn: "साइन इन", signUp: "साइन अप",
    myVirana: "मेरा विराना", savedHeritage: "सहेजी धरोहर", myContributions: "मेरे योगदान",
    collections: "संग्रह", activity: "गतिविधि", settings: "खाता सेटिंग्स",
    help: "सहायता", signOut: "साइन आउट", search: "खोजें...", comingUp: "आगामी उत्सव",
    exploreArrow: "देखें →", daysAway: "दिन शेष", today: "अभी चल रहा है",
    culturalCalendar: "सांस्कृतिक कैलेंडर", saveFestival: "उत्सव सहेजें", remindMe: "याद दिलाएं",
  },
  te: {
    home: "హోమ్", explore: "మ్యాప్ అన్వేషించండి", ask: "విరానా AIని అడగండి", lens: "హెరిటేజ్‌లెన్స్",
    calendar: "క్యాలెండర్", atRisk: "ప్రమాదంలో", signIn: "సైన్ ఇన్", signUp: "సైన్ అప్",
    myVirana: "నా విరానా", savedHeritage: "సేవ్ చేసిన వారసత్వం", myContributions: "నా సహకారాలు",
    collections: "సేకరణలు", activity: "కార్యకలాపం", settings: "ఖాతా సెట్టింగ్‌లు",
    help: "సహాయం", signOut: "సైన్ అవుట్", search: "అన్వేషించండి...", comingUp: "రాబోయే పండుగలు",
    exploreArrow: "చూడండి →", daysAway: "రోజులు మిగిలి ఉన్నాయి", today: "ఇప్పుడు జరుగుతోంది",
    culturalCalendar: "సాంస్కృతిక క్యాలెండర్", saveFestival: "పండుగను సేవ్ చేయండి", remindMe: "గుర్తు చేయండి",
  },
};

const LangCtx = createContext({ lang: "en", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("virana-lang") || "en");
  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem("virana-lang", code);
  }, []);
  const t = useCallback((key) => (STRINGS[lang] || STRINGS.en)[key] || STRINGS.en[key] || key, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
