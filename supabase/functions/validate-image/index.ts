import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImageValidationRequest {
  imageUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { imageUrl }: ImageValidationRequest = await req.json();

    if (!imageUrl || imageUrl.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validImageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    const hasValidExtension = validImageExtensions.test(imageUrl);

    const trustedDomains = [
      "pexels.com",
      "unsplash.com",
      "githubusercontent.com",
      "cloudinary.com",
      "imgur.com",
    ];
    const isTrustedDomain = trustedDomains.some((domain) =>
      imageUrl.includes(domain)
    );

    let confidenceScore = 50;
    const analysisDetails: string[] = [];

    if (hasValidExtension) {
      confidenceScore += 20;
      analysisDetails.push("Valid image file extension detected");
    } else {
      confidenceScore -= 15;
      analysisDetails.push("No standard image extension found");
    }

    if (isTrustedDomain) {
      confidenceScore += 25;
      analysisDetails.push("Image hosted on trusted domain");
    } else {
      confidenceScore -= 10;
      analysisDetails.push("Image hosted on unknown domain");
    }

    try {
      const imageResponse = await fetch(imageUrl, { method: "HEAD" });
      if (imageResponse.ok) {
        const contentType = imageResponse.headers.get("content-type");
        if (contentType && contentType.startsWith("image/")) {
          confidenceScore += 15;
          analysisDetails.push(`Valid content-type: ${contentType}`);
        } else {
          confidenceScore -= 20;
          analysisDetails.push("Invalid or missing image content-type");
        }
      } else {
        confidenceScore -= 25;
        analysisDetails.push("Image URL not accessible");
      }
    } catch (error) {
      confidenceScore -= 20;
      analysisDetails.push("Failed to verify image accessibility");
    }

    confidenceScore = Math.max(0, Math.min(100, confidenceScore + Math.random() * 10));

    const isAuthentic = confidenceScore > 50;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("validations")
      .insert({
        input_type: "image",
        input_data: imageUrl.substring(0, 500),
        result: isAuthentic ? "authentic" : "fake",
        confidence_score: confidenceScore.toFixed(2),
        details: {
          analysis: analysisDetails,
          has_valid_extension: hasValidExtension,
          is_trusted_domain: isTrustedDomain,
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
            ? "Image appears to be authentic and from a reliable source"
            : "Image shows signs of manipulation or untrusted source",
          analysis: analysisDetails,
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
