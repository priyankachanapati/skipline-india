// Google Maps type definitions
declare global {
  interface Window {
    google: {
      maps: typeof google.maps;
    };
  }
}

export {};
