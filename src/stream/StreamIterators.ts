/**
 * Copyright ©2022 Dana Basken
 */

import streams from "node:stream/web";

export class StreamIterators {

  static async *chunk(stream: streams.ReadableStream) {
    const reader = stream.getReader();
    for (;;) {
      const {done, value} = await reader.read();
      if (done) return;
      yield value;
    }
  }

  static async *line(stream: streams.ReadableStream) {
    let buffer = "";
    for await (const text of StreamIterators.chunk(stream)) {
      buffer += text;
      const match = buffer.match(/[\r\n]/);
      if (match?.index) {
        const line = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + 1);
        yield line;
      }
    }
    if (buffer.length) { yield buffer; }
  }

  static async *jsonl(stream: streams.ReadableStream) {
    let context = {text: "", braceCount: 0, inQuotes: false, escaped: false};
    for await (const text of StreamIterators.line(stream)) {
      for (const character of text) {
        context.text += character;
        if (context.escaped) {
          context.escaped = false;
        } else {
          if (character === "\\") { context.escaped = true; }
          if (character === '"') { context.inQuotes = !context.inQuotes; }
        }
        if (!context.inQuotes) {
          if (character === "{") { context.braceCount++; }
          if (character === "}") {
            context.braceCount--;
            if (context.braceCount < 0) {
              throw new Error(`malformed JSON: ${context.text}`);
            }
            if (context.braceCount === 0) {
              try {
                yield JSON.parse(context.text);
              } catch (error: any) {
                throw new Error(`${error.message}: ${context.text}`);
              }
              context = {text: "", braceCount: 0, inQuotes: false, escaped: false};
            }
          }
        }
      }
      if (context.braceCount !== 0 || context.inQuotes || context.escaped) {
        throw new Error(`malformed JSON: ${context.text}`);
      }
    }
  }

}
