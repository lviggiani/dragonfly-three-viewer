import * as THREE from "./vendor/threejs@150/three.module.js";

export const SHADER = {
    vertex: `
        uniform float p;
        varying float intensity;
        void main()
        {
            vec3 vNormal = normalize( normalMatrix * normal );
            intensity = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), p);
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

    fragment: `
        uniform vec3 glowColor;
        uniform float m;
        varying float intensity;
        void main()
        {
            vec3 glow = glowColor;
            gl_FragColor = vec4( glow * intensity, intensity * m );
        }`
}

export class XRayMaterial extends THREE.ShaderMaterial {
    constructor(color = 0xffffff){
        super({
            uniforms: {
              p: { type: "f", value: 3 },
              glowColor: { type: "c", value: new THREE.Color(color) },
              m: { type: "f", value: .65 }
            },
            vertexShader: SHADER.vertex,
            fragmentShader: SHADER.fragment,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
    }
}