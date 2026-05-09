module.exports = function (eleventyConfig) {
  const client = process.env.ADSENSE_CLIENT_ID || "";
  const slotTop = process.env.ADSENSE_SLOT_TOP || "";
  const slotBottom = process.env.ADSENSE_SLOT_BOTTOM || "";

  eleventyConfig.addGlobalData("adsenseClient", client);
  eleventyConfig.addGlobalData("adsenseSlotTop", slotTop);
  eleventyConfig.addGlobalData("adsenseSlotBottom", slotBottom);

  return {
    dir: {
      input: "content",
      includes: "_includes",
      output: "_site",
      dataTemplateEngine: "liquid",
      markdownTemplateEngine: "liquid",
      htmlTemplateEngine: "liquid",
    },
    templateFormats: ["md", "liquid", "html"],
  };
};
