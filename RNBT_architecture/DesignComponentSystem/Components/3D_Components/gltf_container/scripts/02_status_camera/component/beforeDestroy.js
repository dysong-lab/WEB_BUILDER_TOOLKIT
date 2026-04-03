/**
 * gltf_container — 02_status_camera / component / beforeDestroy
 *
 * MeshStateMixin + CameraFocusMixin 정리
 */

const { removeCustomEvents } = Wkit;

removeCustomEvents(this, this.customEvents);
this.meshState?.destroy();
this.cameraFocus?.destroy();
this.resolveMeshName = null;
