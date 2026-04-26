import { useEffect } from 'react';
import * as Speech from 'expo-speech';
import { useLocale } from './useLocale';

const instructions: Record<string, Record<string, string>> = {
  Home: {
    en: 'Welcome to Cropt. Enter information about your plant to check if it has disease.',
    zh: '欢迎使用Cropt。输入您的植物信息以检查是否有疾病。',
    sw: 'Karibu Cropt. Ingiza maelezo ya mmea wako kuangalia kama una ugonjwa.',
    fr: 'Bienvenue sur Cropt. Entrez des informations sur votre plante pour vérifier si elle est malade.',
    hi: 'Cropt में आपका स्वागत है। अपने पौधे की जानकारी दर्ज करें ताकि पता चले कि उसे कोई बीमारी है।',
  },
  Map: {
    en: 'This is the community map. It shows crop disease warnings in your area.',
    zh: '这是社区地图。它显示您所在地区的作物病害警告。',
    sw: 'Hii ni ramani ya jamii. Inaonyesha maonyo ya magonjwa ya mazao katika eneo lako.',
    fr: 'Voici la carte communautaire. Elle montre les avertissements de maladies dans votre région.',
    hi: 'यह सामुदायिक नक्शा है। यह आपके क्षेत्र में फसल रोग की चेतावनियां दिखाता है।',
  },
};

export function useScreenInstructions(screenName: string) {
  const locale = useLocale();

  useEffect(() => {
    const screenInstructions = instructions[screenName];
    if (!screenInstructions) return;

    const text = screenInstructions[locale] ?? screenInstructions.en;

    Speech.stop();
    Speech.speak(text, { language: locale });

    return () => {
      Speech.stop();
    };
  }, [screenName, locale]);
}