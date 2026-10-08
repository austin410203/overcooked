import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

/** Cached rounded box geometry by exact size — the core of the soft "toy" look */
const rbCache = new Map<string, THREE.BufferGeometry>();
export function rbox(w: number, h: number, d: number, r = 0.06, seg = 2) {
  const k = `${w}|${h}|${d}|${r}|${seg}`;
  let g = rbCache.get(k);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)); rbCache.set(k, g); }
  return g;
}

const cyl = new Map<string, THREE.CylinderGeometry>();
export function cylinder(rt: number, rb: number, h: number, seg = 16) {
  const k = `${rt}|${rb}|${h}|${seg}`;
  let g = cyl.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, h, seg); cyl.set(k, g); }
  return g;
}

export const unitBox = new THREE.BoxGeometry(1, 1, 1);
export const unitPlane = new THREE.PlaneGeometry(1, 1);
export const sphere = new THREE.SphereGeometry(1, 16, 12);
export const lowSphere = new THREE.IcosahedronGeometry(1, 1);

/** Palette sampled from the reference: cream / bottle green / terracotta / mustard */
export const PAL = {
  cream: '#f3e6cc', creamDark: '#e4d2ad', sidewalk: '#ece0c6', curb: '#d9c8a4',
  asphalt: '#5f6870', asphaltNight: '#2c323b', dash: '#f7efdc', yellowLine: '#e8b84a',
  green: '#1f4d3a', greenMid: '#2f6b4f', grass: '#b9cf8f', grassDark: '#9cb874',
  terracotta: '#d9825b', terracottaDark: '#c46d4a', brick: '#b5523b', mustard: '#e3b04b',
  coral: '#ee6c4d', tomato: '#e04a3a', sky: '#9cc7d8', glass: '#4b6f86', glassNight: '#ffd98a',
  white: '#fbf6ea', ink: '#26302b', metal: '#8d969c', darkMetal: '#3c4349',
};
