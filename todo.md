# To Do

- [] bug: hnap bridge writes json object to root and geojson under `records/`.
- [] set un x,y valide par default
- [] switch to use a single s3 bucket
- [] handle deletion from hnap
- [] bbox based spatial filtering.
- [] add filtering/custom collections to favorites
- [] refresh tokens automatically.
- [] add favorited searches. (just url link since url holds state).
- [] fix maps breaking on navigation. geoview has an issue and plans on tackling the issue on their side. we can later confirm that it is fixed.
- [] fix data schema. Coordinates should be floats instead of strings.

# Backlog

- [] shorten page count based on total result count
- [] add icons for filter, search
- [] spatial filter
- [] bug: map initialisation makes the view record button disapear. this css property is the culprit: filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
- [] fix any bug related to geoview. talk to johan about returning the object(self) on init. this would likely fix the issue. this can potentially be circumvente by setting configuration json in a variable.
- [] reproduce look from https://xd.adobe.com/view/e68f1fe5-78c9-4531-67f4-1601b12abae3-90be/specs/

