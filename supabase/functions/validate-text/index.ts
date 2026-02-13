import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TextValidationRequest {
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text }: TextValidationRequest = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text input is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const suspiciousPatterns = [
      /\b(click here|act now|limited time|urgent|congratulations)\b/gi,
      /\b(verify your account|suspended|confirm identity)\b/gi,
      /\b(winner|prize|free money|lottery)\b/gi,
      /(http[s]?:\/\/[^\s]+){3,}/gi,
      /(.)\1{10,}/gi,
    ];

    let suspiciousCount = 0;
    const detectedPatterns: string[] = [];

    suspiciousPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        suspiciousCount += matches.length;
        detectedPatterns.push(`Pattern ${index + 1}: ${matches.length} occurrences`);
      }
    });

    const lengthScore = text.length < 20 || text.length > 5000 ? -10 : 10;
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    const capsScore = capsRatio > 0.5 ? -20 : 0;

    const baseScore = 70 - (suspiciousCount * 10) + lengthScore + capsScore;
    const confidenceScore = Math.max(0, Math.min(100, baseScore + Math.random() * 10));

    const isAuthentic = confidenceScore > 50;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("validations")
      .insert({
        input_type: "text",
        input_data: text.substring(0, 500),
        result: isAuthentic ? "authentic" : "fake",
        confidence_score: confidenceScore.toFixed(2),
        details: {
          suspicious_patterns: detectedPatterns,
          length: text.length,
          caps_ratio: capsRatio.toFixed(2),
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        result: isAuthentic ? "authentic" : "fake",
        confidence_score: parseFloat(confidenceScore.toFixed(2)),
        details: {
          message: isAuthentic
            ? "Text appears to be authentic and trustworthy"
            : "Text shows signs of manipulation or suspicious patterns",
          patterns_detected: detectedPatterns.length,
          analysis: data.details,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
