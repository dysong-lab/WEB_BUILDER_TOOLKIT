/**
 * gltf_container — 03_status_popup / component / beforeDestroy
 *
 * MeshStateMixin + 3DShadowPopupMixin 정리
 */

const { removeCustomEvents } = Wkit;

removeCustomEvents(this, this.customEvents);
this.meshState?.destroy();
this.shadowPopup?.destroy();
this.resolveMeshName = null;
this.showDetail = null;
