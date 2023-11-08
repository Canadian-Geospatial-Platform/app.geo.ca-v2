# To Do

- [] show data on map
- [] send notes on improvements to johan
  - big black loading screen on page load.
  - responsive issues / overflow
- [] fetch microdata from backend instead of relying on hardcoded value.

# Backlog

- [] shorten page count based on total result count
- [] add icons for filter, search
- [] spatial filter
- [] bug: map initialisation makes the view record button disapear. this css property is the culprit: filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
- [] fix any bug related to geoview. talk to johan about returning the object(self) on init. this would likely fix the issue. this can potentially be circumvente by setting configuration json in a variable.
- [] reproduce look from https://xd.adobe.com/view/e68f1fe5-78c9-4531-67f4-1601b12abae3-90be/specs/

# Assigned to john

- [] complete record detail page
- [] implement microdata
  - [sample](https://open.canada.ca/data/en/dataset/85cb7fc7-5847-4f76-9417-96a4f5d50702)
  - [reference](https://geocacgp.slack.com/archives/D049MDN976J/p1690986602605469)
  - [reference](https://geocacgp.slack.com/archives/D049MDN976J/p1690986548900519).
  ```HTML
  <div vocab="http://schema.org/" typeof="Dataset" style="display:none;"> <div property="includedInDataCatalog" typeof="DataCatalog"> <span property="name" value="Government of Canada Open Government Portal"><span property="spatialCoverage" typeof="Place"> <span property="geo" typeof="GeoShape"> <span property="name" value="Dataset Boundary"></span><span property="POLYGON" value="((-115.4998819999999995 51.2328049999999990, -115.2513799999999975 51.2328049999999990, -115.2513799999999975 51.2790850000000020, -115.4998819999999995 51.2790850000000020, -115.4998819999999995 51.2328049999999990))"></span></span> </span></span>
  <span property="description" value="This catalog contains metadata records describing open datasets available from the Government of Canada"></span> <span property="datePublished" value="2013-06-19"></span> <span property="dateModified" value=""></span> <span property="inLanguage" value="en-CA"></span> <span property="sameAs" value="http://open.canada.ca"></span>
  <span property="publisher" typeof="Organization"> <span property="name" value="Government of Canada, Treasury Board of Canada Secretariat"></span> <span property="email" value="open-ouvert@tbs-sct.gc.ca"></span> </span> <span property="genre" value="Information and Communications Government and Politics"></span>
  <span property="license" typeof="CreativeWork"><span property="name" value="Open Government Licence - Alberta"></span> <span property="sameAs" value="https://open.alberta.ca/licence"></span> <span property="text" value="Rights under which the catalog can be reused are outlined in the Open Government Licence - Canada"></span> </span> </div>
  ```
