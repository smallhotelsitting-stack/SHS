import type { Language } from '../contexts/LanguageContext';

export interface TranslatableContent {
  title: string;
  description: string;
  location: string;
}

export interface ListingTranslations {
  [key: string]: TranslatableContent;
}

export function getTranslatedContent(
  originalContent: TranslatableContent,
  translations: ListingTranslations | null,
  targetLanguage: Language
): TranslatableContent {
  if (!translations || targetLanguage === 'en' || !translations[targetLanguage]) {
    return originalContent;
  }

  const translation = translations[targetLanguage];

  return {
    title: translation.title || originalContent.title,
    description: translation.description || originalContent.description,
    location: translation.location || originalContent.location,
  };
}

export async function translateContent(
  content: TranslatableContent,
  targetLanguage: Language
): Promise<TranslatableContent> {
  if (targetLanguage === 'en') {
    return content;
  }

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      console.error('Translation API error:', await response.text());
      return content;
    }

    const result = await response.json();
    return result.translatedContent || content;
  } catch (error) {
    console.error('Translation error:', error);
    return content;
  }
}

export async function translateToAllLanguages(
  content: TranslatableContent
): Promise<ListingTranslations> {
  const languages: Language[] = ['es', 'fr', 'de', 'it', 'pt', 'zh', 'ja'];
  const translations: ListingTranslations = {};

  const translationPromises = languages.map(async (lang) => {
    try {
      const translated = await translateContent(content, lang);
      translations[lang] = translated;
    } catch (error) {
      console.error(`Error translating to ${lang}:`, error);
    }
  });

  await Promise.all(translationPromises);
  return translations;
}
