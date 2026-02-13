const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ValidationResult {
  id?: string;
  result: 'authentic' | 'fake';
  confidence_score: number;
  details: {
    message: string;
    analysis?: string[];
    patterns_detected?: number;
  };
}

async function callValidationAPI(
  endpoint: string,
  body: Record<string, string>
): Promise<ValidationResult> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Validation failed');
  }

  return response.json();
}

export async function validateText(text: string): Promise<ValidationResult> {
  return callValidationAPI('validate-text', { text });
}

export async function validateImage(imageUrl: string): Promise<ValidationResult> {
  return callValidationAPI('validate-image', { imageUrl });
}

export async function validateVideo(videoUrl: string): Promise<ValidationResult> {
  return callValidationAPI('validate-video', { videoUrl });
}

export async function validateURL(url: string): Promise<ValidationResult> {
  return callValidationAPI('validate-url', { url });
}
