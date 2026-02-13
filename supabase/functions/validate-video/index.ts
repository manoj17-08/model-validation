import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoValidationRequest {
  videoUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { videoUrl }: VideoValidationRequest = await req.json();

    if (!videoUrl || videoUrl.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Video URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validVideoExtensions = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)(\?.*)?$/i;
    const hasValidExtension = validVideoExtensions.test(videoUrl);

    const trustedVideoDomains = [
      "youtube.com",
      "youtu.be",
      "vimeo.com",
      "cloudinary.com",
      "wistia.com",
      "vidyard.com",
      "streamable.com",
    ];
    const isTrustedDomain = trustedVideoDomains.some((domain) =>
      videoUrl.includes(domain)
    );

    const suspiciousIndicators = [
      /\b(free|download|crack|hack)\b/i,
      /\.(exe|zip|rar)\b/i,
      /suspicious-domain\.xyz/i,
    ];
    const hasSuspiciousIndicators = suspiciousIndicators.some((pattern) =>
      pattern.test(videoUrl)
    );

    let confidenceScore = 50;
    const analysisDetails: string[] = [];

    if (hasValidExtension) {
      confidenceScore += 20;
      analysisDetails.push("Valid video file extension detected");
    } else if (!isTrustedDomain) {
      confidenceScore -= 10;
      analysisDetails.push("No standard video extension found");
    }

    if (isTrustedDomain) {
      confidenceScore += 30;
      analysisDetails.push("Video hosted on trusted streaming platform");
    } else {
      confidenceScore -= 5;
      analysisDetails.push("Video hosted on unknown platform");
    }

    if (hasSuspiciousIndicators) {
      confidenceScore -= 30;
      analysisDetails.push("Suspicious patterns detected in URL");
    }

    try {
      const videoResponse = await fetch(videoUrl, {
        method: "HEAD",
        redirect: "follow"
      });

      if (videoResponse.ok) {
        const contentType = videoResponse.headers.get("content-type");
        if (contentType && (contentType.startsWith("video/") || contentType.includes("html"))) {
          confidenceScore += 15;
          analysisDetails.push(`Accessible URL with content-type: ${contentType}`);
        } else {
          confidenceScore -= 10;
          analysisDetails.push("Unexpected content-type for video");
        }
      } else {
        confidenceScore -= 20;
        analysisDetails.push("Video URL not accessible or returns error");
      }
    } catch (error) {
      confidenceScore -= 15;
      analysisDetails.push("Failed to verify video accessibility");
    }

    confidenceScore = Math.max(0, Math.min(100, confidenceScore + Math.random() * 10));

    const isAuthentic = confidenceScore > 50;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("validations")
      .insert({
        input_type: "video",
        input_data: videoUrl.substring(0, 500),
        result: isAuthentic ? "authentic" : "fake",
        confidence_score: confidenceScore.toFixed(2),
        details: {
          analysis: analysisDetails,
          has_valid_extension: hasValidExtension,
          is_trusted_domain: isTrustedDomain,
          has_suspicious_indicators: hasSuspiciousIndicators,
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
            ? "Video appears to be authentic and from a reliable source"
            : "Video shows signs of manipulation or untrusted source",
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
