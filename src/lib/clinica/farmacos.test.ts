import assert from "node:assert/strict";
import test from "node:test";
import { clasesEncontradas, farmacosEnTexto } from "./farmacos.ts";

test("encuentra los seis choques reales del barrido", async () => {
  // Textuales de las fichas, sin nada que identifique a nadie.
  const casos: [string, string][] = [
    ["Escitalopram de 10mg todas las noches desde hace 6 años", "escitalopram"],
    ["Escitalopram 10mg Pregabalina 150mg", "pregabalina"],
    ["pregabalina 75 mg, duloxetina 30 mg 1/2 tableta, fibromialgia", "duloxetina"],
    ["tratado mediante fluoxetina y paroxetina hasta 2024", "fluoxetina"],
    ["Depreción, medicamento benlafaxina, mirtazapina, por 6 meses", "mirtazapina"],
    ["Nicotina, cafeína, marihuana, sertralina y alcohol", "sertralina"],
  ];
  for (const [texto, esperado] of casos) {
    const encontrados = farmacosEnTexto(texto).map((h) => h.generico);
    assert.ok(encontrados.includes(esperado), `en «${texto.slice(0, 40)}…» falta ${esperado}`);
  }
});

test("nombra la clase, porque es lo que la persona no sabe", async () => {
  // Duloxetina es IRSN y pregabalina anticonvulsivo: las dos están en la
  // declaración que se firma, y ninguna se llama "ISRS".
  assert.deepEqual(clasesEncontradas(farmacosEnTexto("duloxetina 30 mg")), [
    "IRSN u otro antidepresivo",
  ]);
  assert.deepEqual(clasesEncontradas(farmacosEnTexto("pregabalina 150mg")), [
    "anticonvulsivo o estabilizador",
  ]);
});

test("reconoce el nombre comercial, que es el que la gente escribe", async () => {
  // Nadie escribe "escitalopram" si la caja dice Lexapro.
  for (const [comercial, generico] of [
    ["Tomo Lexapro 10mg", "escitalopram"],
    ["Prozac desde hace años", "fluoxetina"],
    ["Altruline 50", "sertralina"],
    ["Lyrica para el dolor", "pregabalina"],
    ["Rivotril para dormir", null],
    ["Seroquel 25mg", "quetiapina"],
  ] as [string, string | null][]) {
    const encontrados = farmacosEnTexto(comercial).map((h) => h.generico);
    if (generico) assert.ok(encontrados.includes(generico), `${comercial} → ${generico}`);
  }
});

test("encuentra la hierba de San Juan, que se cuenta como suplemento", async () => {
  // Se compra sin receta y nadie la reporta como medicamento, pero es IMAO.
  assert.deepEqual(clasesEncontradas(farmacosEnTexto("tomo hipérico para el ánimo")), ["IMAO"]);
});

test("encuentra lo que la declaración no nombra y es riesgo igual", async () => {
  // Se recetan para dolor, migraña o tos: nadie los cuenta como psicofármacos.
  for (const texto of ["tramadol para la espalda", "Imigran cuando me da migraña"]) {
    assert.deepEqual(clasesEncontradas(farmacosEnTexto(texto)), ["riesgo serotoninérgico"]);
  }
});

test("tolera acentos escritos o no", async () => {
  assert.equal(farmacosEnTexto("fenitoina").length, 1);
  assert.equal(farmacosEnTexto("fenitoína").length, 1);
  assert.equal(farmacosEnTexto("bupropion").length, 1);
});

test("no salta dentro de otra palabra", async () => {
  // "litio" dentro de "analítico" convertiría la bandera en ruido.
  assert.deepEqual(farmacosEnTexto("pensamiento analitico y solitario"), []);
  assert.deepEqual(farmacosEnTexto("nada relevante que reportar"), []);
});

test("una ficha sin medicación no levanta nada", async () => {
  for (const texto of ["No", "Ninguno", "", "Solo vitaminas y magnesio"]) {
    assert.deepEqual(farmacosEnTexto(texto), []);
  }
});
