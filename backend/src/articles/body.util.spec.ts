import {
  assertValidBodyShape,
  collectImageMediaIds,
  deriveBodyPlain,
  isSafeHref,
  resolveImageUrls,
} from "./body.util";
import { BadRequestError } from "../common/http-errors";

const MEDIA_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const CDN_URL = "https://res.cloudinary.com/demo/image/upload/v1/today-news/abc.jpg";

const validBody = [
  { type: "paragraph", content: [{ text: "Hello " }, { text: "world", marks: ["strong"] }] },
  { type: "heading", level: 2, content: [{ text: "A heading" }] },
  {
    type: "paragraph",
    content: [{ text: "Read more", marks: [{ type: "link", href: "https://example.com/report" }] }],
  },
  { type: "quote", content: [{ text: "Quoted" }], attribution: "Someone" },
  { type: "list", style: "ordered", items: [[{ text: "one" }], [{ text: "two" }]] },
  { type: "image", mediaId: MEDIA_ID, url: CDN_URL, alt: "An image", credit: "Agency" },
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

  it("rejects an image with a non-UUID mediaId unless it is the empty draft placeholder", () => {
    expect(() =>
      assertValidBodyShape([{ type: "image", mediaId: "not-a-uuid", url: CDN_URL, alt: "x" }]),
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

describe("image URLs come from the media asset row, never the request", () => {
  it("collects each non-empty image's mediaId once", () => {
    const body = [
      { type: "image", mediaId: MEDIA_ID, url: "", alt: "" },
      { type: "image", mediaId: MEDIA_ID, url: "", alt: "" },
      { type: "image", mediaId: "", url: "", alt: "" },
      { type: "divider" },
    ];
    assertValidBodyShape(body);
    expect(collectImageMediaIds(body)).toEqual([MEDIA_ID]);
  });

  it("replaces whatever url the client sent with the stored one", () => {
    const body = [{ type: "image", mediaId: MEDIA_ID, url: "https://evil.example/x.jpg", alt: "x" }];
    assertValidBodyShape(body);
    const resolved = resolveImageUrls(body, new Map([[MEDIA_ID, CDN_URL]]));
    expect(resolved[0].url).toBe(CDN_URL);
    // Pure: the caller's array is untouched.
    expect(body[0].url).toBe("https://evil.example/x.jpg");
  });

  it("leaves the empty draft placeholder alone", () => {
    const body = [{ type: "image", mediaId: "", url: "", alt: "" }];
    assertValidBodyShape(body);
    expect(resolveImageUrls(body, new Map())).toEqual(body);
  });

  it("refuses an image naming an asset that does not exist or was deleted", () => {
    const body = [{ type: "image", mediaId: MEDIA_ID, url: "", alt: "x" }];
    assertValidBodyShape(body);
    expect(() => resolveImageUrls(body, new Map())).toThrow(BadRequestError);
  });
});

describe("deriveBodyPlain", () => {
  it("projects the text of paragraphs, headings, quotes and list items in order", () => {
    expect(deriveBodyPlain(validBody)).toBe("Hello  world A heading Read more Quoted one two");
  });
});
