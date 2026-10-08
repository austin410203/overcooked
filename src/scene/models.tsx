import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/** Blender-built assets in /public/models (see tools/blender). */
import { modelUrl } from './modelSource';
export { modelUrl };

export const ALL_MODELS = [
  'char_chef', 'char_prep', 'char_server', 'char_runner', 'char_office', 'char_tourist',
  'car_yellow', 'car_blue', 'car_red', 'car_green', 'car_truck', 'car_vip', 'car_festival', 'car_van', 'car_bus', 'car_police',
  'st_grill', 'st_fryer', 'st_drink', 'st_assembly', 'st_counter', 'st_storage', 'st_pickup', 'st_trash',
  'food_bun', 'food_patty_raw', 'food_patty_cooked', 'food_patty_burnt', 'food_burger', 'food_fries', 'food_fries_burnt',
  'food_nuggets', 'food_nuggets_burnt', 'food_soda', 'food_potato', 'food_chicken',
  'prop_tree0', 'prop_tree1', 'prop_tree2', 'prop_lamp', 'prop_traffic_light', 'prop_planter', 'prop_bench', 'prop_cone',
  'prop_barrier', 'prop_hydrant', 'prop_umbrella_table', 'prop_menu_board', 'prop_drive_thru_arch', 'prop_pylon', 'prop_kiosk',
];

export function preloadModels() { ALL_MODELS.forEach((m) => useGLTF.preload(modelUrl(m))); }

function prepare(root: THREE.Object3D, shadows: boolean) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) { m.castShadow = shadows; m.receiveShadow = true; }
  });
  return root;
}

/** Cloned instance of a model (materials/geometry shared). */
export function useModel(name: string, shadows = true) {
  const { scene } = useGLTF(modelUrl(name));
  return useMemo(() => prepare(scene.clone(true), shadows), [scene, shadows]);
}

export function Model({ name, shadows = true, ...props }: { name: string; shadows?: boolean } & JSX.IntrinsicElements['group']) {
  const obj = useModel(name, shadows);
  return <group {...props}><primitive object={obj} /></group>;
}

/** Joint heights used in tools/blender/characters.py (Blender z → three y) */
export const JOINTS = { hip: 0.42, shoulder: 0.8, neck: 0.88 };

/** Wraps each body part in a pivot group placed at its joint so it can swing. */
export function useCharacter(name: string) {
  const obj = useModel(name);
  return useMemo(() => {
    obj.updateMatrixWorld(true);
    const pivots: Record<string, THREE.Group> = {};
    const spec: Record<string, [number, number]> = {
      legL: [0.1, JOINTS.hip], legR: [-0.1, JOINTS.hip], armL: [0.24, JOINTS.shoulder], armR: [-0.24, JOINTS.shoulder],
      head: [0, JOINTS.neck], body: [0, JOINTS.hip],
    };
    for (const [part, [x, y]] of Object.entries(spec)) {
      const node = obj.getObjectByName(part);
      if (!node || !node.parent) continue;
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      node.parent.add(pivot);
      pivot.updateMatrixWorld(true);
      pivot.attach(node);
      pivots[part] = pivot;
    }
    return { obj, pivots };
  }, [obj]);
}
