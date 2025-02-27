"use strict";
import aws from "aws-sdk";
import { Bucket } from "sst/node/bucket";
import { getCodeList } from "./codelists.js"; // taken from https://raw.githubusercontent.com/Canadian-Geospatial-Platform/HNAP_JSON_Codelist/main/loc/codelists.json
const s3 = new aws.S3();
const OUTPUT_BUCKET_NAME = Bucket.hnap.bucketName;
var languageCode; // defined globally as it is widely used and unchanging.

export const handler = async (event, context, callback) => {
  console.log("Starting handling of entry: ", event.Records[0].s3.object.key);

  // Only run the handler for valid files
  if (!event.Records[0].s3.object.key.endsWith(".json")) {
    console.log("Skipping file: Not a JSON file");
    return;
  }

  const data = await getBucketObject(
    event.Records[0].s3.bucket.name,
    event.Records[0].s3.object.key,
  );
  languageCode = data["gmd:language"]?.["gco:CharacterString"]?.["#text"];
  const result = await parseData(data);
  return writeToOutputBucket(result);
};

async function writeToOutputBucket(result) {
  const key = "geocore/" + result.features[0].properties.id + ".geojson";
  try {
    const outputConfig = {
      Bucket: OUTPUT_BUCKET_NAME,
      Key: key,
      ContentType: "application/json",
      Body: JSON.stringify(result),
    };

    const put = await s3.putObject(outputConfig).promise();
    return {
      result:
        "Data was successfully written to " + OUTPUT_BUCKET_NAME + "/" + key,
    };
  } catch (error) {
    error =
      "Error when parsing UUID: " +
      result.properties[0].id +
      " with message: " +
      error;
    console.log(error);
    return error;
  }
}

async function parseData(data) {
  const properties = {
    id: data["gmd:fileIdentifier"]?.["gco:CharacterString"]?.["#text"],
    title: parseMultilingualStringObject(
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:citation"
      ]?.["gmd:CI_Citation"]?.["gmd:title"]?.["gco:CharacterString"]?.["#text"],
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:citation"
      ]?.["gmd:CI_Citation"]?.["gmd:title"]?.["gmd:PT_FreeText"]?.[
        "gmd:textGroup"
      ]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
    description: parseMultilingualStringObject(
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:abstract"
      ]?.["gco:CharacterString"]?.["#text"],
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:abstract"
      ]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    keywords: parseKeywords(data),
    topicCategory: parseTopicCategory(data),
    options: parseOptions(data),
    date: parseDates(data),
    spatialRepresentation: splitMultilingualString(
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:spatialRepresentationType"
      ]?.["gmd:MD_SpatialRepresentationTypeCode"]?.["#text"],
    ),
    type: splitMultilingualString(
      data["gmd:hierarchyLevel"]?.["gmd:MD_ScopeCode"]?.["#text"],
    ),
    //   geometry: 'located in extent',
    extent: parseExtent(data),
    refSys: parseReferenceSystem(data),
    status: splitMultilingualString(
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:status"
      ]?.["gmd:MD_ProgressCode"]?.["#text"],
    ),
    maintenance: splitMultilingualString(
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:resourceMaintenance"
      ]?.["gmd:MD_MaintenanceInformation"]?.[
        "gmd:maintenanceAndUpdateFrequency"
      ]?.["gmd:MD_MaintenanceFrequencyCode"]?.["#text"],
    ),
    metadataStandard: parseMetadataStandard(data),
    graphicOverview: parseGraphicOverviews(data),
    distributionFormat: parseDistributionFormats(data),
    constraints: parseConstraints(data),
    dateStamp: data["gmd:dateStamp"]?.["gco:DateTime"]?.["#text"],
    dataSetURI: data["gco:CharacterString"]?.["#text"],
    locale: parseLocale(data),
    language: languageCode,
    characterSet: splitMultilingualString(
      data["gmd:characterSet"]?.["gmd:MD_CharacterSetCode"]?.["#text"],
    ),
    environmentDescription:
      data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
        "gmd:environmentDescription"
      ]?.["gco:CharacterString"]?.["#text"],
    supplementalInformation: parseSupplementalInformation(data),
    contact: parseContacts(data),
    credits: parseCredits(data),
    cited: parseCited(data),
    distributor: parseDistributors(data),
    plugins: await getPlugins(
      data["gmd:fileIdentifier"]?.["gco:CharacterString"]?.["#text"],
    ),
  };
  let res = parseGeographicFeatures(properties.extent.geographicExtent);
  res.features[0].properties = properties;
  res.when = parseTemporalFeatures(properties.extent.temporalExtent).when;
  return res;
}

function parseTopicCategory(data) {
  const topicCategoryCodes = collectSubValues(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:topicCategory"
    ],
    '["gmd:MD_TopicCategoryCode"]',
  );
  return getCodeList(topicCategoryCodes);
}

function parseDistributors(data) {
  let ret = [];
  const distributorArray = collectSubValues(
    data["gmd:distributionInfo"]?.["gmd:MD_Distribution"]?.["gmd:distributor"],
    '["gmd:MD_Distributor"]?.["gmd:distributorContact"]?.["gmd:CI_ResponsibleParty"]',
  );
  distributorArray.forEach((e) => {
    ret.push(parseContact(e));
  });
  return ret;
}

function parseCredits(data) {
  let ret = [];
  const creditsArray = toArray(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:credit"
    ],
  );
  creditsArray.forEach((e) => {
    ret.push(parseContact(e));
  });
  return ret;
}

function parseCited(data) {
  let ret = [];
  const citedArray = collectSubValues(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:citation"
    ]?.["gmd:CI_Citation"]?.["gmd:citedResponsibleParty"],
    '["gmd:CI_ResponsibleParty"]',
  );
  citedArray.forEach((e) => ret.push(parseContact(e)));
  return ret;
}

function parseContacts(data) {
  let ret = [];
  const contactArray = toArray(data["gmd:contact"]);
  contactArray.forEach((e) => {
    ret.push(parseContact(e?.["gmd:CI_ResponsibleParty"]));
  });
  return ret;
}

// This function is reused to parse what can be defined as a contact in more than one context. Currently this includes: Contacts, Cited, Credits and Distributors. The schema for all of these entries seems to be reused
function parseContact(contact) {
  return {
    responsibleParty:
      contact?.["gmd:individualName"]?.["gco:CharacterString"]?.["#text"],
    position: parseMultilingualStringObject(
      contact?.["gmd:positionName"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:positionName"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    organisation: parseMultilingualStringObject(
      contact?.["gmd:organisationName"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:organisationName"]?.["gmd:PT_FreeText"]?.[
        "gmd:textGroup"
      ]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
    telephone: parseMultilingualStringObject(
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:phone"]?.[
        "gmd:CI_Telephone"
      ]?.["gmd:voice"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:phone"]?.[
        "gmd:CI_Telephone"
      ]?.["gmd:voice"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    fax: contact?.["gmd:CI_ResponsibleParty"]?.["gmd:contactInfo"]?.[
      "gmd:CI_Contact"
    ]?.["gmd:phone"]?.["gmd:CI_Telephone"]?.["gmd:facsimile"]?.[
      "gco:CharacterString"
    ]?.["#text"],
    address: parseMultilingualStringObject(
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:deliveryPoint"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:deliveryPoint"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    city: contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
      "gmd:CI_Address"
    ]?.["gmd:city"]?.["gco:CharacterString"]?.["#text"],
    provinceOrTerritory: parseMultilingualStringObject(
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:administrativeArea"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:administrativeArea"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    postalCode:
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:postalCode"]?.["gco:CharacterString"]?.["#text"],
    country: parseMultilingualStringObject(
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:country"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:country"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
    email: parseMultilingualStringObject(
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:electronicMailAddress"]?.["gco:CharacterString"]?.["#text"],
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:address"]?.[
        "gmd:CI_Address"
      ]?.["gmd:electronicMailAddress"]?.["gmd:PT_FreeText"]?.[
        "gmd:textGroup"
      ]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
    onlineResource: {
      url: contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.[
        "gmd:onlineResource"
      ]?.["gmd:CI_OnlineResource"]?.["gmd:linkage"]?.["gmd:URL"],
      protocol:
        contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.[
          "gmd:onlineResource"
        ]?.["gmd:CI_OnlineResource"]?.["gmd:protocol"]?.[
          "gco:CharacterString"
        ]?.["#text"],
      name: contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.[
        "gmd:onlineResource"
      ]?.["gmd:CI_OnlineResource"]?.["gmd:name"]?.["gco:CharacterString"]?.[
        "#text"
      ],
      description:
        contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.[
          "gmd:onlineResource"
        ]?.["gmd:CI_OnlineResource"]?.["gmd:description"]?.[
          "gco:CharacterString"
        ]?.["#text"],
    },
    hoursOfService:
      contact?.["gmd:contactInfo"]?.["gmd:CI_Contact"]?.[
        "gmd:hoursOfService"
      ]?.["gco:CharacterString"]?.["#text"],
    role: splitMultilingualString(
      contact?.["gmd:role"]?.["gmd:CI_RoleCode"]?.["#text"],
    ),
  };
}

function parseSupplementalInformation(data) {
  return parseMultilingualStringObject(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:supplementalInformation"
    ]?.["gco:CharacterString"]?.["#text"],
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:supplementalInformation"
    ]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
      "gmd:LocalisedCharacterString"
    ]?.["#text"],
  );
}

function parseLocale(data) {
  return {
    language: splitMultilingualString(
      data["gmd:locale"]?.["gmd:PT_Locale"]?.["gmd:languageCode"]?.[
        "gmd:LanguageCode"
      ]?.["#text"],
    ),
    country: splitMultilingualString(
      data["gmd:locale"]?.["gmd:PT_Locale"]?.["gmd:country"]?.["gmd:Country"]?.[
        "#text"
      ],
    ),
    encoding: splitMultilingualString(
      data["gmd:locale"]?.["gmd:PT_Locale"]?.["gmd:characterEncoding"]?.[
        "gmd:MD_CharacterSetCode"
      ]?.["#text"],
      ["gmd:contactInfo"]?.["gmd:CI_Contact"]?.["gmd:phone"]?.[
        "gmd:CI_Telephone"
      ]?.["gmd:voice"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
        "gmd:LocalisedCharacterString"
      ]?.["#text"],
    ),
  };
}

function parseConstraints(data) {
  const constraints =
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:resourceConstraints"
    ]?.["gmd:MD_LegalConstraints"];
  let ret = {
    legal: parseMultilingualStringObject(
      constraints?.["gmd:useLimitation"]?.["gco:CharacterString"]?.["#text"],
      constraints?.["gmd:useLimitation"]?.["gmd:PT_FreeText"]?.[
        "gmd:textGroup"
      ]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
    access: splitMultilingualString(
      constraints?.["gmd:accessConstraints"]?.["gmd:MD_RestrictionCode"]?.[
        "#text"
      ],
    ),
    use: splitMultilingualString(
      constraints?.["gmd:useConstraints"]?.["gmd:MD_RestrictionCode"]?.[
        "#text"
      ],
    ),
    other:
      constraints?.["gmd:otherConstraints"]?.["gco:CharacterString"]?.["#text"],
  };
  return ret;
}

function parseDistributionFormats(data) {
  let ret = [];
  const distributionFormatArray = collectSubValues(
    data["gmd:distributionInfo"]?.["gmd:MD_Distribution"]?.[
      "gmd:distributionFormat"
    ],
    '["gmd:MD_Format"]',
  );
  distributionFormatArray.forEach((e) => {
    ret.push(parseDistributionFormat(e));
  });
  return ret;
}

function parseDistributionFormat(distributionFormat) {
  return {
    name: distributionFormat?.["gmd:name"]?.["gco:CharacterString"]?.["#text"],
    format:
      distributionFormat?.["gmd:version"]?.["gco:CharacterString"]?.["#text"],
  };
}

function parseGraphicOverviews(data) {
  let ret = [];
  let graphicOverviewArray = collectSubValues(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:graphicOverview"
    ],
    '["gmd:MD_BrowseGraphic"]',
  );
  graphicOverviewArray.forEach((e) => {
    ret.push(parseGraphicOverview(e));
  });
  return ret;
}

function parseGraphicOverview(graphicOverview) {
  let ret = {
    name: graphicOverview?.["gmd:fileName"]?.["gco:CharacterString"]?.["#text"],
    description:
      graphicOverview?.["gmd:fileDescription"]?.["gco:CharacterString"]?.[
        "#text"
      ],
    type: graphicOverview?.["gmd:fileType"]?.["gco:CharacterString"]?.["#text"],
  };
  return ret;
}

function parseMetadataStandard(data) {
  return {
    text: parseMetadataStandardText(data),
    version: parseMetadataStandardVersion(data),
  };
}

function parseMetadataStandardText(data) {
  return parseMultilingualStringObject(
    data["gmd:metadataStandardName"]?.["gco:CharacterString"]?.["#text"],
    data["gmd:metadataStandardName"]?.["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
      "gmd:LocalisedCharacterString"
    ]?.["#text"],
  );
}

function parseMetadataStandardVersion(data) {
  return data["gmd:metadataStandardVersion"]?.["gco:CharacterString"]?.[
    "#text"
  ];
}

function parseReferenceSystem(data) {
  const referenceSystemValues = collectSubValues(
    data["gmd:referenceSystemInfo"],
    '["gmd:MD_ReferenceSystem"]?.["gmd:referenceSystemIdentifier"]?.["gmd:RS_Identifier"]',
  );
  let ret = [];
  referenceSystemValues.forEach((e) => {
    let reference = {
      code: e["gmd:code"]?.["gco:CharacterString"]?.["#text"],
      version: e["gmd:version"]?.["gco:CharacterString"]?.["#text"],
    };
    ret.push(reference);
  });
  return ret;
}

function parseKeywords(data) {
  let ret = [];
  const keywordArray = collectSubValues(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:descriptiveKeywords"
    ],
    '["gmd:MD_Keywords"]?.["gmd:keyword"]',
  );
  keywordArray.forEach((e) => {
    ret.push(
      parseMultilingualStringObject(
        e["gco:CharacterString"]?.["#text"],
        e["gmd:PT_FreeText"]?.["gmd:textGroup"]?.[
          "gmd:LocalisedCharacterString"
        ]?.["#text"],
      ),
    );
  });
  return ret;
}

//options is also known as the "Data Resources" in GeoNetwork.
function parseOptions(data) {
  let ret = [];
  const optionsArray = collectSubValues(
    data["gmd:distributionInfo"]?.["gmd:MD_Distribution"]?.[
      "gmd:transferOptions"
    ],
    '["gmd:MD_DigitalTransferOptions"]?.["gmd:onLine"]',
  );
  optionsArray.forEach((e) => {
    ret.push(parseOption(e));
  });
  return ret;
}

function parseOption(option) {
  const parsedOption = {
    url: option?.["gmd:CI_OnlineResource"]?.["gmd:linkage"]?.["gmd:URL"],
    protocol:
      option?.["gmd:CI_OnlineResource"]?.["gmd:protocol"]?.[
        "gco:CharacterString"
      ]?.["#text"],
    name: parseMultilingualStringObject(
      option?.["gmd:CI_OnlineResource"]?.["gmd:name"]?.[
        "gco:CharacterString"
      ]?.["#text"],
      option?.["gmd:CI_OnlineResource"]?.["gmd:name"]?.["gmd:PT_FreeText"]?.[
        "gmd:textGroup"
      ]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
    description: parseMultilingualStringObject(
      option?.["gmd:CI_OnlineResource"]?.["gmd:description"]?.[
        "gco:CharacterString"
      ]?.["#text"],
      option?.["gmd:CI_OnlineResource"]?.["gmd:description"]?.[
        "gmd:PT_FreeText"
      ]?.["gmd:textGroup"]?.["gmd:LocalisedCharacterString"]?.["#text"],
    ),
  };
  return parsedOption;
}

function parseDates(data) {
  let ret = [];
  const dateArray =
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:citation"
    ]?.["gmd:CI_Citation"]?.["gmd:date"] ?? [];
  dateArray.forEach((e) => {
    ret.push(parseDate(e));
  });
  return ret;
}

function parseDate(date) {
  return {
    dateType: splitMultilingualString(
      date["gmd:CI_Date"]?.["gmd:dateType"]?.["gmd:CI_DateTypeCode"]?.["#text"],
    ),
    date: date["gmd:CI_Date"]?.["gmd:date"]?.["gco:Date"]?.["#text"],
  };
}

function parseExtent(data) {
  const basePath = collectSubValues(
    data["gmd:identificationInfo"]?.["gmd:MD_DataIdentification"]?.[
      "gmd:extent"
    ],
    '["gmd:EX_Extent"]',
  );
  let ret = {};
  basePath.forEach((e) => {
    let temporalExtent = parseTemporalExtent(
      e?.["gmd:temporalElement"]?.["gmd:EX_TemporalExtent"]?.["gmd:extent"]?.[
        "gml:TimePeriod"
      ],
    );
    let geographicExtent = parseGeographicExtent(
      e?.["gmd:geographicElement"]?.["gmd:EX_GeographicBoundingBox"],
    );
    if (temporalExtent) {
      ret.temporalExtent = temporalExtent;
    }
    if (geographicExtent) {
      ret.geographicExtent = geographicExtent;
    }
  });
  return ret;
}

function parseTemporalExtent(temporalExtent) {
  const ret = {
    start: temporalExtent?.["gml:beginPosition"],
    end: temporalExtent?.["gml:endPosition"],
  };
  return someOrNone(ret);
}

// todo: this will probably have to be changed to handle multiple different types of geographicBoudingBoxes
function parseGeographicExtent(geographicExtent) {
  let ret = {
    north:
      geographicExtent?.["gmd:northBoundLatitude"]?.["gco:Decimal"]?.["#text"],
    south:
      geographicExtent?.["gmd:southBoundLatitude"]?.["gco:Decimal"]?.["#text"],
    east: geographicExtent?.["gmd:eastBoundLongitude"]?.["gco:Decimal"]?.[
      "#text"
    ],
    west: geographicExtent?.["gmd:westBoundLongitude"]?.["gco:Decimal"]?.[
      "#text"
    ],
  };
  if (!ret.north && !ret.south && !ret.east && !ret.west) return null;
  return ret;
}

// todo: handle multiple geographicExtents
// todo: handle formats other than bbox
// @input geographicExtent
function parseGeographicFeatures(geographicExtent) {
  if (
    isNaN(geographicExtent?.["east"]) ||
    isNaN(geographicExtent?.["south"]) ||
    isNaN(geographicExtent?.["west"]) ||
    isNaN(geographicExtent?.["north"])
  ) {
    throw new Error("Error invalid geographicExtent passed to parseFeatures.");
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [parseFloat(geographicExtent.west), parseFloat(geographicExtent.south)],
              [parseFloat(geographicExtent.east), parseFloat(geographicExtent.south)],
              [parseFloat(geographicExtent.east), parseFloat(geographicExtent.north)],
              [parseFloat(geographicExtent.west), parseFloat(geographicExtent.north)],
              [parseFloat(geographicExtent.west), parseFloat(geographicExtent.south)],
            ],
          ],
        },
      },
    ],
  };
}

// todo: handle multiple timespans
// uses toISOString() dates. see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString.
// @input temporalExtent
// @output when
//   "when" {
//    "timespans":[{"start": "1492", "end": "1500", }]
//  }
function parseTemporalFeatures(temporalExtent) {
  let start = new Date(temporalExtent.start);
  let end = temporalExtent.end ? new Date(temporalExtent.end) : null;
  if (
    !temporalExtent.start ||
    start == "Invalid Date" ||
    end == "Invalid Date"
  ) {
    throw new Error(
      "Error invalid temporalExtent passed to parseTemporalFeatures.",
    );
  }
  return {
    when: {
      timespans: [{ start: start, end: end }],
    },
  };
}

// This functions purpose is to remove empty objects, strings, or strings of text indicating null from return
// If someOrNoneValue is [], {}, '', null, undefined we return undefined.
// Otherwise we return the value
function someOrNone(someOrNoneValue) {
  if (
    someOrNoneValue === null ||
    someOrNoneValue === undefined ||
    (typeof someOrNoneValue === "string" &&
      (someOrNoneValue.toLowerCase() === "null" ||
        someOrNoneValue.toLowerCase() === "")) ||
    someOrNoneValue === [] ||
    (typeof someOrNoneValue === "object" &&
      (Object.keys(someOrNoneValue).length === 0 ||
        Object.keys(someOrNoneValue).every(
          (k) => !someOrNone(someOrNoneValue[k]),
        )))
  )
    return undefined;
  return someOrNoneValue;
}

// This function is used to correctly set en and fr string in a string object based on the default HNAP languageCode.
// Here is a multilingual string object output example:
//  {
//  en: "English Title",
//  fr: "Titre français"
//  }
// @input characterStringText the string of text written in the main language
// @input localisedCharacterStringText the string of text written in a secondary language
// @input languageCode the language code for the main language
function parseMultilingualStringObject(
  characterStringText,
  localisedCharacterStringText,
) {
  if (!characterStringText && !localisedCharacterStringText) return undefined;
  switch (languageCode) {
    case "fra; CAN":
      return {
        en: localisedCharacterStringText,
        fr: characterStringText,
      };
    case "eng; CAN":
      return {
        en: characterStringText,
        fr: localisedCharacterStringText,
      };
    default:
      throw new Error(
        "Error when parsing data: Language Code " +
          languageCode +
          " is invalid.",
      );
  }
}

function splitMultilingualString(multilingualString) {
  if (!multilingualString) return undefined;
  let values = multilingualString.split("; ");
  return {
    en: values[0],
    fr: values[1],
  };
}

// This functions takes a value that can be eather X or [X] and returns [X] in all cases.
function toArray(valueOrArray) {
  if (Array.isArray(valueOrArray)) return valueOrArray;
  if (!valueOrArray) {
    console.log("Warning: toArray(falsy) called. Empty Array returned.");
    return [];
  }
  return [valueOrArray];
}

function collectSubValues(parent, pathToChild) {
  let ret = [];
  toArray(parent).forEach((e) => {
    let value = null;

    try {
      value = eval(`e?.${pathToChild}`);
    } catch (e) {
      console.log(
        "Warning: Error accessing child elements in collectSubValues(). Path to child: \n" +
          pathToChild +
          "Parent element: \n" +
          JSON.stringify(e),
      );
    }

    if (value) {
      toArray(value).forEach((f) => {
        ret = ret.concat(f);
      });
    } else {
      console.log("Warning: collectSubValues() value is falsy, value ignored.");
    }
  });
  return ret;
}

// Get the geojson from the output bucket
async function getBucketObject(bucket, objectKey) {
  const params = {
    Bucket: bucket,
    Key: objectKey,
  };
  try {
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString("utf-8"));
  } catch (e) {
    console.log(
      `Warning: Could not retrieve file ${objectKey} from ${bucket}: ${e.message}. This can be caused by the bucket having no entry for this specific item or a race condition due to the eventual consistency model of s3. `,
    );
    return null;
  }
}

// Config for fetching data from the output bucket
async function getLatestGeocoreData(id) {
  const bucket = OUTPUT_BUCKET_NAME; // Global variable from process.env
  const key = "geocore/" + id + ".geojson";
  const ret = await getBucketObject(bucket, key);
  return ret;
}

// Get plugins section from the output bucket. This should proably throw an error in case data cannot be read to prevent data loss from overwriting. The current behavior in such cases will probably overwrite the plugins section with nothing.
async function getPlugins(id) {
  const geocoreData = await getLatestGeocoreData(id);
  return geocoreData?.features?.[0]?.properties?.plugins;
}