// Rwanda's provinces and districts, for the location dropdowns. The API stores them as plain text
// (region = province, city = district), so this list is the only place that knows the valid names.
export const provinces: { name: string; districts: string[] }[] = [
  { name: "Kigali", districts: ["Gasabo", "Kicukiro", "Nyarugenge"] },
  { name: "Northern", districts: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"] },
  { name: "Southern", districts: ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"] },
  { name: "Eastern", districts: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"] },
  { name: "Western", districts: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"] },
];
