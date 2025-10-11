import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function translateText(text, targetLang) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Translate the following English text to ${targetLang}. Only return the translation, no explanations:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

async function translateJsonFile(filePath, targetLang) {
    const jsonContent = JSON.parse(await fs.readFile(filePath, 'utf8'));

    async function translateObject(obj) {
        const translated = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                translated[key] = await translateText(value, targetLang);
            } else if (typeof value === 'object') {
                translated[key] = await translateObject(value);
            } else {
                translated[key] = value;
            }
        }
        return translated;
    }

    return await translateObject(jsonContent);
}

const enFile = './src/locales/en/common.json';
const translated = await translateJsonFile(enFile, 'Chinese');
await fs.writeFile('./src/locales/zh/common.json', JSON.stringify(translated, null, 2));