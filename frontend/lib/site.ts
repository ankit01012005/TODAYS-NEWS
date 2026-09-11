/// Publication-level constants shared by the masthead, footer, metadata
/// and date formatting. The timezone is explicit so server-rendered dates
/// don't depend on whichever machine happens to render them.
export const SITE_NAME = "Today News";
export const SITE_TIMEZONE = process.env.SITE_TIMEZONE || "Asia/Kolkata";
export const SITE_LOCALE = "en-GB";

/// Average adult reading speed used for the article page's reading-time
/// estimate (brief §12). Deliberately conservative.
export const WORDS_PER_MINUTE = 220;
