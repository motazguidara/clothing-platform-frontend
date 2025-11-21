const fs = require("node:fs");
const { PaginatedOrderListSchema } = require("../src/lib/api/schemas");

const raw = fs.readFileSync("../orders_sample.json", "utf-8");
const data = JSON.parse(raw);
const parsed = PaginatedOrderListSchema.safeParse(data);
if (parsed.success) {
  console.log("parse ok");
} else {
  console.dir(parsed.error.format(), { depth: 5 });
}
