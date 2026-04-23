import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  // Generate a short news article based on a title
  generateNewsContent: async (title: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Scrivi un breve articolo di news (massimo 100 parole) per una piattaforma civica comunale, basato sul seguente titolo: "${title}". Usa un tono formale ma coinvolgente.`,
      });
      return response.text || '';
    } catch (error) {
      console.error("Gemini Error:", error);
      return '';
    }
  },

  // Suggest a category for a petition based on title and description
  suggestCategory: async (title: string, description: string, categories: string[]): Promise<string> => {
    try {
      const prompt = `
        Analizza la seguente petizione e suggerisci la categoria più appropriata tra quelle elencate.
        Restituisci SOLO il nome della categoria, senza altro testo.
        
        Categorie Disponibili: ${categories.join(', ')}
        
        Titolo Petizione: ${title}
        Descrizione: ${description}
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const suggestedCategory = response.text?.trim() || '';
      
      // Verify if the suggestion is valid (case-insensitive check)
      const match = categories.find(c => c.toLowerCase() === suggestedCategory.toLowerCase());
      return match || categories[0] || '';
    } catch (error) {
      console.error("Gemini Error:", error);
      return '';
    }
  },

  // AI Assistant for civic queries
  getAssistantResponse: async (message: string): Promise<string> => {
    try {
      const systemInstruction = `
        Sei l'assistente virtuale di "NaroInComune", una piattaforma di iniziativa popolare per il comune di Naro (AG).
        Il tuo compito è aiutare i cittadini a segnalare problemi (es. lampioni rotti, buche, rifiuti), gestire consumi/fornitori, o trovare informazioni utili.
        
        Rispondi in modo cortese, professionale e conciso.
        Se l'utente segnala un guasto (es. lampione rotto), chiedi dettagli come la via esatta o il numero del palo se visibile.
        Se chiede informazioni su fornitori o consumi, dai consigli generali su come risparmiare o come leggere una bolletta.
        
        Non inventare procedure burocratiche complesse. Rimanda sempre agli uffici comunali competenti per pratiche ufficiali.
        Usa un tono rassicurante e collaborativo.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      return response.text || "Mi dispiace, non sono riuscito a elaborare la tua richiesta. Riprova più tardi.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Si è verificato un errore di connessione con l'assistente. Riprova più tardi.";
    }
  }
};
