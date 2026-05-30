import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { allRoutes } from "../modules/routes.manifest.ts";

const environmentPath = resolve("bruno/environments/Local.bru");
const environmentFile = readFileSync(environmentPath, "utf8");
const routeVariables = new Map(
  allRoutes.map((route) => [route.brunoVar, toBrunoPath(route.path)]),
);

const updatedEnvironmentFile = updateVarsBlock(environmentFile, routeVariables);

writeFileSync(environmentPath, updatedEnvironmentFile);

console.log(`Synced ${routeVariables.size} route variables to ${environmentPath}`);

function toBrunoPath(path: string): string {
  return path.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, "{{$1}}");
}

function updateVarsBlock(file: string, variables: Map<string, string>): string {
  const lines = file.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === "vars {");

  if (startIndex === -1) {
    throw new Error("Could not find vars block in Bruno environment file");
  }

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && line.trim() === "}",
  );

  if (endIndex === -1) {
    throw new Error("Could not find end of vars block in Bruno environment file");
  }

  const existingVariableLines = lines.slice(startIndex + 1, endIndex);
  const routeVariableNames = new Set(variables.keys());
  const preservedVariableLines = existingVariableLines.filter((line) => {
    const variableName = line.trim().match(/^([^:]+):/)?.[1];
    return variableName ? !routeVariableNames.has(variableName) : true;
  });
  const routeVariableLines = Array.from(variables.entries()).map(
    ([key, value]) => `  ${key}: ${value}`,
  );

  return [
    ...lines.slice(0, startIndex + 1),
    ...preservedVariableLines,
    ...routeVariableLines,
    ...lines.slice(endIndex),
  ].join("\n");
}
