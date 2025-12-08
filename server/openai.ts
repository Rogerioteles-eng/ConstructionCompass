import "dotenv/config";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIParseResult {
  type: 'expense' | 'diary' | 'measurement' | 'schedule' | 'mixed';
  projectName?: string;
  data: {
    expenses?: Array<{
      description: string;
      amount: number;
      category: string;
      date: string;
    }>;
    diaryEntries?: Array<{
      date: string;
      description: string;
      workers: Array<{
        name: string;
        role: string;
        hoursWorked: number;
        hourlyRate?: number;
      }>;
    }>;
    measurements?: Array<{
      description: string;
      quantity: number;
      unit: string;
      location?: string;
    }>;
    scheduleUpdates?: Array<{
      task: string;
      progress: number;
      estimatedCompletion?: string;
    }>;
  };
}

export async function parseConstructionCommand(command: string): Promise<AIParseResult> {
  try {
    const prompt = `
    Você é um assistente especializado em interpretação de comandos para gerenciamento de obras de construção civil no Brasil.

    Analise o seguinte comando e extraia informações estruturadas sobre:
    - Gastos/Despesas (materiais, mão de obra, equipamentos)
    - Diário de obra (trabalhadores, atividades, horas trabalhadas)
    - Medições (quantidades executadas, materiais aplicados)
    - Cronograma (progresso de tarefas, previsões)

    Comando: "${command}"

    Responda APENAS com um JSON válido no seguinte formato:
    {
      "type": "expense|diary|measurement|schedule|mixed",
      "projectName": "nome da obra se mencionado",
      "data": {
        "expenses": [
          {
            "description": "descrição do gasto",
            "amount": valor_numerico,
            "category": "material|mao_de_obra|equipamento|outros",
            "date": "YYYY-MM-DD"
          }
        ],
        "diaryEntries": [
          {
            "date": "YYYY-MM-DD",
            "description": "descrição das atividades",
            "workers": [
              {
                "name": "nome do trabalhador",
                "role": "pedreiro|servente|ajudante|mestre|eletricista|encanador|outros",
                "hoursWorked": horas_trabalhadas,
                "hourlyRate": valor_por_hora
              }
            ]
          }
        ],
        "measurements": [
          {
            "description": "descrição da medição",
            "quantity": quantidade_numerica,
            "unit": "m²|m³|m|kg|un|outros",
            "location": "local da execução"
          }
        ],
        "scheduleUpdates": [
          {
            "task": "nome da tarefa",
            "progress": percentual_0_a_100,
            "estimatedCompletion": "YYYY-MM-DD"
          }
        ]
      }
    }

    Regras importantes:
    - Use a data de hoje se não especificada
    - Converta valores monetários para números (ex: "R$ 280" → 280)
    - Identifique funções dos trabalhadores baseado no contexto
    - Para medições, identifique a unidade correta (m², m³, m, etc)
    - Se não houver informação específica, omita o campo do array
    - Mantenha descrições claras e concisas
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: command
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as AIParseResult;
  } catch (error) {
    console.error('Error parsing construction command:', error);
    throw new Error('Falha ao processar comando com IA: ' + (error as Error).message);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
      language: "pt",
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Falha ao transcrever áudio: ' + (error as Error).message);
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta imagem de obra de construção civil e descreva: materiais visíveis, atividades em execução, trabalhadores presentes, equipamentos, progresso da obra, possíveis gastos ou medições que podem ser extraídos. Responda em português brasileiro."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    throw new Error('Falha ao analisar imagem: ' + error.message);
  }
}