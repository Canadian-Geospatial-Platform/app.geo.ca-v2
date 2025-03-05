const expandedCategoryCodeData = require("./Codelists/topic-categories.json");

export function getCodeList(inputTopicCategoryCodes) {
  let ret = [];
  inputTopicCategoryCodes.forEach((e) => {
    ret.push(
      parseCategory(
        expandedCategoryCodeData.find(function(obj) {
          return obj.code === e;
        }),
      ),
    );
  });
  return ret;
}

function parseCategory(category) {
  return {
    code: category.code,
    label: {
      en: category.label_en,
      fr: category.label_fr,
    },
    description: {
      en: category.label_en,
      fr: category.label_fr,
    },
  };
}
