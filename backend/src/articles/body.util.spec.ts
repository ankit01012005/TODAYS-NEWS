import { assertValidBodyShape, deriveBodyPlain, isSafeHref } from "./body.util";
import { BadRequestError } from "../common/http-errors";

const MEDIA_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const validBody = [
  { type: "paragraph", content: [{ text: "Hello " }, { text: "world", marks: ["strong"] }] },
  { type: "heading", level: 2, content: [{ text: "A heading" }] },
  {
    type: "paragraph",
    content: [{ text: "Read more", marks: [{ type: "link", href: "https://example.com/report" }] }],
  },
  { type: "quote", content: [{ text: "Quoted" }], attribution: "Someone" },
  { type: "list", style: "ordered", items: [[{ text: "one" }], [{ text: "two" }]] },
  { type: "image", mediaId: MEDIA_ID, url: "/uploads/abc.jpg", alt: "An image", credit: "Agency" },
  { type: "image", mediaId: "", url: "", alt: "" },
  { type: "divider" },
];

describe("assertValidBodyShape — docs/26 §3.4", () => {
  it("accepts every V1 block type in its documented shape", () => {
    expect(() => assertValidBodyShape(validBody)).not.toThrow();
  });

  it.each([
    ["javascript:alert(1)"],
    ["JAVASCRIPT:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox"],
    ["java\nscript:alert(1)"],
    ["//evil.example/path"],
    ["file:///etc/passwd"],
  ])("rejects a link mark whose href is %p", (href) => {
    const body = [{ type: "paragraph", content: [{ text: "x", marks: [{ type: "link", href }] }] }];
    expect(() => assertValidBodyShape(body)).toThrow(BadRequestError);
  });

  it("accepts http(s) links, same-site paths and fragments", () => {
    for (const href of ["https://example.com", "http://example.com/a?b=c", "/world/story", "#sources"]) {
      expect(isSafeHref(href)).toBe(true);
    }
  });

  it("rejects an unknown block type and a block without a type", () => {
    expect(() => assertValidBodyShape([{ type: "embed", html: "<b>" }])).toThrow(BadRequestError);
    expect(() => assertValidBodyShape([{ content: [] }])).toThrow(BadRequestError);
    expect(() => assertValidBodyShape("not an array")).toThrow(BadRequestError);
  });

  it("rejects a heading level other than 2 or 3 and an unknown list style", () => {
    expect(() => assertValidBodyShape([{ type: "heading", level: 1, content: [] }])).toThrow(BadRequestError);
    expect(() => assertValidBodyShape([{ type: "list", style: "bullets", items: [] }])).toThrow(BadRequestError);
  });

  it("rejects an image that points outside this server's media path", () => {
    for (const url of ["https://evil.example/x.jpg", "/uploads/../.env", "javascript:1", "/other/x.jpg"]) {
      expect(() =>
        assertValidBodyShape([{ type: "image", mediaId: MEDIA_ID, url, alt: "x" }]),
      ).toThrow(BadRequestError);
    }
  });

  it("rejects an image with a non-UUID mediaId unless it is the empty draft placeholder", () => {
    expect(() =>
      assertValidBodyShape([{ type: "image", mediaId: "not-a-uuid", url: "/uploads/x.jpg", alt: "x" }]),
    ).toThrow(BadRequestError);
    expect(() => assertValidBodyShape([{ type: "image", mediaId: "", url: "", alt: "" }])).not.toThrow();
  });

  it("rejects malformed inline spans and unknown marks", () => {
    expect(() => assertValidBodyShape([{ type: "paragraph", content: [{ txt: "x" }] }])).toThrow(BadRequestError);
    expect(() => assertValidBodyShape([{ type: "paragraph", content: "plain string" }])).toThrow(BadRequestError);
    expect(() =>
      assertValidBodyShape([{ type: "paragraph", content: [{ text: "x", marks: ["underline"] }] }]),
    ).toThrow(BadRequestError);
  });

  it("enforces the block-count limit", () => {
    const tooMany = Array.from({ length: 501 }, () => ({ type: "divider" }));
    expect(() => assertValidBodyShape(tooMany)).toThrow(BadRequestError);
  });
});

describe("deriveBodyPlain", () => {
  it("projects the text of paragraphs, headings, quotes and list items in order", () => {
    expect(deriveBodyPlain(validBody)).toBe("Hello  world A heading Read more Quoted one two");
  });
});
