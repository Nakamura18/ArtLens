import { GoogleGenAI, Type } from '@google/genai';
import { ArtInfo } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const artInfoSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: '絵画の正式なタイトル。',
    },
    artist: {
      type: Type.STRING,
      description: '絵画を制作した画家の名前。',
    },
    year: {
      type: Type.STRING,
      description: '絵画が制作された年または年代（例：「1889年」、「1665年頃」）。',
    },
    description: {
      type: Type.STRING,
      description: '絵画の主題、芸術様式などを含む詳細な解説。',
    },
    historicalContext: {
      type: Type.STRING,
      description: '画家が活動した時代や文化的な背景、所属する芸術運動についての解説。',
    },
  },
  required: ['title', 'artist', 'year', 'description', 'historicalContext'],
};

export async function getArtInfo(base64ImageData: string): Promise<ArtInfo> {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64ImageData,
    },
  };

  const textPart = {
    text: 'あなたは美術史の専門家です。この絵画を特定し、詳細な情報を提供してください。もし絵画を特定できない場合は、その旨を作品解説で明確に述べ、可能であれば推測を記述してください。ただし、特定できない場合、他のフィールドは空にしてください。',
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: artInfoSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation to ensure the parsed object matches the ArtInfo structure
    if (
      typeof parsedJson.title === 'string' &&
      typeof parsedJson.artist === 'string' &&
      typeof parsedJson.year === 'string' &&
      typeof parsedJson.description === 'string' &&
      typeof parsedJson.historicalContext === 'string'
    ) {
      return parsedJson as ArtInfo;
    } else {
      throw new Error("APIの応答が期待された形式と一致しませんでした。");
    }
  } catch (error: any) {
    console.error('Gemini APIの呼び出しエラー:', error);
    
    // エラーレスポンスの構造を確認
    const errorMessage = error?.message || '';
    const errorCode = error?.code || error?.status || '';
    const errorDetails = error?.details || [];
    
    // SERVICE_DISABLEDエラー（APIが有効化されていない）を検出
    const isServiceDisabled = 
      errorCode === 403 || 
      errorCode === 'PERMISSION_DENIED' ||
      errorMessage.includes('SERVICE_DISABLED') ||
      errorMessage.includes('has not been used') ||
      errorMessage.includes('is disabled') ||
      errorMessage.includes('Enable it by visiting') ||
      errorDetails.some((detail: any) => detail?.reason === 'SERVICE_DISABLED');
    
    if (isServiceDisabled) {
      const activationUrl = errorDetails.find((detail: any) => detail?.metadata?.activationUrl)?.metadata?.activationUrl ||
                           'https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview';
      throw new Error(
        `Generative Language APIが有効化されていません。\n\n` +
        `以下の手順でAPIを有効化してください：\n` +
        `1. Google Cloud Consoleにアクセス\n` +
        `2. Generative Language APIを有効化\n` +
        `3. 数分待ってから再試行\n\n` +
        `詳細: ${activationUrl}`
      );
    }
    
    // より詳細なエラーメッセージを提供
    if (errorMessage) {
      if (errorMessage.includes('API_KEY') || errorMessage.includes('apiKey') || errorMessage.includes('API key')) {
        throw new Error('APIキーが正しく設定されていません。環境変数を確認してください。');
      }
      if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429')) {
        throw new Error('APIの利用制限に達しました。しばらく待ってから再試行してください。');
      }
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
        throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
      }
      if (errorCode === 401 || errorMessage.includes('UNAUTHENTICATED')) {
        throw new Error('認証エラーが発生しました。APIキーが正しいか確認してください。');
      }
      if (errorCode === 400 || errorMessage.includes('INVALID_ARGUMENT')) {
        throw new Error('リクエストが無効です。画像形式を確認してください。');
      }
      
      // 元のエラーメッセージを返す（ただし長すぎる場合は要約）
      if (errorMessage.length > 200) {
        throw new Error(`APIエラーが発生しました: ${errorMessage.substring(0, 200)}...`);
      }
      throw new Error(`APIエラー: ${errorMessage}`);
    }
    
    throw new Error('APIから美術情報を取得できませんでした。画像が鮮明か、もう一度お試しください。');
  }
}
