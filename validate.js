import Ajv2020 from "ajv/dist/2020.js";
import fs from "fs";

// Read command line arguments
const schemaPath = process.argv[2];
const dataPath = process.argv[3];

if (!schemaPath || !dataPath) {
  console.error("Usage: node validate.js <schema.json> <data.json>");
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true });

// Fetch and add external schemas by their $id / URI
const externalSchemas = [
  "https://raw.githubusercontent.com/R-CF/zarr_convention_ref/main/schema.json",
  "https://raw.githubusercontent.com/clbarnes/zarr-convention-uom/refs/tags/v1/schema.json"
];

for (const url of externalSchemas) {
  const schema = await fetch(url).then(r => r.json());
  // Pass the URL as explicit key to handle any $id mismatch
  ajv.addSchema(schema, url);
}

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
