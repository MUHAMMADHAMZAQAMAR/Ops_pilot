import { FirewallScanResult } from "@/types/security";

/**
 * Enterprise Zero-Trust Prompt Injection & Structural Sanitization Firewall.
 * Sanitizes raw user prompts and untrusted external payloads before injection into LLM context.
 */
export class PromptFirewall {
  // Common prompt injection attack patterns
  private static readonly INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
    { name: "System Instruction Override", pattern: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|prompts|directives)/i },
    { name: "Role Hijacking", pattern: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|switch\s+to\s+developer\s+mode|enable\s+DAN\s+mode|jailbreak)/i },
    { name: "XML/HTML Delimiter Smuggling", pattern: /<\/?(?:system|instruction|untrusted_content|context|prompt|admin|eval|exec)[^>]*>/i },
    { name: "Markdown / Prompt Delimiter Breaking", pattern: /(?:```(?:system|instruction|prompt)|\[SYSTEM\]|\[ADMIN\]|<<SYS>>|<\/SYS>)/i },
    { name: "Data Exfiltration Probe", pattern: /(?:reveal|dump|leak|print|display)\s+(?:system\s+prompt|instructions|secret\s+key|api\s+key|environment\s+variables|credentials)/i },
    { name: "Code Injection / Eval Attempt", pattern: /(?:exec\(|eval\(|os\.system|child_process|__import__|process\.env)/i },
  ];

  // Hidden Unicode, bidirectional overrides, homoglyph traps & zero-width characters
  private static readonly UNICODE_EXPLOITS = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

  /**
   * Calculates Shannon Entropy of text to detect high-entropy encoded payloads (Base64, Hex, encrypted payloads)
   */
  public static calculateEntropy(input: string): number {
    if (!input || input.length === 0) return 0;
    const frequencies: Record<string, number> = {};
    for (const char of input) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    let entropy = 0;
    const len = input.length;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }
    return Number(entropy.toFixed(3));
  }

  /**
   * Sanitizes untrusted content before wrapping into structural tags.
   * Escapes XML delimiters to prevent delimiter breakout.
   */
  public static escapeXmlDelimiters(content: string): string {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Wraps untrusted dynamic content in isolated structural tags.
   * Ensures the LLM evaluates the content purely as inert payload.
   */
  public static wrapUntrustedContent(sourceName: string, rawData: unknown): string {
    const serialized = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
    const cleaned = serialized.replace(this.UNICODE_EXPLOITS, "");
    const escaped = this.escapeXmlDelimiters(cleaned);
    return `<untrusted_content source="${this.escapeXmlDelimiters(sourceName)}">\n${escaped}\n</untrusted_content>`;
  }

  /**
   * Scans and sanitizes incoming user input prompt.
   */
  public static scan(input: string, strictMode = true): FirewallScanResult {
    const detectedThreats: string[] = [];

    if (!input || typeof input !== "string") {
      return {
        isSafe: false,
        sanitizedContent: "",
        detectedThreats: ["Null or invalid input type"],
        entropyScore: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // 1. Strip hidden zero-width and control characters
    let sanitized = input.replace(this.UNICODE_EXPLOITS, "");

    // 2. Detect prompt injection patterns
    for (const { name, pattern } of this.INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        detectedThreats.push(name);
      }
    }

    // 3. Detect high-entropy strings (potential base64 payload smuggling)
    const entropy = this.calculateEntropy(sanitized);
    if (entropy > 5.5 && sanitized.length > 50) {
      detectedThreats.push(`High Shannon Entropy (${entropy}) - potential encoded payload`);
    }

    // 4. Strict mode neutralization
    if (strictMode && detectedThreats.length > 0) {
      for (const { pattern } of this.INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, "[FILTERED_INJECTION_ATTEMPT]");
      }
    }

    // 5. Escape delimiters
    sanitized = sanitized.trim();

    return {
      isSafe: detectedThreats.length === 0,
      sanitizedContent: sanitized,
      detectedThreats,
      entropyScore: entropy,
      timestamp: new Date().toISOString(),
    };
  }
}

