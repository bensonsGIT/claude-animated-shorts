// The composition every short renders through: one three.js world (the short's world.ts) posed per frame from its
// story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
// A short supplies its world, timeline and extras through makeShort() (see src/videos/<name>/index.tsx).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import type { LightName } from "./lights";
import { Kit } from "./build";

/** what a short's world.ts World provides */
export type ShortWorld = {
  root: THREE.Object3D;
  /** pose everything for shot `id` at frame f; returns the camera's look target (the default focus point) */
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3;
};

export type ShortSpec = {
  /** async asset load (GLB kit) before the first frame */
  loadKit: () => Promise<Kit>;
  makeWorld: (kit: Kit) => ShortWorld;
  /** story.ts SHOTS (1-based shot ids index into it) */
  shots: readonly { light: LightName }[];
  /** the shot canvases on screen at frame f: one, or two during a crossfade */
  layersAt: (f: number) => { id: number; alpha: number }[];
  /** thin-lens settings per frame; focus defaults to the camera's look target */
  dofAt: (f: number) => { focus?: (f: number) => [number, number, number]; cInf: number };
  /** white flash opacity at frame f (see hookFlash) */
  flashAt: (f: number) => number;
  /** full-frame overlays at frame f, drawn over the picture and under the flash (glare, dim, ...) */
  overlay?: (f: number) => React.ReactNode;
  /** burnt-in captions (Remotion inputProps `{ captions: false }` turns them off for a clean render) */
  Captions?: React.FC;
};

/** the hook's 4-frame white flash starting at frame `at` */
export const hookFlash = (at: number) => (f: number) => (f >= at && f < at + 4 ? [1, 0.75, 0.45, 0.2][f - at] : 0);

export const captionsOn = () => (getInputProps() as { captions?: boolean }).captions !== false;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = (loadKit: ShortSpec["loadKit"]) => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("bridge kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle, loadKit]);
  return kit;
};

const Inner: React.FC<{ spec: ShortSpec; id: number; kit: Kit }> = ({ spec, id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => spec.makeWorld(kit), [spec, kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      <>{on.ink ? <primitive object={fx.ink} dispose={null} /> : null}</>
      <>{on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}</>
      <>{on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}</>
      <>{on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}</>
      <primitive object={fx.tone} dispose={null} />
      <>{on.grade ? <primitive object={fx.grade} dispose={null} /> : null}</>
      <>{on.grain ? <primitive object={fx.grain} dispose={null} /> : null}</>
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = spec.dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, spec.shots[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ spec: ShortSpec; id: number; kit: Kit; alpha: number }> = ({ spec, id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner spec={spec} id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const makeShort = (spec: ShortSpec): React.FC => {
  const Short: React.FC = () => {
    const f = useCurrentFrame();
    const kit = useKit(spec.loadKit);
    if (!kit) return null;
    const flash = spec.flashAt(f);
    const { Captions } = spec;
    return (
      <AbsoluteFill style={{ background: "#cfe3f2" }}>
        {spec.layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} spec={spec} id={l.id} kit={kit} alpha={l.alpha} />)}
        {spec.overlay?.(f)}
        {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
        {Captions && captionsOn() && <Captions />}
      </AbsoluteFill>
    );
  };
  return Short;
};
