import Ajv2020 from "ajv/dist/2020.js";
import Ajv from "ajv";  // draft-07 for proj:
import fs from "fs";

// Read command line arguments
const schemaPath = process.argv[2];
const dataPath = process.argv[3];

if (!schemaPath || !dataPath) {
  console.error("Usage: node validate.js <schema.json> <data.json>");
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true });
const ajv7 = new Ajv({ allErrors: true });

// Load proj: with the draft-07 instance
const proj = await fetch("https://raw.githubusercontent.com/zarr-conventions/geo-proj/main/schema.json")
  .then(r => r.json());
ajv7.addSchema(proj);

// Fetch and add external schemas by their URL
const externalSchemas = [
  "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
  "https://raw.githubusercontent.com/clbarnes/zarr-convention-uom/refs/tags/v1/schema.json"
];

for (const url of externalSchemas) {
  const schema = await fetch(url).then(r => r.json());
  // Pass the URL as explicit key to handle any $id mismatch
  ajv.addSchema(schema, url);
}

// Add proj to the 2020 instance for $ref resolution,
// Suppressing the $schema field so Ajv2020 doesn't choke on "draft-07"
const projCompat = { ...proj, $schema: "https://json-schema.org/draft/2020-12/schema" };
ajv.addSchema(projCompat);
ajv.addSchema(projCompat, "https://raw.githubusercontent.com/zarr-conventions/geo-proj/main/schema.json");

// PROJJSON schema is also in draft-07. Local copy made and converted to 2020-12
const projJson = JSON.parse(fs.readFileSync("projjson.schema.json", "utf8"));
ajv.addSchema(projJson, "https://proj.org/schemas/v0.7/projjson.schema.json");

// Read files
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Validate
const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log("✅ Validation successful!");
  process.exit(0);
} else {
  console.log("❌ Validation failed!");
  console.log(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
