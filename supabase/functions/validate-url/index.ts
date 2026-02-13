import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface URLValidationRequest {
  url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url }: URLValidationRequest = await req.json();

    if (!url || url.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let confidenceScore = 50;
    const analysisDetails: string[] = [];

    let urlObject: URL;
    try {
      urlObject = new URL(url);
      confidenceScore += 10;
      analysisDetails.push("Valid URL format");
    } catch {
      confidenceScore -= 30;
      analysisDetails.push("Invalid URL format");

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("validations").insert({
        input_type: "url",
        input_data: url.substring(0, 500),
        result: "fake",
        confidence_score: confidenceScore.toFixed(2),
        details: { analysis: analysisDetails },
      });

      return new Response(
        JSON.stringify({
          result: "fake",
          confidence_score: confidenceScore,
          details: {
            message: "Invalid URL format detected",
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
    }

    const trustedDomains = [
      "google.com", "youtube.com", "facebook.com", "twitter.com", "x.com",
      "linkedin.com", "github.com", "stackoverflow.com", "wikipedia.org",
      "amazon.com", "microsoft.com", "apple.com", "cloudflare.com",
      "supabase.com", "vercel.com", "netlify.com", "mozilla.org",
    ];

    const domain = urlObject.hostname.replace(/^www\./, "");
    const isTrustedDomain = trustedDomains.some(
      (trusted) => domain === trusted || domain.endsWith(`.${trusted}`)
    );

    if (isTrustedDomain) {
      confidenceScore += 30;
      analysisDetails.push("Domain is on trusted whitelist");
    } else {
      confidenceScore -= 5;
      analysisDetails.push("Domain not on trusted whitelist");
    }

    const suspiciousTLDs = [".xyz", ".top", ".click", ".loan", ".win", ".bid"];
    const hasSuspiciousTLD = suspiciousTLDs.some((tld) => domain.endsWith(tld));

    if (hasSuspiciousTLD) {
      confidenceScore -= 25;
      analysisDetails.push("Suspicious top-level domain detected");
    }

    if (urlObject.protocol === "https:") {
      confidenceScore += 15;
      analysisDetails.push("Secure HTTPS protocol");
    } else {
      confidenceScore -= 15;
      analysisDetails.push("Insecure HTTP protocol");
    }

    const suspiciousPatterns = [
      /login|signin|verify|account|secure|update/i,
      /paypal|amazon|apple|microsoft|netflix/i,
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/,
      /-{2,}/,
      /\d{5,}/,
    ];

    const matchedPatterns = suspiciousPatterns.filter((pattern) =>
      pattern.test(url)
    );

    if (matchedPatterns.length > 2) {
      confidenceScore -= 20;
      analysisDetails.push(`${matchedPatterns.length} suspicious patterns detected in URL`);
    } else if (matchedPatterns.length > 0) {
      confidenceScore -= 10;
      analysisDetails.push(`${matchedPatterns.length} potential suspicious pattern(s)`);
    }

    if (domain.length > 30) {
      confidenceScore -= 10;
      analysisDetails.push("Unusually long domain name");
    }

    try {
      const urlResponse = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });

      if (urlResponse.status >= 200 && urlResponse.status < 400) {
        confidenceScore += 10;
        analysisDetails.push("URL is accessible and responds correctly");
      } else if (urlResponse.status >= 400) {
        confidenceScore -= 15;
        analysisDetails.push(`URL returns error status: ${urlResponse.status}`);
      }
    } catch {
      confidenceScore -= 10;
      analysisDetails.push("Unable to verify URL accessibility");
    }

    confidenceScore = Math.max(0, Math.min(100, confidenceScore + Math.random() * 5));

    const isAuthentic = confidenceScore > 50;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("validations")
      .insert({
        input_type: "url",
        input_data: url.substring(0, 500),
        result: isAuthentic ? "authentic" : "fake",
        confidence_score: confidenceScore.toFixed(2),
        details: {
          analysis: analysisDetails,
          domain,
          protocol: urlObject.protocol,
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
            ? "URL appears to be safe and trustworthy"
            : "URL shows signs of potential phishing or malicious activity",
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
