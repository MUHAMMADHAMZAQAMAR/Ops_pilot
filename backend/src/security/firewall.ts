import { FirewallScanResult } from "../types/security.js";
import { env } from "../config/env.js";

/**
 * Enterprise Zero-Trust Prompt Injection & Structural Sanitization Firewall.
 * Strips delimiter breakouts, hidden unicode exploits, role-hijacking, and eval vectors.
 */
export class PromptFirewall {
  private static readonly INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
    { name: "System Instruction Override", pattern: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|rules|prompts|directives)/i },
    { name: "Role Hijacking", pattern: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|switch\s+to\s+developer\s+mode|enable\s+DAN\s+mode|jailbreak)/i },
    { name: "XML/HTML Delimiter Smuggling", pattern: /<\/?(?:system|instruction|untrusted_content|context|prompt|admin|eval|exec)[^>]*>/i },
    { name: "Markdown / Prompt Delimiter Breaking", pattern: /(?:```(?:system|instruction|prompt)|\[SYSTEM\]|\[ADMIN\]|<<SYS>>|<\/SYS>)/i },
    { name: "Data Exfiltration Probe", pattern: /(?:reveal|dump|leak|print|display)\s+(?:system\s+prompt|instructions|secret\s+key|api\s+key|environment\s+variables|credentials)/i },
    { name: "Code Injection / Eval Attempt", pattern: /(?:exec\(|eval\(|os\.system|child_process|__import__|process\.env)/i },
  ];

  private static readonly UNICODE_EXPLOITS = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

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

  public static escapeXmlDelimiters(content: string): string {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  public static wrapUntrustedContent(sourceName: string, rawData: unknown): string {
    const serialized = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
    const cleaned = serialized.replace(this.UNICODE_EXPLOITS, "");
    const escaped = this.escapeXmlDelimiters(cleaned);
    return `<untrusted_content source="${this.escapeXmlDelimiters(sourceName)}">\n${escaped}\n</untrusted_content>`;
  }

  public static scan(input: string, strictMode = env.FIREWALL_STRICT_MODE): FirewallScanResult {
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

    let sanitized = input.replace(this.UNICODE_EXPLOITS, "");

    for (const { name, pattern } of this.INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        detectedThreats.push(name);
      }
    }

    const entropy = this.calculateEntropy(sanitized);
    if (entropy > env.FIREWALL_ENTROPY_THRESHOLD && sanitized.length > 50) {
      detectedThreats.push(`High Shannon Entropy (${entropy}) - potential encoded payload`);
    }

    if (strictMode && detectedThreats.length > 0) {
      for (const { pattern } of this.INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, "[FILTERED_INJECTION_ATTEMPT]");
      }
    }

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

