const crs = require('./crs/crs.js');
const { DateTime } = require('luxon');

const pageAssetsPlugin = require('eleventy-plugin-page-assets');

module.exports = function (eleventyConfig) {

  // https://www.11ty.dev/docs/languages/markdown/#indented-code-blocks
  eleventyConfig.amendLibrary("md", (mdLib) => mdLib.enable("code"));

  // https://github.com/victornpb/eleventy-plugin-page-assets
  eleventyConfig.addPlugin(pageAssetsPlugin, {
    mode: "directory",
    assetsMatching: "*.png|*.PNG|*.jpg|*.JPG|*.gif|*.GIF|*.cr|*.nr|*.txt",
    postsMatching: "**/*.md",
    hashAssets: false,
    recursive: true,
    silent: true,
  });

  eleventyConfig.addFilter('dateIso', date => {
    if (!date) return '';
    try {
      const dt = date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(String(date));
      if (dt.isValid) return dt.toUTC().toISO();
      // fallback to native parse
      const d2 = new Date(String(date));
      return isNaN(d2) ? '' : DateTime.fromJSDate(d2).toUTC().toISO();
    } catch (e) { return ''; }
  });

  // dateReadable: server-side formatted date using the provided locale (e.g. page.locale)
  // Usage: {{ page.date | dateReadable(page.locale) }} — falls back to 'de'
  eleventyConfig.addFilter('dateReadable', (date, locale) => {
    if (!date) return '';
    let dt = date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(String(date));
    if (!dt.isValid) dt = DateTime.fromJSDate(new Date(String(date)));
    const useLocale = locale || 'en';
    return dt.setLocale(useLocale).toLocaleString(DateTime.DATE_FULL);
  });

  eleventyConfig.addShortcode('excerpt', article => extractExcerpt(article));

  // Folders to copy to output folder
  eleventyConfig.addPassthroughCopy("css");

  crs(eleventyConfig);

  // all reports go here
  eleventyConfig.addPassthroughCopy("reports");

};

module.exports.config = {
  // pathPrefix: "/tutorials",
}

function extractExcerpt(article) {
  if (!article.hasOwnProperty('templateContent')) {
    console.warn('Failed to extract excerpt: Document has no property "templateContent".');
    return null;
  }

  let excerpt = null;
  const content = article.templateContent;

  // The start and end separators to try and match to extract the excerpt
  const separatorsList = [
    { start: '<!-- Excerpt Start -->', end: '<!-- Excerpt End -->' },
    { start: '<p>', end: '</p>' }
  ];

  separatorsList.some(separators => {
    const startPosition = content.indexOf(separators.start);

    // This end position could use "lastIndexOf" to return all the paragraphs rather than just the first
    // paragraph when matching is on "<p>" and "</p>".
    const endPosition = content.indexOf(separators.end);

    if (startPosition !== -1 && endPosition !== -1) {
      excerpt = content.substring(startPosition + separators.start.length, endPosition).trim();
      return true; // Exit out of array loop on first match
    }
  });

  return excerpt;
}
