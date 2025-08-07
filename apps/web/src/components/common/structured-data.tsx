/**
 * @fileMetadata
 * @purpose "Structured data component for SEO and rich snippets"
 * @owner frontend-team
 * @dependencies ["react"]
 * @exports ["StructuredData"]
 * @complexity low
 * @tags ["seo", "structured-data", "json-ld"]
 * @status stable
 */
import React from "react";

type StructuredDataProps = {
  schema: Record<string, any> | Record<string, any>[];
};

function safeJsonLd(schema: StructuredDataProps["schema"]) {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function StructuredData({ schema }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

export default StructuredData;