"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import { useState, Suspense, useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three/webgpu";

useGLTF.preload("/objects/modules.glb");

interface Module {
  id: number;
  name: string;
  xPosition: number;
}

const modules: Module[] = [
  { id: 1, name: "Module Plank", xPosition: 0.7 },
  { id: 2, name: "Module Roede", xPosition: 2.7 },
  { id: 3, name: "Module Roede + Plank", xPosition: 4.7 },
  { id: 4, name: "Module Plank + Lade", xPosition: 6.7 },
  { id: 5, name: "Module Legplanken + Roede", xPosition: 8.7 },
  { id: 6, name: "Module Wasmachine", xPosition: 10.7 },
  { id: 7, name: "Module Roede Hoog", xPosition: 12.7 },
  { id: 8, name: "Module Roede Hoog + Lade", xPosition: 14.7 },
  { id: 9, name: "Module Roede Midden Lade", xPosition: 16.7 },
];

// Camera settings - adjust these values
const CAMERA_START_X = 0.7;
const CAMERA_Y = 1;
const CAMERA_Z = 4;
function CameraController({ activeModuleId }: { activeModuleId: number | null }) {
  const { camera } = useThree();
  const targetRef = useRef({ x: CAMERA_START_X });
  const prevX = useRef(CAMERA_START_X);
  const velocityRef = useRef(0);

  useEffect(() => {
    const module = modules.find((m) => m.id === activeModuleId);
    if (module) {
      gsap.to(targetRef.current, {
        x: module.xPosition,
        duration: 1,
        ease: "power2.inOut",
      });
    }
  }, [activeModuleId]);

  useFrame(() => {
    // Calculate velocity (change in position)
    const velocity = targetRef.current.x - prevX.current;
    prevX.current = targetRef.current.x;

    // Smooth the velocity for less jitter
    velocityRef.current += (velocity - velocityRef.current) * 0.1;

    camera.position.x = targetRef.current.x;
    camera.position.y = CAMERA_Y;
    camera.position.z = CAMERA_Z;

    // Look straight in the Z direction
    camera.lookAt(targetRef.current.x, CAMERA_Y, -100);

    // Tilt based on velocity - faster movement = more tilt
    camera.rotation.z = velocityRef.current * 0.3;
  });

  return null;
}

function ModulesModel() {
  const { scene } = useGLTF("/objects/modules.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child) {
        child.castShadow = true;
        child.receiveShadow = true;
      }

    });
  }, [scene]);

  return <primitive object={scene} />;
}


function MobileModuleSelect({
  activeModule,
  setActiveModule,
}: {
  activeModule: number | null;
  setActiveModule: (id: number | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModule = modules.find((m) => m.id === activeModule);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="md:hidden relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-lg font-poppins font-medium bg-white text-primary border-2 border-white cursor-pointer flex items-center justify-between"
      >
        <span>{selectedModule?.name ?? "Selecteer een module"}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border-2 border-primary overflow-hidden z-50 shadow-lg">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => {
                setActiveModule(module.id);
                setIsOpen(false);
              }}
              className={`w-full p-4 text-left font-poppins font-medium transition-colors ${
                activeModule === module.id
                  ? "bg-primary/10 text-primary"
                  : "bg-white text-primary hover:bg-primary/10"
              }`}
            >
              {module.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModuleHighlight() {
  const [activeModule, setActiveModule] = useState<number | null>(null);

  return (
    <div className="w-full px-12 py-16 md:py-32 bg-primary my-12">
      <div className="container mx-auto">
      <div className="flex gap-8 flex-col md:flex-row">
        {/* Left side - Module list */}
        <div className="flex-1">
        <div className="max-w-7xl ">
        <p className="text-left text-white/80 text-xl max-w-2xl mb-6">
          Benieuwd naar onze modules?
        </p>
        <h2 className="text-4xl md:text-5xl mb-16 font-bold text-left text-white">
          Bekijk al onze modules
        </h2>
        </div>
          {/* Mobile: Custom dropdown */}
          <MobileModuleSelect activeModule={activeModule} setActiveModule={setActiveModule} />

          {/* Desktop: Button grid */}
          <div className="hidden md:flex flex-row flex-wrap items-center max-w-3xl gap-2">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`p-4 rounded-full font-poppins cursor-pointer transition-colors duration-300  border-2 border-white ${
                  activeModule === module.id
                    ? "bg-white text-primary"
                    : "bg-primary hover:bg-white text-white hover:text-primary"
                }`}
                onClick={() => setActiveModule(module.id)}
              >
                <span className="font-medium">{module.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Three.js Canvas */}
        <div className="flex-1 aspect-square bg-gray-900 rounded-xl overflow-hidden">
          <Canvas
            shadows
            camera={{ position: [CAMERA_START_X, CAMERA_Y, CAMERA_Z], fov: 40 }}
            frameloop="always"
            gl={async (props) => {
              const renderer = new THREE.WebGPURenderer({
                ...(props as object),
                antialias: true,
              });
              await renderer.init();
              return renderer;
            }}
          >
            <ambientLight intensity={1} />
            <directionalLight
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
              shadow-bias={-0.0005}
              position={[-4, 6, 3]}
              intensity={0.7}
              castShadow
            />
            {/* <pointLight position={[10, 10, 10]} /> */}
            <Suspense fallback={null}>
              <ModulesModel />
              <Environment
                files={[
                  "/cubemaps/module-highlight/px.png",
                  "/cubemaps/module-highlight/nx.png",
                  "/cubemaps/module-highlight/py.png",
                  "/cubemaps/module-highlight/ny.png",
                  "/cubemaps/module-highlight/pz.png",
                  "/cubemaps/module-highlight/nz.png",
                ]}
                background
              />
            </Suspense>
            {/* <OrbitControls /> */}
            <CameraController activeModuleId={activeModule} />
          </Canvas>
        </div>
      </div>
      </div>
    </div>
  );
}

