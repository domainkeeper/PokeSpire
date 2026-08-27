type CameraListener = (config: {
  shake?: number;
  punch?: number;
  hitStop?: number;
  flash?: string;
  flashOpacity?: number;
}) => void;

class CameraFeedbackBus {
  private listeners: Set<CameraListener> = new Set();

  public subscribe(listener: CameraListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public trigger(config: {
    shake?: number;
    punch?: number;
    hitStop?: number;
    flash?: string;
    flashOpacity?: number;
  }) {
    for (const listener of this.listeners) {
      listener(config);
    }
  }
}

export const cameraFeedback = new CameraFeedbackBus();
